import { z } from "zod";
import { conversar } from "../bot/conversacion/prompt.ts";
import { respuestaPublicable } from "../bot/conversacion/reglas.ts";
import type { Turno } from "../bot/shared/hilo.ts";
import { investigarAfirmacion } from "../bot/verificacion/investigacion.ts";
import { extraerAfirmacion } from "../bot/verificacion/prompts.ts";

// Proveedor de promptfoo: corre el mismo código del Workflow, con Workers AI por REST en vez del binding.
// Necesita CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (permiso Workers AI) y TAVILY_API_KEY.

const RespuestaCloudflare = z.object({ success: z.boolean(), result: z.unknown(), errors: z.array(z.unknown()) });

function workersAi(cuenta: string, token: string): Ai {
  const run = async (modelo: string, entrada: unknown) => {
    const respuesta = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cuenta}/ai/run/${modelo}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(entrada),
    });
    const cuerpo = RespuestaCloudflare.parse(await respuesta.json());
    if (!cuerpo.success) {
      throw new Error(`workers ai ${respuesta.status}: ${JSON.stringify(cuerpo.errors)}`);
    }
    return cuerpo.result;
  };
  return { run } as unknown as Ai;
}

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`falta la variable de entorno ${nombre}`);
  }
  return valor;
}

// Como CON_REINTENTOS del Workflow: hasta 3 reintentos con espera creciente, para que un corte de red no bote el escenario.
async function conReintentos<T>(nombre: string, fn: () => Promise<T>): Promise<T> {
  for (let intento = 0; ; intento++) {
    try {
      return await fn();
    } catch (error) {
      if (intento >= 3) {
        throw new Error(`${nombre}: ${String(error)} ${String((error as Error).cause ?? "")}`);
      }
      await new Promise((r) => setTimeout(r, 2000 * 2 ** intento));
    }
  }
}

const PAGINA = "https://escierto.org/a/00000000-0000-0000-0000-000000000000";

const Vars = z.discriminatedUnion("modo", [
  z.object({ modo: z.literal("verificar"), publicacion: z.string(), pregunta: z.string().default("¿es cierto?") }),
  z.object({
    modo: z.literal("conversar"),
    investigacion: z.string().nullable().default(null),
    // El YAML arma el hilo con un ancla (`*hilo-base`) que queda anidada; se aplana.
    hilo: z.preprocess((v) => (Array.isArray(v) ? v.flat() : v), z.array(z.object({ deBot: z.boolean(), texto: z.string() }))),
  }),
]);

export default class ProveedorEsCierto {
  id() {
    return "escierto";
  }

  async callApi(_prompt: string, context: { vars: Record<string, unknown> }) {
    const ai = workersAi(requerida("CLOUDFLARE_ACCOUNT_ID"), requerida("CLOUDFLARE_API_TOKEN"));
    const vars = Vars.parse(context.vars);

    if (vars.modo === "conversar") {
      const hilo: Turno[] = vars.hilo.map((t) => ({ ...t, texto: t.texto.replace("{{pagina}}", PAGINA) }));
      const borrador = await conReintentos("conversar", () => conversar(ai, hilo, vars.investigacion));
      return { output: respuestaPublicable(borrador, vars.investigacion, vars.investigacion ? PAGINA : null) };
    }

    const extraida = await conReintentos("extraer afirmación", () => extraerAfirmacion(ai, vars.publicacion, vars.pregunta));
    if (!extraida.verificable) {
      return { output: JSON.stringify({ verificable: false, afirmacion: extraida.afirmacion }) };
    }
    const { informe, veredicto, consultas } = await investigarAfirmacion(
      conReintentos,
      { ai, tavilyApiKey: requerida("TAVILY_API_KEY") },
      extraida.afirmacion,
      "",
    );
    return { output: JSON.stringify({ verificable: true, afirmacion: extraida.afirmacion, ...veredicto, consultas, informe }) };
  }
}
