import { z } from "zod";
import type { Turno } from "../shared/hilo.ts";

const XRPC = "https://bsky.social/xrpc";
const LARGO_MAXIMO = 300;
// ponytail: la sesión se cachea en D1 porque createSession tiene límite diario (~300).
const DURACION_SESION_MS = 90 * 60 * 1000;

export interface Sesion {
  did: string;
  accessJwt: string;
}

const Ref = z.object({ uri: z.string(), cid: z.string() });

export const Mencion = z.object({
  razon: z.enum(["mention", "reply"]),
  uri: z.string(),
  cid: z.string(),
  autorDid: z.string(),
  texto: z.string(),
  padre: Ref.optional(),
  raiz: Ref.optional(),
});
export type Mencion = z.infer<typeof Mencion>;

const RespuestaSesion = z.object({ did: z.string(), accessJwt: z.string() });

const RespuestaNotificaciones = z.object({
  notifications: z.array(
    z.object({
      uri: z.string(),
      cid: z.string(),
      reason: z.string(),
      isRead: z.boolean(),
      author: z.object({ did: z.string() }),
      record: z.object({
        text: z.string().default(""),
        reply: z.object({ root: Ref, parent: Ref }).optional(),
      }),
    }),
  ),
});

const RespuestaPosts = z.object({
  posts: z.array(z.object({ record: z.object({ text: z.string().default("") }) })),
});

async function xrpc(
  metodo: string,
  init: { sesion?: Sesion; query?: Record<string, string | string[]>; body?: unknown },
): Promise<unknown> {
  const url = new URL(`${XRPC}/${metodo}`);
  for (const [clave, valores] of Object.entries(init.query ?? {})) {
    for (const valor of [valores].flat()) {
      url.searchParams.append(clave, valor);
    }
  }
  const headers: Record<string, string> = {};
  if (init.sesion) {
    headers.authorization = `Bearer ${init.sesion.accessJwt}`;
  }
  if (init.body !== undefined) {
    headers["content-type"] = "application/json";
  }
  const respuesta = await fetch(url, {
    method: init.body === undefined ? "GET" : "POST",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!respuesta.ok) {
    throw new Error(`bluesky ${metodo} ${respuesta.status}: ${await respuesta.text()}`);
  }
  const texto = await respuesta.text();
  const datos: unknown = texto ? JSON.parse(texto) : {};
  return datos;
}

export async function sesionBluesky(env: Env): Promise<Sesion> {
  const guardada = await env.DB.prepare("SELECT did, access_jwt FROM sesion_bluesky WHERE id = 1 AND expira_en > ?")
    .bind(Date.now())
    .first<{ did: string; access_jwt: string }>();
  if (guardada) {
    return { did: guardada.did, accessJwt: guardada.access_jwt };
  }
  const nueva = RespuestaSesion.parse(
    await xrpc("com.atproto.server.createSession", {
      body: { identifier: env.BSKY_HANDLE, password: env.BSKY_APP_PASSWORD },
    }),
  );
  await env.DB.prepare(
    "INSERT INTO sesion_bluesky (id, did, access_jwt, expira_en) VALUES (1, ?1, ?2, ?3) ON CONFLICT (id) DO UPDATE SET did = ?1, access_jwt = ?2, expira_en = ?3",
  )
    .bind(nueva.did, nueva.accessJwt, Date.now() + DURACION_SESION_MS)
    .run();
  return nueva;
}

export async function mencionesSinLeer(sesion: Sesion): Promise<Mencion[]> {
  const { notifications } = RespuestaNotificaciones.parse(
    await xrpc("app.bsky.notification.listNotifications", {
      sesion,
      query: { limit: "50", reasons: ["mention", "reply"] },
    }),
  );
  const porUri = new Map<string, Mencion>();
  for (const n of notifications) {
    const razon = Mencion.shape.razon.safeParse(n.reason);
    if (n.isRead || !razon.success || porUri.get(n.uri)?.razon === "reply") {
      continue;
    }
    porUri.set(n.uri, {
      razon: razon.data,
      uri: n.uri,
      cid: n.cid,
      autorDid: n.author.did,
      texto: n.record.text,
      padre: n.record.reply?.parent,
      raiz: n.record.reply?.root,
    });
  }
  return [...porUri.values()];
}

export async function marcarLeidas(sesion: Sesion, hasta: string) {
  await xrpc("app.bsky.notification.updateSeen", { sesion, body: { seenAt: hasta } });
}

export async function textoDePost(sesion: Sesion, uri: string): Promise<string> {
  const { posts } = RespuestaPosts.parse(await xrpc("app.bsky.feed.getPosts", { sesion, query: { uris: uri } }));
  return posts[0]?.record.text ?? "";
}

const NodoHilo = z.object({
  post: z.object({ author: z.object({ did: z.string() }), record: z.object({ text: z.string().default("") }) }),
  parent: z.unknown().optional(),
});

// ponytail: solo la cadena de padres (hasta 20); las ramas laterales del hilo no son parte de la conversación.
export async function leerHilo(sesion: Sesion, uri: string): Promise<Turno[]> {
  const { thread } = z
    .object({ thread: z.unknown() })
    .parse(await xrpc("app.bsky.feed.getPostThread", { sesion, query: { uri, depth: "0", parentHeight: "20" } }));
  const turnos: Turno[] = [];
  let nodo = NodoHilo.safeParse(thread);
  while (nodo.success) {
    turnos.unshift({ deBot: nodo.data.post.author.did === sesion.did, texto: nodo.data.post.record.text });
    nodo = NodoHilo.safeParse(nodo.data.parent);
  }
  return turnos;
}

function recortar(texto: string, maximo: number): string {
  const grafemas = [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(texto)].map((s) => s.segment);
  if (grafemas.length <= maximo) {
    return texto;
  }
  return `${grafemas.slice(0, maximo - 1).join("")}…`;
}

export async function responder(sesion: Sesion, mencion: Mencion, cuerpo: string, enlace?: string) {
  const sufijo = enlace ? `\n→ ${enlace}` : "";
  const texto = recortar(cuerpo, LARGO_MAXIMO - [...sufijo].length) + sufijo;
  const bytes = new TextEncoder();
  const facets = enlace
    ? [
        {
          index: {
            byteStart: bytes.encode(texto).length - bytes.encode(enlace).length,
            byteEnd: bytes.encode(texto).length,
          },
          features: [{ $type: "app.bsky.richtext.facet#link", uri: enlace }],
        },
      ]
    : undefined;
  const padre = { uri: mencion.uri, cid: mencion.cid };
  await xrpc("com.atproto.repo.createRecord", {
    sesion,
    body: {
      repo: sesion.did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text: texto,
        facets,
        langs: ["es"],
        createdAt: new Date().toISOString(),
        reply: { root: mencion.raiz ?? padre, parent: padre },
      },
    },
  });
}
