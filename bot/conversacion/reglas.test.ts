import { test } from "node:test";
import assert from "node:assert/strict";
import { enlacesDe } from "../shared/enlaces.ts";
import {
  ajustarLargo,
  investigacionDelHilo,
  LARGO_MAXIMO_RESPUESTA,
  puedeSeguirConversando,
  respaldarRespuesta,
  respuestaPublicable,
} from "./reglas.ts";

const id = "11111111-2222-3333-4444-555555555555";
const bot = (texto: string) => ({ deBot: true, texto });
const persona = (texto: string) => ({ deBot: false, texto });

test("el bot deja de responder al llegar a 5 respuestas en el hilo", () => {
  const cuatro = [persona("?"), bot("a"), persona("?"), bot("b"), persona("?"), bot("c"), persona("?"), bot("d")];
  assert.equal(puedeSeguirConversando([...cuatro, persona("?")]), true);
  assert.equal(puedeSeguirConversando([...cuatro, bot("e"), persona("?")]), false);
});

test("la investigación del hilo sale del último link del bot, no de lo que pegue una persona", () => {
  const otro = "99999999-8888-7777-6666-555555555555";
  const hilo = [
    persona("¿es cierto?"),
    bot(`❌ Falso\n→ https://escierto.org/a/${id}`),
    persona(`mira https://escierto.org/a/${otro}`),
  ];
  assert.equal(investigacionDelHilo(hilo), id);
});

test("sin link del bot no hay investigación", () => {
  assert.equal(investigacionDelHilo([persona("hola"), bot("parece opinión")]), null);
});

const investigacion = JSON.stringify({ informe: "Según la BCN (https://www.bcn.cl/leychile/21578), subió 6%." });
const pagina = `https://escierto.org/a/${id}`;

test("una respuesta que cita fuentes de la investigación pasa tal cual", () => {
  const texto = "Sale de la BCN: https://www.bcn.cl/leychile/21578. Detalle en " + pagina;
  assert.equal(respaldarRespuesta(texto, investigacion, pagina), texto);
});

test("una respuesta sin enlaces pasa tal cual", () => {
  assert.equal(respaldarRespuesta("El reajuste fue de 6%.", investigacion, pagina), "El reajuste fue de 6%.");
});

test("un enlace inventado descarta la respuesta y manda a la investigación", () => {
  const respuesta = respaldarRespuesta("Fuente: https://inventado.cl/dato", investigacion, pagina);
  assert.ok(!respuesta.includes("inventado.cl"));
  assert.ok(respuesta.includes(pagina));
});

test("sin investigación, cualquier enlace se descarta", () => {
  const respuesta = respaldarRespuesta("Mira https://algo.cl", null, null);
  assert.equal(enlacesDe(respuesta).length, 0);
});

test("una respuesta corta no se toca", () => {
  assert.equal(ajustarLargo("Rige desde el 1 de mayo.", pagina), "Rige desde el 1 de mayo.");
});

test("una respuesta larga se corta en un fin de oración, sin partir el enlace", () => {
  const enlace = "https://www.bcn.cl/leychile/21578";
  const larga = `Rige desde el 1 de mayo de 2025, según la ley (${enlace}). ${"La ley se publicó a fines de junio con efecto retroactivo. ".repeat(6)}`;
  const respuesta = ajustarLargo(larga, pagina);
  assert.ok([...respuesta].length <= LARGO_MAXIMO_RESPUESTA);
  assert.ok(respuesta.includes(enlace));
  assert.match(respuesta, /[.!?]$/);
});

test("si ni la primera oración cabe, se manda a la investigación", () => {
  assert.equal(ajustarLargo("a".repeat(400), pagina), `Los datos y sus fuentes están en la investigación completa: ${pagina}`);
});

test("lo publicable pasa por los dos filtros", () => {
  const larga = `Fuente: https://inventado.cl/dato. ${"Texto. ".repeat(60)}`;
  assert.ok(respuestaPublicable(larga, investigacion, pagina).includes(pagina));
});
