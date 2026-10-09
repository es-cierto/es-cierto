import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { z } from "zod";
import { leerHilo, responder, sesionBluesky, textoDePost, type Mencion } from "./bluesky.ts";
import { conversar, extraerAfirmacion, investigar, redactarVeredicto, type Veredicto } from "./claude.ts";
import { analisisDelHilo, decidir, exigirEvidencia, puedeSeguirConversando } from "./decidir.ts";

export interface ParamsChequeo {
  mencion: Mencion;
}

const CON_REINTENTOS = {
  retries: { limit: 3, delay: "15 seconds", backoff: "exponential" },
  timeout: "15 minutes",
} as const;

export const ETIQUETAS: Record<Veredicto["veredicto"], string> = {
  verdadero: "✅ Verdadero",
  mayormente_verdadero: "☑️ Mayormente verdadero",
  enganoso: "⚠️ Engañoso",
  falso: "❌ Falso",
  no_verificable: "❔ No verificable",
};

const RespuestaFactCheck = z.object({
  claims: z
    .array(
      z.object({
        text: z.string().optional(),
        claimReview: z.array(
          z.object({
            publisher: z.object({ name: z.string().optional() }).optional(),
            url: z.string(),
            textualRating: z.string().optional(),
            reviewDate: z.string().optional(),
          }),
        ),
      }),
    )
    .default([]),
});

async function verificacionesPublicadas(apiKey: string, afirmacion: string): Promise<string> {
  const url = new URL("https://factchecktools.googleapis.com/v1alpha1/claims:search");
  url.search = new URLSearchParams({ query: afirmacion, languageCode: "es", pageSize: "5", key: apiKey }).toString();
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`fact check tools ${respuesta.status}: ${await respuesta.text()}`);
  }
  const { claims } = RespuestaFactCheck.parse(await respuesta.json());
  return claims
    .flatMap((c) =>
      c.claimReview.map(
        (r) =>
          `- "${c.text ?? ""}" → ${r.textualRating ?? "?"} (${r.publisher?.name ?? "?"}, ${r.reviewDate ?? "sin fecha"}) ${r.url}`,
      ),
    )
    .join("\n");
}

export class Chequeo extends WorkflowEntrypoint<Env, ParamsChequeo> {
  private async conversar(mencion: Mencion, step: WorkflowStep) {
    const env = this.env;
    const hilo = await step.do("leer hilo", async () => leerHilo(await sesionBluesky(env), mencion.uri));
    if (!puedeSeguirConversando(hilo)) {
      return;
    }

    const analisis = await step.do("cargar análisis del hilo", async () => {
      const id = analisisDelHilo(hilo);
      if (!id) {
        return null;
      }
      const fila = await env.DB.prepare(
        "SELECT afirmacion, veredicto, confianza, resumen, fuentes, creado_en FROM analisis WHERE id = ?",
      )
        .bind(id)
        .first();
      return fila ? JSON.stringify({ ...fila, pagina: `${env.PUBLIC_URL}/a/${id}` }) : null;
    });

    const respuesta = await step.do("conversar", CON_REINTENTOS, () =>
      conversar(env.ANTHROPIC_API_KEY, hilo, analisis),
    );

    await step.do("responder en el hilo", async () => {
      await responder(await sesionBluesky(env), mencion, respuesta);
    });
  }

  async run(evento: WorkflowEvent<ParamsChequeo>, step: WorkflowStep) {
    const { mencion } = evento.payload;
    const env = this.env;

    if (mencion.razon === "reply") {
      await this.conversar(mencion, step);
      return;
    }

    const publicacion = await step.do("leer publicación", async () =>
      mencion.padre ? textoDePost(await sesionBluesky(env), mencion.padre.uri) : "",
    );

    const extraida = await step.do("extraer afirmación", CON_REINTENTOS, () =>
      extraerAfirmacion(env.ANTHROPIC_API_KEY, publicacion, mencion.texto),
    );

    if (!extraida.verificable) {
      await step.do("responder sin afirmación", async () => {
        await responder(
          await sesionBluesky(env),
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

    const decision = await step.do("buscar análisis previo", async () => {
      const { matches } = await env.VECTORIZE.query(vector, { topK: 1, returnMetadata: "all" });
      const parecido = matches[0];
      return decidir(
        parecido && { id: parecido.id, score: parecido.score, creadoEn: Number(parecido.metadata?.creado_en) },
        Date.now(),
      );
    });

    let analisisId: string;
    if (decision.tipo === "reciclar") {
      analisisId = decision.id;
    } else {
      const anterior =
        decision.tipo === "complementar"
          ? await step.do("cargar análisis anterior", async () => {
              const fila = await env.DB.prepare(
                "SELECT veredicto, resumen, fuentes, creado_en FROM analisis WHERE id = ?",
              )
                .bind(decision.id)
                .first();
              return JSON.stringify(fila);
            })
          : undefined;

      const verificaciones = await step.do("buscar verificaciones publicadas", CON_REINTENTOS, () =>
        verificacionesPublicadas(env.GOOGLE_FACTCHECK_KEY, extraida.afirmacion),
      );

      const informe = await step.do("investigar", CON_REINTENTOS, () =>
        investigar(env.ANTHROPIC_API_KEY, extraida.afirmacion, verificaciones, anterior),
      );

      const redactado = await step.do("redactar veredicto", CON_REINTENTOS, () =>
        redactarVeredicto(env.ANTHROPIC_API_KEY, extraida.afirmacion, informe),
      );
      const veredicto = exigirEvidencia(redactado);

      analisisId = await step.do("nuevo id", async () => crypto.randomUUID());
      await step.do("guardar análisis", async () => {
        const creadoEn = Date.now();
        await env.DB.prepare(
          "INSERT INTO analisis (id, afirmacion, veredicto, confianza, resumen, fuentes, anterior_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
        )
          .bind(
            analisisId,
            extraida.afirmacion,
            veredicto.veredicto,
            veredicto.confianza,
            veredicto.resumen,
            JSON.stringify(veredicto.fuentes),
            decision.tipo === "complementar" ? decision.id : null,
            creadoEn,
          )
          .run();
        await env.VECTORIZE.upsert([{ id: analisisId, values: vector, metadata: { creado_en: creadoEn } }]);
      });
    }

    await step.do("responder", async () => {
      const fila = await env.DB.prepare("SELECT veredicto, confianza, resumen FROM analisis WHERE id = ?")
        .bind(analisisId)
        .first<{ veredicto: Veredicto["veredicto"]; confianza: string; resumen: string }>();
      if (!fila) {
        throw new Error(`análisis ${analisisId} no existe`);
      }
      await responder(
        await sesionBluesky(env),
        mencion,
        `${ETIQUETAS[fila.veredicto]} · confianza ${fila.confianza}\n${fila.resumen}`,
        `${env.PUBLIC_URL}/a/${analisisId}`,
      );
    });

    await step.do("vincular mención", async () => {
      await env.DB.prepare("UPDATE menciones SET analisis_id = ? WHERE uri = ?").bind(analisisId, mencion.uri).run();
    });
  }
}
