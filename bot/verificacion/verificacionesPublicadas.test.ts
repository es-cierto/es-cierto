import { test } from "node:test";
import assert from "node:assert/strict";
import { verificacionesPublicadas } from "./verificacionesPublicadas.ts";

test("sin clave de Google, o con «ninguna», se salta la búsqueda de verificaciones publicadas", async () => {
  assert.equal(await verificacionesPublicadas("", "x"), "");
  assert.equal(await verificacionesPublicadas("   ", "x"), "");
  assert.equal(await verificacionesPublicadas("ninguna", "x"), "");
});
