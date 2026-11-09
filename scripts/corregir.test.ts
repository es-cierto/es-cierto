import assert from "node:assert/strict";
import { test } from "node:test";
import { datosDePagina, enlaceDeInvestigacion, veredictoDeEtiqueta } from "./corregir.ts";

const CORREGIDA = `<!doctype html><html lang="es"><head><title>No verificable: La Tierra es plana · ¿Es Cierto?</title>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"ClaimReview","url":"https://escierto.cierto.workers.dev/a/f71e2130-6090-48db-ba62-e11d3311c2e1","claimReviewed":"La Tierra es plana","datePublished":"2026-11-09","author":{"@type":"Organization","name":"¿Es Cierto?","url":"https://escierto.cierto.workers.dev/"},"reviewRating":{"@type":"Rating","alternateName":"No verificable"}}</script>
</head><body><div class="aviso" role="alert"><p><strong>Esta investigación fue corregida.</strong> <a href="/a/42df3dcf-fede-4735-b39b-81d3b00e6896">Ver la versión corregida</a>.</p></div></body></html>`;

const VIGENTE = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"ClaimReview","claimReviewed":"La Tierra es plana","reviewRating":{"@type":"Rating","alternateName":"Falso","ratingValue":1,"bestRating":4,"worstRating":1}}</script>
<p>Corrección: La búsqueda falló. <a href="/a/f71e2130-6090-48db-ba62-e11d3311c2e1">Ver la versión anterior</a>.</p>`;

test("el enlace de una investigación da el sitio y el id", () => {
  assert.deepEqual(
    enlaceDeInvestigacion(" https://escierto.cierto.workers.dev/a/f71e2130-6090-48db-ba62-e11d3311c2e1 "),
    { origen: "https://escierto.cierto.workers.dev", id: "f71e2130-6090-48db-ba62-e11d3311c2e1" },
  );
});

test("un enlace que no es de una investigación se rechaza", () => {
  assert.throws(() => enlaceDeInvestigacion("https://es.cierto.workers.dev/"), /no es el enlace a una investigación/);
  assert.throws(() => enlaceDeInvestigacion("f71e2130-6090-48db-ba62-e11d3311c2e1"), /no es el enlace/);
});

test("la etiqueta de la página se traduce al veredicto", () => {
  assert.equal(veredictoDeEtiqueta("No verificable"), "no_verificable");
  assert.equal(veredictoDeEtiqueta("Mayormente verdadero"), "mayormente_verdadero");
  assert.equal(veredictoDeEtiqueta("Engañoso"), "enganoso");
  assert.throws(() => veredictoDeEtiqueta("Verdadero a medias"), /veredicto desconocido/);
});

test("de una página ya corregida se lee la afirmación, el veredicto y la versión nueva", () => {
  assert.deepEqual(datosDePagina(CORREGIDA), {
    afirmacion: "La Tierra es plana",
    veredicto: "no_verificable",
    corregidaPor: "42df3dcf-fede-4735-b39b-81d3b00e6896",
  });
});

test("el enlace a la versión anterior no cuenta como corrección", () => {
  assert.deepEqual(datosDePagina(VIGENTE), {
    afirmacion: "La Tierra es plana",
    veredicto: "falso",
    corregidaPor: null,
  });
});
