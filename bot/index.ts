import { idDeInstancia } from "./chequeo.ts";
import { escapar, pagina } from "./paginas/html.ts";
import { verInvestigacion } from "./paginas/investigacionPublica.ts";
import { probar } from "./paginas/probar.ts";
import { marcarLeidas, mencionesSinLeer, sesionBluesky } from "./redes/bluesky.ts";
import { problemaDeCorreccion } from "./verificacion/reglas.ts";
import { PedidoCorreccion } from "./verificacion/veredicto.ts";

export { Chequeo } from "./chequeo.ts";
export { Correccion } from "./correccion.ts";

// ponytail: límite fijo por autor contra el uso del bot para acosar; moverlo a vars si hay que ajustarlo seguido.
const MENCIONES_POR_HORA = 5;

async function existeInstanciaDe(workflow: Workflow, id: string): Promise<boolean> {
  try {
    await workflow.get(id);
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
      if (!(await existeInstanciaDe(env.CHEQUEO, id))) {
        todasEncoladas = false;
        console.error(JSON.stringify({ evento: "no_se_pudo_encolar", uri: mencion.uri, error: String(error) }));
        continue;
      }
    }
    // `datos` guarda la mención completa: si el veredicto se corrige, el bot vuelve a este hilo a avisar.
    await env.DB.prepare(
      "INSERT INTO menciones (uri, autor, creado_en, datos) VALUES (?, ?, ?, ?) ON CONFLICT (uri) DO NOTHING",
    )
      .bind(mencion.uri, mencion.autorDid, Date.now(), JSON.stringify({ mencion, red: "bluesky" }))
      .run();
  }

  if (todasEncoladas) {
    await marcarLeidas(sesion, desde);
  }
}

// Comparación en tiempo constante: la ruta de correcciones no puede filtrar el token por cuánto tarda en rechazar.
async function tokenValido(recibido: string, esperado: string): Promise<boolean> {
  const resumen = async (texto: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return crypto.subtle.timingSafeEqual(await resumen(recibido), await resumen(esperado));
}

// Una persona que mantiene el proyecto revisa el reporte y publica la corrección. Solo encola el Workflow.
async function corregir(request: Request, env: Env): Promise<Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!env.CORRECCIONES_TOKEN || !(await tokenValido(token, env.CORRECCIONES_TOKEN))) {
    return new Response("No autorizado", { status: 401 });
  }
  const cuerpo: unknown = await request.json().catch(() => null);
  const pedido = PedidoCorreccion.safeParse(cuerpo);
  if (!pedido.success) {
    return Response.json({ error: pedido.error.issues }, { status: 400 });
  }
  const problema = problemaDeCorreccion(pedido.data);
  if (problema) {
    return Response.json({ error: problema }, { status: 400 });
  }
  // Una sola corrección por investigación: el id de la instancia sale de la investigación corregida.
  const id = await idDeInstancia(`correccion:${pedido.data.investigacionId}`);
  try {
    await env.CORRECCION.create({ id, params: pedido.data });
  } catch (error) {
    if (await existeInstanciaDe(env.CORRECCION, id)) {
      return Response.json(
        { error: "esta investigación ya tiene una corrección; corrige la versión nueva", instancia: id },
        { status: 409 },
      );
    }
    console.error(JSON.stringify({ evento: "no_se_pudo_encolar_correccion", id, error: String(error) }));
    return Response.json({ error: "no se pudo encolar la corrección" }, { status: 500 });
  }
  return Response.json({ instancia: id }, { status: 202 });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/correcciones" && request.method === "POST") {
      return corregir(request, env);
    }
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
        `<h1>¿Es Cierto?</h1><p>Verificador de datos abierto. Menciona a <strong>@${escapar(env.BSKY_HANDLE)}</strong> en una publicación y te responde con evidencia y fuentes.</p><p><a href="${env.REPO_URL}">Código</a> · <a href="${env.REPO_URL}/blob/main/METODOLOGIA.md">Metodología</a></p>`,
      );
    }
    return new Response("No encontrado", { status: 404 });
  },

  async scheduled(_controlador, env) {
    await revisarMenciones(env);
  },
} satisfies ExportedHandler<Env>;
