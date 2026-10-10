import { test } from "node:test";
import assert from "node:assert/strict";
import { verificacionesPublicadas } from "./verificacionesPublicadas.ts";

// Sin clave no se llama a Google: si se llamara, el test fallaría por la red (o colgaría) en vez de devolver "".
test("sin clave de Google, o con «ninguna», se salta la búsqueda de verificaciones publicadas", async () => {
  assert.equal(await verificacionesPublicadas("", "x"), "");
  assert.equal(await verificacionesPublicadas("   ", "x"), "");
  assert.equal(await verificacionesPublicadas("ninguna", "x"), "");
});
