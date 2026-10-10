import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { z } from "zod";
import { Mencion } from "./redes/bluesky.ts";
import { red } from "./redes/red.ts";
import { textoDeCorreccion } from "./verificacion/reglas.ts";
import { type PedidoCorreccion, Veredicto } from "./verificacion/veredicto.ts";

// Principio 5 de la IFCN: la corrección llega a quien vio el error. Se publica una investigación nueva que reemplaza a
// la anterior y el bot responde en cada hilo donde había dado el veredicto equivocado. Cada respuesta es su propio
// step.do: si el Workflow se reintenta, un hilo ya avisado no recibe el aviso dos veces.

// Lo que se guardó de cada mención al encolarla (index.ts), para poder volver a su hilo.
export const DatosMencion = z.object({ mencion: Mencion, red: z.enum(["bluesky", "web"]) });

const CON_REINTENTOS = {
  retries: { limit: 3, delay: "15 seconds", backoff: "exponential" },
  timeout: "5 minutes",
} as const;

export class Correccion extends WorkflowEntrypoint<Env, PedidoCorreccion> {
  async run(evento: WorkflowEvent<PedidoCorreccion>, step: WorkflowStep) {
    const pedido = evento.payload;
    const env = this.env;

    const anterior = await step.do("cargar investigación corregida", async () => {
      const fila = await env.DB.prepare("SELECT veredicto, corregida_por FROM investigaciones WHERE id = ?")
        .bind(pedido.investigacionId)
        .first();
      if (!fila) {
        throw new Error(`investigación ${pedido.investigacionId} no existe`);
      }
      return z.object({ veredicto: Veredicto.shape.veredicto, corregida_por: z.string().nullable() }).parse(fila);
    });
    if (anterior.corregida_por) {
      return; // ya tiene una corrección; la siguiente se hace sobre la versión nueva
    }

    const nuevaId = await step.do("nuevo id", async () => crypto.randomUUID());
    await step.do("guardar corrección", async () => {
      // Las dos escrituras van juntas: nunca queda una corrección sin enlazar ni una investigación marcada sin reemplazo.
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO investigaciones (id, afirmacion, veredicto, confianza, resumen, fuentes, informe, modelo, anterior_id, nota_correccion, creado_en)
           SELECT ?, afirmacion, ?, ?, ?, ?, informe, modelo, id, ?, ? FROM investigaciones WHERE id = ?`,
        ).bind(
          nuevaId,
          pedido.veredicto,
          pedido.confianza,
          pedido.resumen,
          JSON.stringify(pedido.fuentes),
          pedido.nota,
          Date.now(),
          pedido.investigacionId,
        ),
        env.DB.prepare("UPDATE investigaciones SET corregida_por = ? WHERE id = ?").bind(
          nuevaId,
          pedido.investigacionId,
        ),
      ]);
    });

    const menciones = await step.do("menciones a avisar", async () => {
      const { results } = await env.DB.prepare(
        "SELECT uri, datos FROM menciones WHERE investigacion_id = ? AND datos IS NOT NULL",
      )
        .bind(pedido.investigacionId)
        .all();
      return results.map((fila) => z.object({ uri: z.string(), datos: z.string() }).parse(fila));
    });

    const texto = textoDeCorreccion(anterior.veredicto, pedido.veredicto, pedido.nota);
    const enlace = `${env.PUBLIC_URL}/a/${nuevaId}`;
    for (const { uri, datos } of menciones) {
      await step.do(`avisar en ${uri}`, CON_REINTENTOS, async () => {
        const { mencion, red: nombre } = DatosMencion.parse(JSON.parse(datos));
        await red(env, nombre).responder(mencion, texto, enlace);
      });
    }
  }
}
