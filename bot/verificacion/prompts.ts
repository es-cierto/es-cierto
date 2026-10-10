import { z } from "zod";
import { completar, REGLA_DATO } from "../shared/modelo.ts";
import { Veredicto } from "./veredicto.ts";

export const Afirmacion = z.object({
  verificable: z.boolean().describe("false si es pura opinión, chiste, insulto o no contiene un hecho comprobable"),
  afirmacion: z.string().describe("la afirmación de hecho, reformulada de forma neutra y autocontenida, en español"),
});
export type Afirmacion = z.infer<typeof Afirmacion>;

export const PlanBusqueda = z.object({
  suficiente: z
    .boolean()
    .describe("true si los resultados ya bastan para confirmar o desmentir la afirmación con fuentes confiables"),
  consultas: z
    .array(z.string())
    .describe("si no es suficiente: entre 1 y 3 búsquedas web nuevas, cortas, distintas de las ya hechas"),
});
export type PlanBusqueda = z.infer<typeof PlanBusqueda>;

export async function extraerAfirmacion(ai: Ai, publicacion: string, pregunta: string): Promise<Afirmacion> {
  const crudo = await completar(ai, {
    esfuerzo: "low",
    json: Afirmacion,
    system: `Eres el primer paso de ¿Es Cierto?, un verificador de datos abierto y no partidista. Alguien te etiquetó para preguntar si algo es cierto. Identifica la afirmación de hecho principal que hay que verificar. ${REGLA_DATO}`,
    usuario: `<publicacion>${publicacion}</publicacion>\n<pregunta>${pregunta}</pregunta>`,
  });
  return Afirmacion.parse(JSON.parse(crudo));
}

export async function planificarBusquedas(
  ai: Ai,
  afirmacion: string,
  hechas: string[],
  resultados: string,
): Promise<PlanBusqueda> {
  const crudo = await completar(ai, {
    esfuerzo: "medium",
    json: PlanBusqueda,
    system: `Eres el investigador de ¿Es Cierto?, un verificador de datos abierto y no partidista. Decide si la evidencia reunida basta para confirmar o desmentir la afirmación. Si no basta, propón búsquedas web nuevas que llenen lo que falta: fuentes primarias (datos oficiales, leyes, estudios), verificaciones profesionales, la fecha o el contexto del dato. No repitas búsquedas ya hechas; si una no sirvió, cambia el enfoque (otras palabras, otro idioma, la fuente oficial directa). ${REGLA_DATO}`,
    usuario: [
      `<afirmacion>${afirmacion}</afirmacion>`,
      hechas.length ? `Búsquedas ya hechas:\n${hechas.map((c) => `- ${c}`).join("\n")}` : "Todavía no hay búsquedas.",
      `<resultados>\n${resultados || "(sin resultados)"}\n</resultados>`,
    ].join("\n\n"),
  });
  return PlanBusqueda.parse(JSON.parse(crudo));
}

export async function investigar(
  ai: Ai,
  afirmacion: string,
  resultados: string,
  verificaciones: string,
  anterior?: string,
): Promise<string> {
  return completar(ai, {
    esfuerzo: "high",
    system: `Eres el investigador de ¿Es Cierto?, un verificador de datos abierto y no partidista. Con los resultados de búsqueda que te damos, escribe un informe de evidencia sobre UNA afirmación. El informe queda en un repositorio público y otro modelo lo usará para responder dudas, así que debe bastarse solo.
- Usa SOLO la información de los resultados. No agregues datos de memoria.
- Prioriza fuentes primarias (datos oficiales, documentos, estudios) y verificadores profesionales (firmantes de la IFCN). Desconfía de redes sociales, blogs anónimos y sitios sin autoría.
- Cada dato del informe lleva la URL de donde sale, tal como aparece en los resultados.
- Si la evidencia es insuficiente o contradictoria, dilo: "no verificable" es una conclusión válida y preferible a adivinar. Que no aparezca evidencia de algo no prueba que sea falso.
- Juzga la afirmación, nunca a las personas ni a los partidos.
- Distingue entre falso, sacado de contexto y desactualizado.
- No emitas veredicto ni conclusión de verdadero o falso: describe qué parte de la afirmación confirma la evidencia, qué parte contradice y qué no se pudo comprobar. El veredicto lo decide el editor.
${REGLA_DATO}`,
    usuario: [
      `<afirmacion>${afirmacion}</afirmacion>`,
      `<resultados>\n${resultados || "(sin resultados)"}\n</resultados>`,
      verificaciones &&
        `Verificaciones profesionales ya publicadas sobre temas parecidos:\n<resultados>\n${verificaciones}\n</resultados>`,
      anterior &&
        `Ya investigamos esta afirmación antes. Indica si los resultados nuevos confirman, matizan o cambian esa investigación:\n<informe>${anterior}</informe>`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
}

export async function redactarVeredicto(ai: Ai, afirmacion: string, informe: string): Promise<Veredicto> {
  const crudo = await completar(ai, {
    esfuerzo: "medium",
    json: Veredicto,
    system: `Eres el editor de ¿Es Cierto?. A partir del informe de evidencia, emite el veredicto sobre la afirmación. Usa solo fuentes que aparecen en el informe, con su URL exacta.
Escala (juzga lo esencial de la afirmación, no cada detalle):
- verdadero: la evidencia confirma la afirmación.
- mayormente_verdadero: lo esencial es correcto, pero tiene imprecisiones menores (una fecha cercana, una cifra redondeada, un detalle secundario).
- enganoso: los datos son reales pero están sacados de contexto, desactualizados o presentados para inducir a error.
- falso: la evidencia contradice lo esencial de la afirmación.
- no_verificable: no hay evidencia suficiente, es contradictoria o el hecho no es comprobable con fuentes públicas (por ejemplo, algo privado).
No encontrar evidencia de algo NO lo hace falso: "falso" exige una fuente que lo contradiga. Si el informe no tiene fuentes que respalden una conclusión, el veredicto es "no_verificable".
${REGLA_DATO}`,
    usuario: `<afirmacion>${afirmacion}</afirmacion>\n\n<informe>${informe}</informe>`,
  });
  return Veredicto.parse(JSON.parse(crudo));
}
