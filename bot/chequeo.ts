import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { conversar } from "./conversacion/prompt.ts";
import { investigacionDelHilo, puedeSeguirConversando, respuestaPublicable } from "./conversacion/reglas.ts";
import type { Mencion } from "./redes/bluesky.ts";
import { red, type NombreRed, type Red } from "./redes/red.ts";
import { MODELO } from "./shared/modelo.ts";
import { investigarAfirmacion, type Paso } from "./verificacion/investigacion.ts";
import { extraerAfirmacion } from "./verificacion/prompts.ts";
import { decidir, diaUTC, hastaElDiaSiguiente, INVESTIGACIONES_POR_DIA } from "./verificacion/reglas.ts";
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

    const borrador = await step.do("conversar", CON_REINTENTOS, () => conversar(env.AI, hilo, investigacion));
    const respuesta = respuestaPublicable(borrador, investigacion, pagina);

    await step.do("responder en el hilo", async () => {
      await red.responder(mencion, respuesta);
    });
  }

  private async reservarCupo(mencion: Mencion, red: Red, step: WorkflowStep) {
    const env = this.env;
    for (let intento = 1; ; intento++) {
      const reservado = await step.do(`reservar cupo ${intento}`, async () => {
        const fila = await env.DB.prepare(
          "INSERT INTO cupos (dia, usados) VALUES (?1, 1) ON CONFLICT (dia) DO UPDATE SET usados = usados + 1 WHERE usados < ?2 RETURNING usados",
        )
          .bind(diaUTC(Date.now()), INVESTIGACIONES_POR_DIA)
          .first();
        return fila !== null;
      });
      if (reservado) {
        return;
      }
      if (intento === 1) {
        await step.do("avisar que espera", async () => {
          await red.responder(
            mencion,
            "Hoy ya hice todas las investigaciones que alcanzo a pagar. Esta queda en la fila: te respondo aquí mismo apenas se libere un cupo, normalmente mañana.",
          );
        });
      }
      const espera = await step.do(`calcular espera ${intento}`, async () => hastaElDiaSiguiente(Date.now()));
      await step.sleep(`esperar el día siguiente ${intento}`, espera);
    }
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

    const publicacion = await step.do("leer publicación", async () =>
      mencion.padre ? enRed.textoDePost(mencion.padre.uri) : "",
    );

    const extraida = await step.do("extraer afirmación", CON_REINTENTOS, () =>
      extraerAfirmacion(env.AI, publicacion, mencion.texto),
    );

    if (!extraida.verificable) {
      await step.do("responder sin afirmación", async () => {
        await enRed.responder(
          mencion,
          "No encontré un hecho que se pueda verificar: parece opinión. Si hay un dato concreto, etiquétame en la publicación que lo contiene.",
        );
      });
      return;
    }

    const vector = await step.do("embedding", async () => {
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

      await this.reservarCupo(mencion, enRed, step);

      const verificaciones = await step.do("buscar verificaciones publicadas", CON_REINTENTOS, () =>
        verificacionesPublicadas(env.GOOGLE_FACTCHECK_KEY, extraida.afirmacion),
      );

      const paso = ((nombre: string, fn: () => Promise<string>) =>
        step.do(nombre, CON_REINTENTOS, fn)) as unknown as Paso;
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
