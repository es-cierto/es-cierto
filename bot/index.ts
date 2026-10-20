import { idDeInstancia } from "./chequeo.ts";
import { listarInvestigaciones } from "./paginas/api.ts";
import { verInvestigacion } from "./paginas/investigacionPublica.ts";
import { probar } from "./paginas/probar.ts";
import { marcarLeidas, type Mencion, mencionesSinLeer, sesionBluesky } from "./redes/bluesky.ts";
import type { NombreRed } from "./redes/red.ts";
import * as whatsapp from "./redes/whatsapp.ts";
import { problemaDeCorreccion } from "./verificacion/reglas.ts";
import { PedidoCorreccion } from "./verificacion/veredicto.ts";

export { Chequeo } from "./chequeo.ts";
export { Correccion } from "./correccion.ts";

const MENCIONES_POR_HORA = 5;

async function existeInstanciaDe(workflow: Workflow, id: string): Promise<boolean> {
  try {
    await workflow.get(id);
    return true;
  } catch {
    return false;
  }
}

async function encolar(env: Env, mencion: Mencion, red: NombreRed): Promise<boolean> {
  const haceUnaHora = Date.now() - 60 * 60 * 1000;
  const recientes = await env.DB.prepare("SELECT count(*) AS n FROM menciones WHERE autor = ? AND creado_en > ?")
    .bind(mencion.autorDid, haceUnaHora)
    .first<number>("n");
  if ((recientes ?? 0) >= MENCIONES_POR_HORA) {
    console.warn(JSON.stringify({ evento: "limite_por_autor", autor: mencion.autorDid, uri: mencion.uri }));
    if (red === "whatsapp") {
      await env.DB.prepare(
        "INSERT INTO menciones (uri, autor, creado_en) VALUES (?, ?, ?) ON CONFLICT (uri) DO NOTHING",
      )
        .bind(mencion.uri, mencion.autorDid, Date.now())
        .run();
      if (recientes === MENCIONES_POR_HORA) {
        await whatsapp.responder(
          env,
          mencion,
          `Recibí muchos mensajes tuyos en la última hora (el máximo es ${MENCIONES_POR_HORA}). Vuelve a enviármelo en un rato y lo verifico.`,
        );
      }
    }
    return true;
  }

  const id = await idDeInstancia(mencion.uri);
  try {
    await env.CHEQUEO.create({ id, params: { mencion, red } });
  } catch (error) {
    if (!(await existeInstanciaDe(env.CHEQUEO, id))) {
      console.error(JSON.stringify({ evento: "no_se_pudo_encolar", uri: mencion.uri, error: String(error) }));
      return false;
    }
  }

  await env.DB.prepare(
    "INSERT INTO menciones (uri, autor, creado_en, datos) VALUES (?, ?, ?, ?) ON CONFLICT (uri) DO NOTHING",
  )
    .bind(mencion.uri, mencion.autorDid, Date.now(), JSON.stringify({ mencion, red }))
    .run();
  return true;
}

async function revisarMenciones(env: Env) {
  const sesion = await sesionBluesky(env);
  const desde = new Date().toISOString();
  let todasEncoladas = true;
  for (const mencion of await mencionesSinLeer(sesion)) {
    todasEncoladas = (await encolar(env, mencion, "bluesky")) && todasEncoladas;
  }
  if (todasEncoladas) {
    await marcarLeidas(sesion, desde);
  }
}

async function recibirWhatsapp(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const token = url.searchParams.get("hub.verify_token") ?? "";
    return url.searchParams.get("hub.mode") === "subscribe" && (await tokenValido(token, env.WHATSAPP_VERIFY_TOKEN))
      ? new Response(url.searchParams.get("hub.challenge"))
      : new Response("No autorizado", { status: 403 });
  }
  const cuerpo = await request.text();
  if (
    !(await whatsapp.firmaValida(cuerpo, request.headers.get("x-hub-signature-256") ?? "", env.WHATSAPP_APP_SECRET))
  ) {
    return new Response("No autorizado", { status: 401 });
  }
  const datos: unknown = await new Response(cuerpo).json().catch(() => null);
  for (const mencion of whatsapp.mencionesDeWebhook(datos)) {
    await whatsapp.marcarLeidoYEscribiendo(env, mencion).catch((error: unknown) => {
      console.warn(JSON.stringify({ evento: "no_se_pudo_marcar_leido", uri: mencion.uri, error: String(error) }));
    });
    if (!(await encolar(env, mencion, "whatsapp"))) {
      return new Response("No se pudo encolar", { status: 500 });
    }
  }
  return new Response("ok");
}

async function tokenValido(recibido: string, esperado: string): Promise<boolean> {
  const resumen = async (texto: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return crypto.subtle.timingSafeEqual(await resumen(recibido), await resumen(esperado));
}

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
    if (pathname === "/whatsapp") {
      return recibirWhatsapp(request, env);
    }
    if (pathname === "/correcciones" && request.method === "POST") {
      return corregir(request, env);
    }
    const prueba = pathname.match(/^\/probar(?:\/([0-9a-f-]{36}))?$/);
    if (prueba && env.PRUEBA_WEB === "si") {
      return probar(request, env, prueba[1]);
    }
    if (pathname === "/api/investigaciones" && request.method === "GET") {
      return listarInvestigaciones(env, new URL(request.url));
    }
    const investigacion = pathname.match(/^\/a\/([0-9a-f-]{36})$/);
    if (investigacion) {
      return verInvestigacion(env, investigacion[1]);
    }
    if (pathname === "/") {
      return Response.redirect(env.LANDING_URL, 302);
    }
    return new Response("No encontrado", { status: 404 });
  },

  async scheduled(_controlador, env) {
    await revisarMenciones(env);
  },
} satisfies ExportedHandler<Env>;
