// Aplica los perfiles de perfiles/datos.ts: la cuenta del bot en Bluesky y la organización y el repo en GitHub.
// Uso: node scripts/perfiles.ts            (los dos)
//      node scripts/perfiles.ts bluesky    (solo uno)
// Bluesky usa BSKY_APP_PASSWORD de .dev.vars; GitHub usa la sesión de `gh` (hace falta ser admin de la organización).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { bluesky, github } from "../perfiles/datos.ts";

const XRPC = "https://bsky.social/xrpc";
const Blob = z.object({
  blob: z.object({
    $type: z.literal("blob"),
    ref: z.object({ $link: z.string() }),
    mimeType: z.string(),
    size: z.number(),
  }),
});

function variable(nombre: string): string {
  const linea = readFileSync(".dev.vars", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${nombre}=`));
  const valor = linea?.slice(nombre.length + 1).trim();
  if (!valor) throw new Error(`Falta ${nombre} en .dev.vars`);
  return valor;
}

async function xrpc(metodo: string, init: RequestInit & { token?: string }): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  const respuesta = await fetch(`${XRPC}/${metodo}`, { ...init, headers });
  const texto = await respuesta.text();
  if (!respuesta.ok) throw new Error(`bluesky ${metodo} ${respuesta.status}: ${texto}`);
  const datos: unknown = texto ? JSON.parse(texto) : {};
  return datos;
}

async function perfilBluesky() {
  const sesion = z.object({ did: z.string(), accessJwt: z.string() }).parse(
    await xrpc("com.atproto.server.createSession", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: bluesky.handle, password: variable("BSKY_APP_PASSWORD") }),
    }),
  );
  const subir = async (ruta: string, tipo: string) =>
    Blob.parse(
      await xrpc("com.atproto.repo.uploadBlob", {
        method: "POST",
        token: sesion.accessJwt,
        headers: { "content-type": tipo },
        body: readFileSync(ruta),
      }),
    ).blob;

  // Se parte del perfil actual para no borrar lo que no maneja este script (por ejemplo, una publicación fijada).
  const actual = await xrpc(
    `com.atproto.repo.getRecord?repo=${sesion.did}&collection=app.bsky.actor.profile&rkey=self`,
    { token: sesion.accessJwt },
  ).catch(() => ({ value: {} }));
  const anterior = z.object({ value: z.record(z.string(), z.unknown()) }).parse(actual).value;

  await xrpc("com.atproto.repo.putRecord", {
    method: "POST",
    token: sesion.accessJwt,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      repo: sesion.did,
      collection: "app.bsky.actor.profile",
      rkey: "self",
      record: {
        ...anterior,
        $type: "app.bsky.actor.profile",
        displayName: bluesky.nombre,
        description: bluesky.biografia,
        avatar: await subir(bluesky.avatar, "image/png"),
        banner: await subir(bluesky.portada, "image/jpeg"),
      },
    }),
  });
  console.log(`Bluesky: perfil de @${bluesky.handle} actualizado.`);
}

function perfilGithub() {
  const gh = (...args: string[]) => execFileSync("gh", args, { stdio: ["ignore", "ignore", "inherit"] });
  gh(
    "api",
    "-X",
    "PATCH",
    `orgs/${github.organizacion}`,
    "-f",
    `name=${github.nombre}`,
    "-f",
    `description=${github.descripcion}`,
    "-f",
    `blog=${github.sitio}`,
  );
  gh(
    "api",
    "-X",
    "PATCH",
    `repos/${github.repo.nombre}`,
    "-f",
    `description=${github.repo.descripcion}`,
    "-f",
    `homepage=${github.sitio}`,
  );
  gh(
    "api",
    "-X",
    "PUT",
    `repos/${github.repo.nombre}/topics`,
    ...github.repo.temas.flatMap((t) => ["-f", `names[]=${t}`]),
  );
  console.log(`GitHub: organización ${github.organizacion} y repo ${github.repo.nombre} actualizados.`);
  // La API de GitHub no permite cambiar el avatar de una organización.
  console.log(
    `  El avatar se sube a mano: github.com/organizations/${github.organizacion}/settings/profile → perfiles/avatar.png`,
  );
}

const cual = process.argv[2];
if (!cual || cual === "bluesky") await perfilBluesky();
if (!cual || cual === "github") perfilGithub();
