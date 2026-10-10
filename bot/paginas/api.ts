import { z } from "zod";
import { Veredicto } from "../verificacion/veredicto.ts";

// GET /api/investigaciones: lo que el bot ha respondido, para que la landing lo muestre. Son solo las investigaciones
// (afirmación, veredicto, fuentes): nunca quién preguntó ni desde qué cuenta. Sin filtros por tema ni por sector:
// todo, en orden cronológico, para que nadie pueda elegir qué veredictos mostrar.

const LIMITE_POR_DEFECTO = 12;
const LIMITE_MAXIMO = 50;

const Fila = z.object({
  id: z.string(),
  afirmacion: z.string(),
  veredicto: Veredicto.shape.veredicto,
  confianza: Veredicto.shape.confianza,
  resumen: z.string(),
  fuentes: z.string(),
  corregida_por: z.string().nullable(),
  creado_en: z.number(),
});

export const ItemPublico = z.object({
  id: z.string(),
  afirmacion: z.string(),
  veredicto: Veredicto.shape.veredicto,
  confianza: Veredicto.shape.confianza,
  resumen: z.string(),
  fuentes: z.number().int().nonnegative(),
  corregida: z.boolean(),
  creadoEn: z.number(),
});
export type ItemPublico = z.infer<typeof ItemPublico>;

/** Una fila de D1 → lo que se publica. Las fuentes se cuentan; el detalle está en la página de la investigación. */
export function itemPublico(fila: unknown): ItemPublico {
  const f = Fila.parse(fila);
  return {
    id: f.id,
    afirmacion: f.afirmacion,
    veredicto: f.veredicto,
    confianza: f.confianza,
    resumen: f.resumen,
    fuentes: Veredicto.shape.fuentes.parse(JSON.parse(f.fuentes)).length,
    corregida: f.corregida_por !== null,
    creadoEn: f.creado_en,
  };
}

/** `?limite=` (1 a 50) y `?antes=` (marca de tiempo en ms, para pedir la página siguiente). Lo inválido se ignora. */
export function parametros(url: URL): { limite: number; antes: number } {
  const limite = Number(url.searchParams.get("limite"));
  const antes = Number(url.searchParams.get("antes"));
  return {
    limite: Number.isInteger(limite) && limite >= 1 ? Math.min(limite, LIMITE_MAXIMO) : LIMITE_POR_DEFECTO,
    antes: Number.isInteger(antes) && antes > 0 ? antes : Number.MAX_SAFE_INTEGER,
  };
}

export async function listarInvestigaciones(env: Env, url: URL): Promise<Response> {
  const { limite, antes } = parametros(url);
  const { results } = await env.DB.prepare(
    "SELECT id, afirmacion, veredicto, confianza, resumen, fuentes, corregida_por, creado_en FROM investigaciones WHERE creado_en < ? ORDER BY creado_en DESC LIMIT ?",
  )
    .bind(antes, limite + 1)
    .all();
  const items = results.slice(0, limite).map(itemPublico);
  // Si vino una fila de más, hay otra página: se pide con ?antes=<creadoEn del último>.
  const siguiente = results.length > limite ? items.at(-1)?.creadoEn : undefined;
  return Response.json(
    { items, siguiente: siguiente ?? null },
    {
      headers: {
        // Datos públicos y de solo lectura: cualquier página puede leerlos.
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=60",
      },
    },
  );
}
