import { test } from "node:test";
import assert from "node:assert/strict";
import { itemPublico, parametros } from "./api.ts";

const fila = {
  id: "a3cddb6c-755e-43d2-8550-90fd4fd9d4fc",
  afirmacion: "El sueldo mínimo en Chile subió a $529.000 en julio de 2025.",
  veredicto: "enganoso",
  confianza: "alta",
  resumen: "El salario mínimo subió a $529.000, pero la medida entró en vigor el 1 de mayo de 2025.",
  fuentes: JSON.stringify([
    { titulo: "Ministerio del Trabajo", url: "https://www.mintrab.gob.cl/x" },
    { titulo: "Diario Oficial", url: "https://www.diariooficial.interior.gob.cl/y" },
    { titulo: "Subsecretaría del Trabajo", url: "https://www.subtrab.gob.cl/z" },
  ]),
  corregida_por: null,
  creado_en: 1791667846000,
};

test("lo publicado es la investigación, con las fuentes contadas y sin datos de quién preguntó", () => {
  assert.deepEqual(itemPublico({ ...fila, autor: "did:plc:alguien" }), {
    id: "a3cddb6c-755e-43d2-8550-90fd4fd9d4fc",
    afirmacion: "El sueldo mínimo en Chile subió a $529.000 en julio de 2025.",
    veredicto: "enganoso",
    confianza: "alta",
    resumen: "El salario mínimo subió a $529.000, pero la medida entró en vigor el 1 de mayo de 2025.",
    fuentes: 3,
    corregida: false,
    creadoEn: 1791667846000,
  });
});

test("una investigación corregida se marca como corregida", () => {
  assert.equal(itemPublico({ ...fila, corregida_por: "1f2e3d4c-0000-4000-8000-000000000001" }).corregida, true);
});

test("una fila con un veredicto fuera de la escala no se publica", () => {
  assert.throws(() => itemPublico({ ...fila, veredicto: "dudoso" }));
});

test("sin parámetros: 12 investigaciones desde la más reciente", () => {
  assert.deepEqual(parametros(new URL("https://x/api/investigaciones")), {
    limite: 12,
    antes: Number.MAX_SAFE_INTEGER,
  });
});

test("el límite va de 1 a 50 y lo inválido se ignora", () => {
  assert.equal(parametros(new URL("https://x/api?limite=3")).limite, 3);
  assert.equal(parametros(new URL("https://x/api?limite=500")).limite, 50);
  assert.equal(parametros(new URL("https://x/api?limite=0")).limite, 12);
  assert.equal(parametros(new URL("https://x/api?limite=abc")).limite, 12);
  assert.equal(parametros(new URL("https://x/api?antes=1791667846000")).antes, 1791667846000);
  assert.equal(parametros(new URL("https://x/api?antes=-5")).antes, Number.MAX_SAFE_INTEGER);
});
