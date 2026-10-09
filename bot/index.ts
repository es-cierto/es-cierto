import { idDeInstancia } from "./chequeo.ts";
import { escapar, pagina } from "./paginas/html.ts";
import { verInvestigacion } from "./paginas/investigacionPublica.ts";
import { probar } from "./paginas/probar.ts";
import { marcarLeidas, mencionesSinLeer, sesionBluesky } from "./redes/bluesky.ts";

export { Chequeo } from "./chequeo.ts";

// ponytail: límite fijo por autor contra el uso del bot para acosar; moverlo a vars si hay que ajustarlo seguido.
const MENCIONES_POR_HORA = 5;

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
      await env.CHEQUEO.create({ id, params: { mencion, red: "bluesky" } });
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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const prueba = pathname.match(/^\/probar(?:\/([0-9a-f-]{36}))?$/);
    if (prueba && env.PRUEBA_WEB === "si") {
      return probar(request, env, prueba[1]);
    }
    const investigacion = pathname.match(/^\/a\/([0-9a-f-]{36})$/);
    if (investigacion) {
      return verInvestigacion(env, investigacion[1]);
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
