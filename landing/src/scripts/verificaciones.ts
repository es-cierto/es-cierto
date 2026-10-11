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

export function urlDePagina(bot: string, limite: number, antes?: number | null): string {
  const url = new URL('/api/investigaciones', bot);
  url.searchParams.set('limite', String(limite));
  if (antes) url.searchParams.set('antes', String(antes));
  return url.href;
}

export const urlDeInvestigacion = (bot: string, id: string) => new URL(`/a/${id}`, bot).href;

const formato = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Santiago',
});
export const fecha = (ms: number) => formato.format(ms);

export const legible = (texto: string) => texto.replace(/[\u00A0\u2007\u202F]/g, ' ');

export const cuantasFuentes = (n: number) => (n === 1 ? '1 fuente' : `${n} fuentes`);
