import { test } from "node:test";
import assert from "node:assert/strict";
import { avisosDeCorreccion, claimReview, type FilaInvestigacion } from "./investigacionPublica.ts";

const fila: FilaInvestigacion = {
  afirmacion: "El sueldo mínimo subió a $529.000 en julio de 2025.",
  veredicto: "mayormente_verdadero",
  confianza: "alta",
  resumen: "El monto es correcto, pero rige desde mayo.",
  fuentes: "[]",
  informe: "",
  modelo: "@cf/openai/gpt-oss-120b",
  anterior_id: null,
  corregida_por: null,
  nota_correccion: null,
  creado_en: Date.parse("2026-10-10T15:00:00Z"),
};
const url = "https://escierto.org/a/0b8c2f9e-3c1a-4c55-9d3e-2f6a1b7c8d90";

test("ClaimReview lleva la afirmación, la fecha y el veredicto con su puntaje", () => {
  const datos: unknown = JSON.parse(claimReview(fila, url, "Mayormente verdadero"));
  assert.deepEqual(datos, {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    url,
    claimReviewed: "El sueldo mínimo subió a $529.000 en julio de 2025.",
    datePublished: "2026-10-10",
    author: { "@type": "Organization", name: "¿Es Cierto?", url: "https://escierto.org/" },
    reviewRating: {
      "@type": "Rating",
      alternateName: "Mayormente verdadero",
      ratingValue: 3,
      bestRating: 4,
      worstRating: 1,
    },
  });
});

test("no verificable va sin puntaje: no es un punto de la escala", () => {
  const texto = claimReview({ ...fila, veredicto: "no_verificable" }, url, "No verificable");
  assert.doesNotMatch(texto, /ratingValue/);
  assert.match(texto, /"alternateName":"No verificable"/);
});

test("una afirmación con </script> no puede cerrar la etiqueta del marcado", () => {
  const texto = claimReview({ ...fila, afirmacion: "</script><script>alert(1)</script>" }, url, "Falso");
  assert.doesNotMatch(texto, /</);
  assert.match(texto, /\\u003c\/script>/);
});

test("una investigación sin corrección no muestra avisos", () => {
  assert.deepEqual(avisosDeCorreccion(fila), { corregida: "", correccion: "" });
});

test("la investigación corregida avisa y enlaza a la versión nueva", () => {
  const { corregida } = avisosDeCorreccion({ ...fila, corregida_por: "1f2e3d4c-0000-4000-8000-000000000001" });
  assert.match(corregida, /Esta investigación fue corregida/);
  assert.match(corregida, /href="\/a\/1f2e3d4c-0000-4000-8000-000000000001"/);
});

test("la versión nueva muestra la nota escapada y enlaza a la anterior", () => {
  const { correccion } = avisosDeCorreccion({
    ...fila,
    anterior_id: "0b8c2f9e-3c1a-4c55-9d3e-2f6a1b7c8d90",
    nota_correccion: "La fecha era <mayo>, no julio.",
  });
  assert.ok(correccion.includes("La fecha era &#60;mayo&#62;, no julio."));
  assert.match(correccion, /href="\/a\/0b8c2f9e-3c1a-4c55-9d3e-2f6a1b7c8d90"/);
});

test("al compartir, la tarjeta lleva el veredicto, la afirmación, el resumen y la imagen de su veredicto", async () => {
  const { metaParaCompartir } = await import("./html.ts");
  const meta = metaParaCompartir({
    titulo: "Engañoso: «El sueldo mínimo subió a $529.000 en julio de 2025.»",
    descripcion: "El monto es correcto, pero rige desde mayo.",
    url: "https://escierto.cierto.workers.dev/a/a3cddb6c-755e-43d2-8550-90fd4fd9d4fc",
    imagen: "https://es.cierto.workers.dev/og/enganoso.png",
  });
  assert.match(meta, /<meta property="og:image" content="https:\/\/es\.cierto\.workers\.dev\/og\/enganoso\.png">/);
  assert.match(meta, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(
    meta,
    /<meta property="og:title" content="Engañoso: «El sueldo mínimo subió a \$529\.000 en julio de 2025\.»">/,
  );
});

test("una afirmación con comillas no puede romper las etiquetas de la tarjeta", async () => {
  const { metaParaCompartir } = await import("./html.ts");
  const meta = metaParaCompartir({
    titulo: 'x"><script>alert(1)</script>',
    descripcion: "y",
    url: "https://x.cl/a/1",
    imagen: "https://x.cl/og/falso.png",
  });
  assert.doesNotMatch(meta, /<script>/);
  assert.match(meta, /content="x&#34;&#62;&#60;script&#62;/);
});
