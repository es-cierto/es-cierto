import { enlacesDe } from "../shared/enlaces.ts";
import type { PlanBusqueda } from "./prompts.ts";
import type { Veredicto } from "./veredicto.ts";

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

const sinBarraFinal = (url: string) => url.replace(/\/+$/, "");

// Solo cuentan las fuentes que aparecieron en la evidencia recolectada: el modelo no puede inventar URLs.
export function exigirEvidencia(veredicto: Veredicto, evidencia: string): Veredicto {
  const vistas = new Set(enlacesDe(evidencia).map(sinBarraFinal));
  const fuentes = veredicto.fuentes.filter((f) => /^https?:\/\//.test(f.url) && vistas.has(sinBarraFinal(f.url)));
  if (fuentes.length === 0) {
    return { ...veredicto, veredicto: "no_verificable", confianza: "baja", fuentes };
  }
  return { ...veredicto, fuentes };
}

// ponytail: hasta 3 rondas de 3 búsquedas (9 de Tavily como máximo, ~110 investigaciones con el plan gratis);
// subirlo si muchas terminan en "no verificable" por falta de evidencia.
export const MAX_RONDAS_BUSQUEDA = 3;
export const MAX_CONSULTAS_POR_RONDA = 3;

const normalizar = (consulta: string) => consulta.trim().toLowerCase().replace(/\s+/g, " ");

// Las búsquedas de la próxima ronda; vacío si hay que dejar de buscar.
export function consultasNuevas(plan: PlanBusqueda, hechas: string[]): string[] {
  if (plan.suficiente && hechas.length > 0) {
    return [];
  }
  const vistas = new Set(hechas.map(normalizar));
  const nuevas: string[] = [];
  for (const consulta of plan.consultas) {
    const clave = normalizar(consulta);
    if (clave && !vistas.has(clave)) {
      vistas.add(clave);
      nuevas.push(consulta.trim());
    }
  }
  return nuevas.slice(0, MAX_CONSULTAS_POR_RONDA);
}
