import { enlacesDe } from "../shared/enlaces.ts";
import type { PlanBusqueda } from "./prompts.ts";
import { ETIQUETAS, type PedidoCorreccion, type Veredicto } from "./veredicto.ts";

export const ENLACES_POR_MENSAJE = 3;

export interface Coincidencia {
  id: string;
  score: number;
  creadoEn: number;
}

export type Decision = { tipo: "nuevo" } | { tipo: "reciclar"; id: string } | { tipo: "complementar"; id: string };

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

export const FUENTES_INDEPENDIENTES_PARA_CONFIANZA_ALTA = 2;

const sitioDe = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export function exigirEvidencia(veredicto: Veredicto, evidencia: string): Veredicto {
  const vistas = new Set(enlacesDe(evidencia).map(sinBarraFinal));
  const fuentes = veredicto.fuentes.filter((f) => /^https?:\/\//.test(f.url) && vistas.has(sinBarraFinal(f.url)));
  if (fuentes.length === 0) {
    return { ...veredicto, veredicto: "no_verificable", confianza: "baja", fuentes };
  }
  const sitios = new Set(fuentes.map((f) => sitioDe(f.url))).size;
  const confianza =
    veredicto.confianza === "alta" && sitios < FUENTES_INDEPENDIENTES_PARA_CONFIANZA_ALTA
      ? "media"
      : veredicto.confianza;
  return { ...veredicto, confianza, fuentes };
}

export const MAX_RONDAS_BUSQUEDA = 3;
export const MAX_CONSULTAS_POR_RONDA = 3;

const normalizar = (consulta: string) => consulta.trim().toLowerCase().replace(/\s+/g, " ");

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

export function problemaDeCorreccion(pedido: PedidoCorreccion): string | null {
  if (pedido.fuentes.some((f) => !f.url.startsWith("https://"))) {
    return "todas las fuentes tienen que ser enlaces https";
  }
  if (pedido.veredicto !== "no_verificable" && pedido.fuentes.length === 0) {
    return "un veredicto distinto de no verificable necesita al menos una fuente";
  }
  const sitios = new Set(pedido.fuentes.map((f) => sitioDe(f.url))).size;
  if (pedido.confianza === "alta" && sitios < FUENTES_INDEPENDIENTES_PARA_CONFIANZA_ALTA) {
    return "la confianza alta necesita fuentes de al menos 2 sitios distintos, igual que en una investigación";
  }
  return null;
}

export function textoDeCorreccion(antes: Veredicto["veredicto"], ahora: Veredicto["veredicto"], nota: string): string {
  const cambio =
    antes === ahora ? `Mantiene: ${ETIQUETAS[ahora]}.` : `Antes: ${ETIQUETAS[antes]}. Ahora: ${ETIQUETAS[ahora]}.`;
  return `Corrección: revisamos esta verificación. ${cambio}\n${nota}`;
}

const ENTIDADES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };

function sinEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entidad, codigo: string) =>
    codigo.startsWith("#x") || codigo.startsWith("#X")
      ? String.fromCodePoint(parseInt(codigo.slice(2), 16))
      : codigo.startsWith("#")
        ? String.fromCodePoint(Number(codigo.slice(1)))
        : (ENTIDADES[codigo.toLowerCase()] ?? entidad),
  );
}

export function vistaPrevia(html: string): { titulo: string; descripcion: string } {
  const meta: Record<string, string> = {};
  for (const [etiqueta] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const atributos = Object.fromEntries(
      [...etiqueta.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([, nombre, doble, simple]) => [
        nombre.toLowerCase(),
        doble ?? simple,
      ]),
    );
    const clave = (atributos.property ?? atributos.name)?.toLowerCase();
    if (clave && atributos.content) {
      meta[clave] = sinEntidades(atributos.content.trim());
    }
  }
  const titulo = meta["og:title"] ?? sinEntidades(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "");
  return { titulo, descripcion: meta["og:description"] ?? meta.description ?? "" };
}
