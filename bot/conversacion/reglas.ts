import { enlacesDe } from "../shared/enlaces.ts";
import type { Turno } from "../shared/hilo.ts";

export const MAX_RESPUESTAS_POR_HILO = 5;

export function puedeSeguirConversando(hilo: Turno[]): boolean {
  return hilo.filter((t) => t.deBot).length < MAX_RESPUESTAS_POR_HILO;
}

export function investigacionDelHilo(hilo: Turno[]): string | null {
  for (const turno of [...hilo].reverse()) {
    const id = turno.deBot ? turno.texto.match(/\/a\/([0-9a-f-]{36})/)?.[1] : undefined;
    if (id) {
      return id;
    }
  }
  return null;
}

const respuestaDeRespaldo = (pagina: string | null) =>
  pagina
    ? `Los datos y sus fuentes están en la investigación completa: ${pagina}`
    : "No tengo una investigación sobre eso. Etiquétame en la publicación con el dato y lo investigo.";

export function respaldarRespuesta(texto: string, investigacion: string | null, pagina: string | null): string {
  const permitidos = new Set([...enlacesDe(investigacion ?? ""), ...(pagina ? [pagina] : [])]);
  return enlacesDe(texto).every((url) => permitidos.has(url)) ? texto : respuestaDeRespaldo(pagina);
}

export const LARGO_MAXIMO_RESPUESTA = 290;

const grafemas = (texto: string) => [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(texto)].length;

export function ajustarLargo(texto: string, pagina: string | null): string {
  if (grafemas(texto) <= LARGO_MAXIMO_RESPUESTA) {
    return texto;
  }
  let recortado = "";
  for (const oracion of texto.split(/(?<=[.!?])\s+/)) {
    const siguiente = recortado ? `${recortado} ${oracion}` : oracion;
    if (grafemas(siguiente) > LARGO_MAXIMO_RESPUESTA) {
      break;
    }
    recortado = siguiente;
  }
  return recortado || respuestaDeRespaldo(pagina);
}

export function respuestaPublicable(borrador: string, investigacion: string | null, pagina: string | null): string {
  return ajustarLargo(respaldarRespuesta(borrador, investigacion, pagina), pagina);
}
