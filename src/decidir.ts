import type { Turno } from "./bluesky.ts";
import type { Veredicto } from "./claude.ts";

export interface Coincidencia {
  id: string;
  score: number;
  creadoEn: number;
}

export type Decision = { tipo: "nuevo" } | { tipo: "reciclar"; id: string } | { tipo: "complementar"; id: string };

// ponytail: umbrales a ojo; calibrarlos con afirmaciones reales una vez que haya base.
export const PARECIDO_MINIMO = 0.88;
export const FRESCURA_MS = 7 * 24 * 60 * 60 * 1000;

export function decidir(coincidencia: Coincidencia | undefined, ahora: number): Decision {
  if (!coincidencia || coincidencia.score < PARECIDO_MINIMO) {
    return { tipo: "nuevo" };
  }
  if (ahora - coincidencia.creadoEn <= FRESCURA_MS) {
    return { tipo: "reciclar", id: coincidencia.id };
  }
  return { tipo: "complementar", id: coincidencia.id };
}

export function exigirEvidencia(veredicto: Veredicto): Veredicto {
  const fuentes = veredicto.fuentes.filter((f) => /^https?:\/\//.test(f.url));
  if (fuentes.length === 0) {
    return { ...veredicto, veredicto: "no_verificable", confianza: "baja", fuentes };
  }
  return { ...veredicto, fuentes };
}

// ponytail: tope fijo contra discusiones infinitas que gastan API; moverlo a vars si hay que ajustarlo seguido.
export const MAX_RESPUESTAS_POR_HILO = 5;

export function puedeSeguirConversando(hilo: Turno[]): boolean {
  return hilo.filter((t) => t.deBot).length < MAX_RESPUESTAS_POR_HILO;
}

export function analisisDelHilo(hilo: Turno[]): string | null {
  for (const turno of [...hilo].reverse()) {
    const id = turno.deBot ? turno.texto.match(/\/a\/([0-9a-f-]{36})/)?.[1] : undefined;
    if (id) {
      return id;
    }
  }
  return null;
}
