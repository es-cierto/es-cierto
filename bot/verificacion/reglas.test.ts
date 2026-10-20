import { test } from "node:test";
import assert from "node:assert/strict";
import type { PedidoCorreccion } from "./veredicto.ts";
import {
  consultasNuevas,
  decidir,
  exigirEvidencia,
  problemaDeCorreccion,
  textoDeCorreccion,
  vistaPrevia,
} from "./reglas.ts";

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
  const resultado = exigirEvidencia(
    { ...redactado, fuentes: [{ titulo: "x", url: "javascript:alert(1)" }] },
    "javascript:alert(1)",
  );
  assert.equal(resultado.veredicto, "no_verificable");
  assert.deepEqual(resultado.fuentes, []);
});

test("con una sola fuente el veredicto se mantiene, pero la confianza no puede ser alta", () => {
  const fuente = { titulo: "BCN", url: "https://www.bcn.cl/leychile" };
  const evidencia = "- Ley 21.578 (https://www.bcn.cl/leychile/)\n  texto";
  assert.deepEqual(exigirEvidencia({ ...redactado, fuentes: [fuente] }, evidencia), {
    ...redactado,
    confianza: "media",
    fuentes: [fuente],
  });
});

test("dos fuentes de sitios distintos permiten confianza alta", () => {
  const fuentes = [
    { titulo: "Ministerio del Trabajo", url: "https://www.mintrab.gob.cl/ingreso-minimo" },
    { titulo: "Diario Oficial", url: "https://www.diariooficial.interior.gob.cl/edicion/2025" },
  ];
  const evidencia =
    "https://www.mintrab.gob.cl/ingreso-minimo y https://www.diariooficial.interior.gob.cl/edicion/2025";
  assert.equal(exigirEvidencia({ ...redactado, fuentes }, evidencia).confianza, "alta");
});

test("dos páginas del mismo sitio cuentan como una sola fuente", () => {
  const fuentes = [
    { titulo: "BCN, ley", url: "https://www.bcn.cl/leychile/21578" },
    { titulo: "BCN, historia", url: "https://bcn.cl/historia-ley/21578" },
  ];
  const evidencia = "https://www.bcn.cl/leychile/21578 https://bcn.cl/historia-ley/21578";
  assert.equal(exigirEvidencia({ ...redactado, fuentes }, evidencia).confianza, "media");
});

test("una confianza baja o media no sube por tener muchas fuentes", () => {
  const fuentes = [
    { titulo: "A", url: "https://a.cl/x" },
    { titulo: "B", url: "https://b.cl/y" },
  ];
  assert.equal(
    exigirEvidencia({ ...redactado, confianza: "baja", fuentes }, "https://a.cl/x https://b.cl/y").confianza,
    "baja",
  );
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

const pedido = {
  investigacionId: "0b8c2f9e-3c1a-4c55-9d3e-2f6a1b7c8d90",
  veredicto: "mayormente_verdadero",
  confianza: "media",
  resumen: "El monto es correcto, pero rige desde mayo.",
  fuentes: [{ titulo: "Ministerio del Trabajo", url: "https://www.mintrab.gob.cl/ingreso-minimo" }],
  nota: "La fecha de vigencia es el 1 de mayo, no julio.",
} satisfies PedidoCorreccion;

test("una corrección con fuentes https es válida", () => {
  assert.equal(problemaDeCorreccion(pedido), null);
});

test("una corrección no acepta fuentes que no sean https", () => {
  assert.equal(
    problemaDeCorreccion({ ...pedido, fuentes: [{ titulo: "x", url: "http://sitio.cl" }] }),
    "todas las fuentes tienen que ser enlaces https",
  );
});

test("solo no verificable puede corregirse sin fuentes", () => {
  assert.equal(
    problemaDeCorreccion({ ...pedido, fuentes: [] }),
    "un veredicto distinto de no verificable necesita al menos una fuente",
  );
  assert.equal(problemaDeCorreccion({ ...pedido, veredicto: "no_verificable", fuentes: [] }), null);
});

test("el aviso de corrección dice qué veredicto había y cuál queda", () => {
  assert.equal(
    textoDeCorreccion("falso", "mayormente_verdadero", "La fecha de vigencia es el 1 de mayo."),
    "Corrección: revisamos esta verificación. Antes: ❌ Falso. Ahora: ☑️ Mayormente verdadero.\nLa fecha de vigencia es el 1 de mayo.",
  );
  assert.equal(
    textoDeCorreccion("falso", "falso", "Se agregó una segunda fuente."),
    "Corrección: revisamos esta verificación. Mantiene: ❌ Falso.\nSe agregó una segunda fuente.",
  );
});

test("una corrección con confianza alta también necesita dos sitios distintos", () => {
  assert.equal(
    problemaDeCorreccion({ ...pedido, confianza: "alta" }),
    "la confianza alta necesita fuentes de al menos 2 sitios distintos, igual que en una investigación",
  );
  const dosSitios = [...pedido.fuentes, { titulo: "BCN", url: "https://www.bcn.cl/leychile/21751" }];
  assert.equal(problemaDeCorreccion({ ...pedido, confianza: "alta", fuentes: dosSitios }), null);
});

test("la vista previa de un enlace sale de las etiquetas og de la página", () => {
  const html = `<head><title>El castigo a Pedro Araya | BioBioChile</title>
<meta name="description" content="La decisión de reemplazar al senador Pedro Araya en la Comisión de Constitución, dejándolo fuera de su presidencia, abrió un..."/>
<meta property="og:title" content='El castigo a Pedro Araya que complicaría los planes del PS para presidir el Senado' />
<meta content="Bachelet dijo &quot;no&quot; &#8212; y el PS &amp; el PPD esperan" property="og:description" />`;
  assert.deepEqual(vistaPrevia(html), {
    titulo: "El castigo a Pedro Araya que complicaría los planes del PS para presidir el Senado",
    descripcion: 'Bachelet dijo "no" — y el PS & el PPD esperan',
  });
});

test("sin etiquetas og, la vista previa usa el título y la descripción de la página", () => {
  const html = `<title>Ley 21.719 &#x2014; Protección de datos</title><meta name="Description" content="Texto de la ley.">`;
  assert.deepEqual(vistaPrevia(html), { titulo: "Ley 21.719 — Protección de datos", descripcion: "Texto de la ley." });
});
