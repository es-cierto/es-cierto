import { test } from "node:test";
import assert from "node:assert/strict";
import { consultasNuevas, decidir, exigirEvidencia } from "./reglas.ts";

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
  assert.deepEqual(exigirEvidencia({ ...redactado, fuentes: [] }, ""), {
    ...redactado,
    veredicto: "no_verificable",
    confianza: "baja",
    fuentes: [],
  });
});

test("fuentes que no son http(s) no cuentan como evidencia", () => {
  const resultado = exigirEvidencia({ ...redactado, fuentes: [{ titulo: "x", url: "javascript:alert(1)" }] }, "javascript:alert(1)");
  assert.equal(resultado.veredicto, "no_verificable");
  assert.deepEqual(resultado.fuentes, []);
});

test("con una fuente web el veredicto se mantiene", () => {
  const fuente = { titulo: "BCN", url: "https://www.bcn.cl/leychile" };
  const evidencia = "- Ley 21.578 (https://www.bcn.cl/leychile/)\n  texto";
  assert.deepEqual(exigirEvidencia({ ...redactado, fuentes: [fuente] }, evidencia), { ...redactado, fuentes: [fuente] });
});

test("una fuente que no apareció en la búsqueda no cuenta", () => {
  const inventada = { titulo: "x", url: "https://inventado.cl/dato" };
  const resultado = exigirEvidencia({ ...redactado, fuentes: [inventada] }, "- BCN (https://www.bcn.cl/leychile)");
  assert.equal(resultado.veredicto, "no_verificable");
});

test("en la primera ronda se busca aunque el modelo diga que basta", () => {
  assert.deepEqual(consultasNuevas({ suficiente: true, consultas: ["ipc chile 2025"] }, []), ["ipc chile 2025"]);
});

test("con evidencia reunida y suficiente, se deja de buscar", () => {
  assert.deepEqual(consultasNuevas({ suficiente: true, consultas: ["otra"] }, ["ipc chile 2025"]), []);
});

test("no se repiten búsquedas ya hechas ni se pasa del tope por ronda", () => {
  const plan = { suficiente: false, consultas: ["IPC  Chile 2025", "ine ipc", "ine ipc", "bcn", "dipres", "extra"] };
  assert.deepEqual(consultasNuevas(plan, ["ipc chile 2025"]), ["ine ipc", "bcn", "dipres"]);
});

test("si el modelo solo repite búsquedas, se termina", () => {
  assert.deepEqual(consultasNuevas({ suficiente: false, consultas: ["ipc chile 2025"] }, ["ipc chile 2025"]), []);
});
