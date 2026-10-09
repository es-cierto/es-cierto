import { test } from "node:test";
import assert from "node:assert/strict";
import { decidir } from "./decidir.ts";

const ahora = Date.parse("2026-10-09T12:00:00Z");
const hace = (dias: number) => ahora - dias * 24 * 60 * 60 * 1000;

test("sin coincidencia se investiga de cero", () => {
  assert.deepEqual(decidir(undefined, ahora), { tipo: "nuevo" });
});

test("parecido bajo el umbral se investiga de cero aunque sea reciente", () => {
  assert.deepEqual(decidir({ id: "a", score: 0.87, creadoEn: hace(1) }, ahora), { tipo: "nuevo" });
});

test("muy parecido y reciente se recicla", () => {
  assert.deepEqual(decidir({ id: "a", score: 0.95, creadoEn: hace(7) }, ahora), { tipo: "reciclar", id: "a" });
});

test("muy parecido pero viejo se complementa", () => {
  assert.deepEqual(decidir({ id: "a", score: 0.95, creadoEn: hace(8) }, ahora), { tipo: "complementar", id: "a" });
});
