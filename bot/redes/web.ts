import type { Turno } from "../shared/hilo.ts";
import type { Mencion } from "./bluesky.ts";

// Red de prueba: el mismo contrato que bluesky.ts, con el hilo guardado en D1.
// Una URI es `web:<hilo>:<n>`; el turno 0 es la publicación y el 1 la pregunta.

function partes(uri: string): { hilo: string; n: number } {
  const [, hilo, n] = uri.split(":");
  return { hilo, n: Number(n) };
}

export async function agregarTurno(env: Env, hilo: string, deBot: boolean, texto: string): Promise<string> {
  const fila = await env.DB.prepare(
    "INSERT INTO turnos_web (hilo, n, de_bot, texto) VALUES (?1, (SELECT coalesce(max(n) + 1, 0) FROM turnos_web WHERE hilo = ?1), ?2, ?3) RETURNING n",
  )
    .bind(hilo, deBot ? 1 : 0, texto)
    .first<number>("n");
  return `web:${hilo}:${fila}`;
}

export function mencionWeb(uri: string, texto: string): Mencion {
  const { hilo, n } = partes(uri);
  return n === 1
    ? { razon: "mention", uri, cid: "", autorDid: "web", texto, padre: { uri: `web:${hilo}:0`, cid: "" } }
    : { razon: "reply", uri, cid: "", autorDid: "web", texto };
}

export async function turnosWeb(env: Env, hilo: string): Promise<Turno[]> {
  const { results } = await env.DB.prepare("SELECT de_bot, texto FROM turnos_web WHERE hilo = ? ORDER BY n")
    .bind(hilo)
    .all<{ de_bot: number; texto: string }>();
  return results.map((t) => ({ deBot: t.de_bot === 1, texto: t.texto }));
}

export async function textoDePost(env: Env, uri: string): Promise<string> {
  const { hilo, n } = partes(uri);
  return (await turnosWeb(env, hilo))[n]?.texto ?? "";
}

export async function leerHilo(env: Env, uri: string): Promise<Turno[]> {
  const { hilo, n } = partes(uri);
  return (await turnosWeb(env, hilo)).slice(0, n + 1);
}

export async function responder(env: Env, mencion: Mencion, cuerpo: string, enlace?: string) {
  await agregarTurno(env, partes(mencion.uri).hilo, true, enlace ? `${cuerpo}\n→ ${enlace}` : cuerpo);
}
