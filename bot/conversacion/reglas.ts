import { enlacesDe } from "../shared/enlaces.ts";
import type { Turno } from "../shared/hilo.ts";

// ponytail: tope fijo contra discusiones infinitas que gastan API; moverlo a vars si hay que ajustarlo seguido.
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

export function respaldarRespuesta(texto: string, investigacion: string | null, pagina: string | null): string {
  const permitidos = new Set([...enlacesDe(investigacion ?? ""), ...(pagina ? [pagina] : [])]);
  if (enlacesDe(texto).every((url) => permitidos.has(url))) {
    return texto;
  }
  return pagina
    ? `Los datos y sus fuentes están en la investigación completa: ${pagina}`
    : "No tengo una investigación sobre eso. Etiquétame en la publicación con el dato y lo investigo.";
}
