import { test } from "node:test";
import assert from "node:assert/strict";
import { analisisDelHilo, decidir, exigirEvidencia, puedeSeguirConversando } from "./decidir.ts";

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

const id = "11111111-2222-3333-4444-555555555555";
const bot = (texto: string) => ({ deBot: true, texto });
const persona = (texto: string) => ({ deBot: false, texto });

test("el bot deja de responder al llegar a 5 respuestas en el hilo", () => {
  const cuatro = [persona("?"), bot("a"), persona("?"), bot("b"), persona("?"), bot("c"), persona("?"), bot("d")];
  assert.equal(puedeSeguirConversando([...cuatro, persona("?")]), true);
  assert.equal(puedeSeguirConversando([...cuatro, bot("e"), persona("?")]), false);
});

test("el análisis del hilo sale del último link del bot, no de lo que pegue una persona", () => {
  const otro = "99999999-8888-7777-6666-555555555555";
  const hilo = [
    persona("¿es cierto?"),
    bot(`❌ Falso\n→ https://escierto.org/a/${id}`),
    persona(`mira https://escierto.org/a/${otro}`),
  ];
  assert.equal(analisisDelHilo(hilo), id);
});

test("sin link del bot no hay análisis", () => {
  assert.equal(analisisDelHilo([persona("hola"), bot("parece opinión")]), null);
});
