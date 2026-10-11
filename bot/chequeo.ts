import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { conversar } from "./conversacion/prompt.ts";
import { investigacionDelHilo, puedeSeguirConversando, respuestaPublicable } from "./conversacion/reglas.ts";
import type { Mencion } from "./redes/bluesky.ts";
import { red, type NombreRed, type Red } from "./redes/red.ts";
import { MODELO } from "./shared/modelo.ts";
import { investigarAfirmacion, type Paso } from "./verificacion/investigacion.ts";
import { extraerAfirmacion } from "./verificacion/prompts.ts";
import { decidir } from "./verificacion/reglas.ts";
import { agotoNeuronas, hastaElDiaSiguiente, SinSaldo } from "./shared/saldo.ts";
import { verificacionesPublicadas } from "./verificacion/verificacionesPublicadas.ts";
import { ETIQUETAS, type Veredicto } from "./verificacion/veredicto.ts";

export interface ParamsChequeo {
  mencion: Mencion;
  red: NombreRed;
}

const CON_REINTENTOS = {
  retries: { limit: 3, delay: "15 seconds", backoff: "exponential" },
  timeout: "15 minutes",
} as const;

export async function idDeInstancia(uri: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(uri));
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 64);
}

export class Chequeo extends WorkflowEntrypoint<Env, ParamsChequeo> {
  private async conversar(mencion: Mencion, red: Red, step: WorkflowStep) {
    const env = this.env;
    const hilo = await step.do("leer hilo", () => red.leerHilo(mencion.uri));
    if (!puedeSeguirConversando(hilo)) {
      return;
    }

    const { investigacion, pagina } = await step.do("cargar investigación del hilo", async () => {
      const id = investigacionDelHilo(hilo);
      const fila = id
        ? await env.DB.prepare(
            "SELECT afirmacion, veredicto, confianza, resumen, fuentes, informe, creado_en FROM investigaciones WHERE id = ?",
          )
            .bind(id)
            .first()
        : null;
      return fila
        ? { investigacion: JSON.stringify(fila), pagina: `${env.PUBLIC_URL}/a/${id}` }
        : { investigacion: null, pagina: null };
    });

    const borrador = await this.conSaldo(mencion, red, step)("conversar", () => conversar(env.AI, hilo, investigacion));
    const respuesta = respuestaPublicable(borrador, investigacion, pagina);

    await step.do("responder en el hilo", async () => {
      await red.responder(mencion, respuesta);
    });
  }

  private conSaldo(mencion: Mencion, red: Red, step: WorkflowStep): Paso {
    const paso = async (nombre: string, fn: () => Promise<Rpc.Serializable<unknown>>) => {
      for (let intento = 1; ; intento++) {
        const resultado = await step.do(intento === 1 ? nombre : `${nombre} (${intento})`, CON_REINTENTOS, async () => {
          try {
            return await fn();
          } catch (error) {
            if (error instanceof SinSaldo || agotoNeuronas(error)) {
              return null;
            }
            throw error;
          }
        });
        if (resultado !== null) {
          return resultado;
        }
        await step.do("avisar que se acabó el saldo", async () => {
          await red.responder(
            mencion,
            "Se me acabó el saldo gratis de hoy. No me olvido: te respondo aquí mismo apenas se renueve, normalmente mañana.",
          );
        });
        const espera = await step.do(`calcular espera ${nombre} ${intento}`, async () =>
          hastaElDiaSiguiente(Date.now()),
        );
        await step.sleep(`esperar saldo ${nombre} ${intento}`, espera);
      }
    };
    return paso as unknown as Paso;
  }

  async run(evento: WorkflowEvent<ParamsChequeo>, step: WorkflowStep) {
    const { mencion } = evento.payload;
    const enRed = red(this.env, evento.payload.red);
    try {
      if (mencion.razon === "reply") {
        await this.conversar(mencion, enRed, step);
      } else {
        await this.verificar(mencion, enRed, step);
      }
    } catch (error) {
      await step.do("avisar que falló", async () => {
        await enRed.responder(
          mencion,
          "No pude terminar esta respuesta por un error de mi lado. Quedó registrado para revisarlo; puedes volver a mencionarme en un rato.",
        );
      });
      throw error;
    }
  }

  private async verificar(mencion: Mencion, enRed: Red, step: WorkflowStep) {
    const env = this.env;
    const paso = this.conSaldo(mencion, enRed, step);

    const publicacion = await step.do("leer publicación", async () =>
      mencion.padre ? enRed.textoDePost(mencion.padre.uri) : "",
    );

    const extraida = await paso("extraer afirmación", () => extraerAfirmacion(env.AI, publicacion, mencion.texto));

    if (!extraida.verificable) {
      await step.do("responder sin afirmación", async () => {
        await enRed.responder(
          mencion,
          "No encontré un hecho que se pueda verificar: parece opinión. Si hay un dato concreto, etiquétame en la publicación que lo contiene.",
        );
      });
      return;
    }

    const vector = await paso("embedding", async () => {
      const resultado = await env.AI.run("@cf/baai/bge-m3", { text: [extraida.afirmacion] });
      if (!("data" in resultado) || !resultado.data?.[0]) {
        throw new Error("bge-m3 no devolvió embedding");
      }
      return resultado.data[0];
    });

    const decision = await step.do("buscar investigación previa", async () => {
      const { matches } = await env.VECTORIZE.query(vector, { topK: 1, returnMetadata: "all" });
      const parecido = matches[0];
      return decidir(
        parecido && { id: parecido.id, score: parecido.score, creadoEn: Number(parecido.metadata?.creado_en) },
        Date.now(),
      );
    });

    let investigacionId: string;
    if (decision.tipo === "reciclar") {
      investigacionId = decision.id;
    } else {
      const anterior =
        decision.tipo === "complementar"
          ? await step.do("cargar investigación anterior", async () => {
              const fila = await env.DB.prepare(
                "SELECT veredicto, resumen, fuentes, informe, creado_en FROM investigaciones WHERE id = ?",
              )
                .bind(decision.id)
                .first();
              return JSON.stringify(fila);
            })
          : undefined;

      const verificaciones = await paso("buscar verificaciones publicadas", () =>
        verificacionesPublicadas(env.GOOGLE_FACTCHECK_KEY, extraida.afirmacion),
      );

      const { informe, veredicto } = await investigarAfirmacion(
        paso,
        { ai: env.AI, tavilyApiKey: env.TAVILY_API_KEY },
        extraida.afirmacion,
        verificaciones,
        anterior,
      );

      investigacionId = await step.do("nuevo id", async () => crypto.randomUUID());
      await step.do("guardar investigación", async () => {
        const creadoEn = Date.now();
        await env.DB.prepare(
          "INSERT INTO investigaciones (id, afirmacion, veredicto, confianza, resumen, fuentes, informe, modelo, anterior_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
        )
          .bind(
            investigacionId,
            extraida.afirmacion,
            veredicto.veredicto,
            veredicto.confianza,
            veredicto.resumen,
            JSON.stringify(veredicto.fuentes),
            informe,
            MODELO,
            decision.tipo === "complementar" ? decision.id : null,
            creadoEn,
          )
          .run();
        await env.VECTORIZE.upsert([{ id: investigacionId, values: vector, metadata: { creado_en: creadoEn } }]);
      });
    }

    await step.do("responder", async () => {
      const fila = await env.DB.prepare("SELECT veredicto, confianza, resumen FROM investigaciones WHERE id = ?")
        .bind(investigacionId)
        .first<{ veredicto: Veredicto["veredicto"]; confianza: string; resumen: string }>();
      if (!fila) {
        throw new Error(`investigación ${investigacionId} no existe`);
      }
      await enRed.responder(
        mencion,
        `${ETIQUETAS[fila.veredicto]} · confianza ${fila.confianza}\n${fila.resumen}`,
        `${env.PUBLIC_URL}/a/${investigacionId}`,
      );
    });

    await step.do("vincular mención", async () => {
      await env.DB.prepare("UPDATE menciones SET investigacion_id = ? WHERE uri = ?")
        .bind(investigacionId, mencion.uri)
        .run();
    });
  }
}
