import { test } from "node:test";
import assert from "node:assert/strict";
import { decidir, exigirEvidencia } from "./decidir.ts";

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

const redactado = { veredicto: "falso", confianza: "alta", resumen: "x" } as const;

test("un veredicto sin fuentes queda como no verificable", () => {
  assert.deepEqual(exigirEvidencia({ ...redactado, fuentes: [] }), {
    ...redactado,
    veredicto: "no_verificable",
    confianza: "baja",
    fuentes: [],
  });
});

test("fuentes que no son http(s) no cuentan como evidencia", () => {
  const resultado = exigirEvidencia({ ...redactado, fuentes: [{ titulo: "x", url: "javascript:alert(1)" }] });
  assert.equal(resultado.veredicto, "no_verificable");
  assert.deepEqual(resultado.fuentes, []);
});

test("con una fuente web el veredicto se mantiene", () => {
  const fuente = { titulo: "BCN", url: "https://www.bcn.cl/leychile" };
  assert.deepEqual(exigirEvidencia({ ...redactado, fuentes: [fuente] }), { ...redactado, fuentes: [fuente] });
});
