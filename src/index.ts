import { marcarLeidas, mencionesSinLeer, sesionBluesky } from "./bluesky.ts";
import { ETIQUETAS } from "./chequeo.ts";
import type { Veredicto } from "./claude.ts";

export { Chequeo } from "./chequeo.ts";

// ponytail: límite fijo por autor contra el uso del bot para acosar; moverlo a vars si hay que ajustarlo seguido.
const MENCIONES_POR_HORA = 5;

async function idDeInstancia(uri: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(uri));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 64);
}

async function existeInstancia(env: Env, id: string): Promise<boolean> {
  try {
    await env.CHEQUEO.get(id);
    return true;
  } catch {
    return false;
  }
}

async function revisarMenciones(env: Env) {
  const sesion = await sesionBluesky(env);
  const desde = new Date().toISOString();
  const menciones = await mencionesSinLeer(sesion);
  let todasEncoladas = true;

  for (const mencion of menciones) {
    const haceUnaHora = Date.now() - 60 * 60 * 1000;
    const recientes = await env.DB.prepare("SELECT count(*) AS n FROM menciones WHERE autor = ? AND creado_en > ?")
      .bind(mencion.autorDid, haceUnaHora)
      .first<number>("n");
    if ((recientes ?? 0) >= MENCIONES_POR_HORA) {
      console.warn(JSON.stringify({ evento: "limite_por_autor", autor: mencion.autorDid, uri: mencion.uri }));
      continue;
    }

    const id = await idDeInstancia(mencion.uri);
    try {
      await env.CHEQUEO.create({ id, params: { mencion } });
    } catch (error) {
      if (!(await existeInstancia(env, id))) {
        todasEncoladas = false;
        console.error(JSON.stringify({ evento: "no_se_pudo_encolar", uri: mencion.uri, error: String(error) }));
        continue;
      }
    }
    await env.DB.prepare("INSERT INTO menciones (uri, autor, creado_en) VALUES (?, ?, ?) ON CONFLICT (uri) DO NOTHING")
      .bind(mencion.uri, mencion.autorDid, Date.now())
      .run();
  }

  if (todasEncoladas) {
    await marcarLeidas(sesion, desde);
  }
}

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function pagina(titulo: string, cuerpo: string): Response {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(titulo)}</title><style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.5}</style></head><body>${cuerpo}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

interface FilaAnalisis {
  afirmacion: string;
  veredicto: Veredicto["veredicto"];
  confianza: string;
  resumen: string;
  fuentes: string;
  anterior_id: string | null;
  creado_en: number;
}

async function verAnalisis(env: Env, id: string): Promise<Response> {
  const fila = await env.DB.prepare("SELECT * FROM analisis WHERE id = ?").bind(id).first<FilaAnalisis>();
  if (!fila) {
    return new Response("No existe ese análisis", { status: 404 });
  }
  const fuentes: Veredicto["fuentes"] = JSON.parse(fila.fuentes);
  const enlacesSeguros = fuentes.filter((f) => /^https?:\/\//.test(f.url));
  return pagina(
    `${ETIQUETAS[fila.veredicto]}: ${fila.afirmacion}`,
    `<p><a href="/">¿Es Cierto?</a></p>
<h1>${escapar(ETIQUETAS[fila.veredicto])}</h1>
<blockquote>${escapar(fila.afirmacion)}</blockquote>
<p>${escapar(fila.resumen)}</p>
<p>Confianza: ${escapar(fila.confianza)} · ${new Date(fila.creado_en).toLocaleDateString("es-CL")}</p>
<h2>Fuentes</h2>
<ul>${enlacesSeguros.map((f) => `<li><a href="${escapar(f.url)}" rel="nofollow noopener">${escapar(f.titulo)}</a></li>`).join("")}</ul>
${fila.anterior_id ? `<p>Actualiza un <a href="/a/${escapar(fila.anterior_id)}">análisis anterior</a>.</p>` : ""}
<p><small>Análisis automático con IA. Lee la <a href="${env.REPO_URL}/blob/main/METODOLOGIA.md">metodología</a> · ¿Encontraste un error? <a href="${env.REPO_URL}/issues/new?title=${encodeURIComponent(`Corrección: ${id}`)}">Repórtalo</a>.</small></p>`,
  );
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const analisis = pathname.match(/^\/a\/([0-9a-f-]{36})$/);
    if (analisis) {
      return verAnalisis(env, analisis[1]);
    }
    if (pathname === "/") {
      return pagina(
        "¿Es Cierto?",
        `<h1>¿Es Cierto?</h1><p>Verificador de datos abierto. Etiqueta a <strong>@${escapar(env.BSKY_HANDLE)}</strong> en una publicación y te responde con evidencia y fuentes.</p><p><a href="${env.REPO_URL}">Código</a> · <a href="${env.REPO_URL}/blob/main/METODOLOGIA.md">Metodología</a></p>`,
      );
    }
    return new Response("No encontrado", { status: 404 });
  },

  async scheduled(_controlador, env) {
    await revisarMenciones(env);
  },
} satisfies ExportedHandler<Env>;
