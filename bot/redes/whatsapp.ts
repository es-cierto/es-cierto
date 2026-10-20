import { z } from "zod";
import type { Mencion } from "./bluesky.ts";

const GRAPH = "https://graph.facebook.com/v23.0";

const Webhook = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            metadata: z.object({ phone_number_id: z.string() }),
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  id: z.string(),
                  text: z.object({ body: z.string() }).optional(),
                }),
              )
              .optional(),
          }),
        }),
      ),
    }),
  ),
});

function partes(uri: string): { numeroId: string; para: string; mensajeId: string } {
  const [, numeroId, para, mensajeId] = uri.split(":");
  return { numeroId, para, mensajeId };
}

export function mencionesDeWebhook(cuerpo: unknown): Mencion[] {
  const webhook = Webhook.safeParse(cuerpo);
  if (!webhook.success) {
    return [];
  }
  return webhook.data.entry.flatMap((e) =>
    e.changes.flatMap(({ value }) =>
      (value.messages ?? [])
        .filter((m) => m.text)
        .map((m) => ({
          razon: "mention" as const,
          uri: `whatsapp:${value.metadata.phone_number_id}:${m.from}:${m.id}`,
          cid: "",
          autorDid: `whatsapp:${m.from}`,
          texto: m.text?.body ?? "",
        })),
    ),
  );
}

export async function firmaValida(cuerpo: string, firma: string, secreto: string): Promise<boolean> {
  const hex = firma.match(/^sha256=([0-9a-f]{64})$/)?.[1];
  if (!hex) {
    return false;
  }
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const bytes = Uint8Array.from(hex.match(/../g) ?? [], (b) => parseInt(b, 16));
  return crypto.subtle.verify("HMAC", clave, bytes, new TextEncoder().encode(cuerpo));
}

async function enviar(env: Env, uri: string, mensaje: (para: string, mensajeId: string) => object) {
  const { numeroId, para, mensajeId } = partes(uri);
  const respuesta = await fetch(`${GRAPH}/${numeroId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...mensaje(para, mensajeId) }),
  });
  if (!respuesta.ok) {
    throw new Error(`whatsapp messages ${respuesta.status}: ${await respuesta.text()}`);
  }
}

export async function marcarLeidoYEscribiendo(env: Env, mencion: Mencion) {
  await enviar(env, mencion.uri, (_para, mensajeId) => ({
    status: "read",
    message_id: mensajeId,
    typing_indicator: { type: "text" },
  }));
}

export async function responder(env: Env, mencion: Mencion, cuerpo: string, enlace?: string) {
  await enviar(env, mencion.uri, (para, mensajeId) => ({
    to: para,
    context: { message_id: mensajeId },
    type: "text",
    text: { body: enlace ? `${cuerpo}\n${enlace}` : cuerpo, preview_url: Boolean(enlace) },
  }));
}
