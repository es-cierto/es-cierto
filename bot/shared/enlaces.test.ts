import { test } from "node:test";
import assert from "node:assert/strict";
import { enlacesDe } from "./enlaces.ts";

test("los enlaces se extraen sin la puntuación que los sigue", () => {
  assert.deepEqual(enlacesDe("Mira https://a.cl/x. Y (https://b.cl/y), listo"), ["https://a.cl/x", "https://b.cl/y"]);
});
