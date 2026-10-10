// Lo que el bot ha respondido, tal como lo entrega /api/investigaciones. Funciones puras, con tests al lado.
// La respuesta viene de otro servicio por la red: se valida con zod antes de mostrar nada.
// zod/mini: la misma validación con una fracción del peso (la página solo valida este esquema).
import { z } from 'zod/mini';

const Item = z.object({
  id: z.uuid(),
  afirmacion: z.string(),
  veredicto: z.enum(['verdadero', 'mayormente_verdadero', 'enganoso', 'falso', 'no_verificable']),
  confianza: z.enum(['baja', 'media', 'alta']),
  resumen: z.string(),
  fuentes: z.int().check(z.nonnegative()),
  corregida: z.boolean(),
  creadoEn: z.number(),
});
export type Item = z.infer<typeof Item>;

export const Respuesta = z.object({ items: z.array(Item), siguiente: z.nullable(z.number()) });
export type Respuesta = z.infer<typeof Respuesta>;

/** La dirección de una página de /api/investigaciones; `antes` pide la siguiente. */
export function urlDePagina(bot: string, limite: number, antes?: number | null): string {
  const url = new URL('/api/investigaciones', bot);
  url.searchParams.set('limite', String(limite));
  if (antes) url.searchParams.set('antes', String(antes));
  return url.href;
}

/** La página de la investigación en el bot. El id ya viene validado como UUID. */
export const urlDeInvestigacion = (bot: string, id: string) => new URL(`/a/${id}`, bot).href;

// Las fechas en hora de Chile, donde parte el proyecto, para que todos vean el mismo día.
const formato = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Santiago',
});
export const fecha = (ms: number) => formato.format(ms);

// El modelo a veces escribe espacios angostos o duros (U+202F, U+00A0) en fechas y cifras; con la tipografía de la
// página se ven como palabras pegadas ("1de mayo"). Se muestran como espacios comunes.
export const legible = (texto: string) => texto.replace(/[\u00A0\u2007\u202F]/g, ' ');

export const cuantasFuentes = (n: number) => (n === 1 ? '1 fuente' : `${n} fuentes`);
