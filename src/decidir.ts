export interface Coincidencia {
  id: string;
  score: number;
  creadoEn: number;
}

export type Decision =
  | { tipo: "nuevo" }
  | { tipo: "reciclar"; id: string }
  | { tipo: "complementar"; id: string };

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
