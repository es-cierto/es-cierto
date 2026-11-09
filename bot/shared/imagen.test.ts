import { test } from "node:test";
import assert from "node:assert/strict";
import { comoDatos } from "./imagen.ts";

test("una imagen se entrega como data URL con su tipo", async () => {
  const respuesta = new Response(new Uint8Array([1, 2, 3]), {
    headers: { "content-type": "image/jpeg; charset=binary" },
  });
  assert.equal(await comoDatos(respuesta), "data:image/jpeg;base64,AQID");
});

test("una página HTML en lugar de una imagen se rechaza", async () => {
  const respuesta = new Response("<html>Inicia sesión</html>", { headers: { "content-type": "text/html" } });
  await assert.rejects(comoDatos(respuesta), /no es una imagen: 200 text\/html/);
});

test("una imagen de más de 4 MB se rechaza", async () => {
  const respuesta = new Response(new Uint8Array(4 * 1024 * 1024 + 1), { headers: { "content-type": "image/png" } });
  await assert.rejects(comoDatos(respuesta), /imagen de 4194305 bytes/);
});

test("si quien entrega la imagen declara su tipo aparte, vale ese y no el de la descarga", async () => {
  const respuesta = new Response(new Uint8Array([1, 2, 3]), {
    headers: { "content-type": "application/octet-stream" },
  });
  assert.equal(await comoDatos(respuesta, "image/png"), "data:image/png;base64,AQID");
});
