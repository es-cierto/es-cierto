import { test } from "node:test";
import assert from "node:assert/strict";
import { enLinea, informeHtml } from "./informe.ts";

test("negritas, cursivas y saltos de línea", () => {
  assert.equal(
    enLinea("**Monto** correcto, *fecha* errada<br>otra línea"),
    "<strong>Monto</strong> correcto, <em>fecha</em> errada<br>otra línea",
  );
});

test("las URLs sueltas o entre < > se muestran como su sitio y enlazan a la URL completa", () => {
  assert.equal(
    enLinea("Ver <https://www.bcn.cl/leychile/navegar?idNorma=1214530>."),
    'Ver <a href="https://www.bcn.cl/leychile/navegar?idNorma=1214530" rel="nofollow noopener" title="https://www.bcn.cl/leychile/navegar?idNorma=1214530">bcn.cl</a>.',
  );
  assert.equal(
    enLinea("según https://www.mintrab.gob.cl/x)."),
    'según <a href="https://www.mintrab.gob.cl/x" rel="nofollow noopener" title="https://www.mintrab.gob.cl/x">mintrab.gob.cl</a>).',
  );
});

test("un enlace en markdown conserva su texto", () => {
  assert.equal(
    enLinea("[BCN](https://www.bcn.cl/ley)"),
    '<a href="https://www.bcn.cl/ley" rel="nofollow noopener">BCN</a>',
  );
});

test("el HTML del informe se escapa: nunca se interpreta", () => {
  assert.equal(enLinea("<script>alert(1)</script>"), "&#60;script&#62;alert(1)&#60;/script&#62;");
  assert.equal(enLinea('<img src=x onerror="alert(1)">'), "&#60;img src=x onerror=&#34;alert(1)&#34;&#62;");
  assert.doesNotMatch(informeHtml("# <b onmouseover=alert(1)>x</b>"), /<b /);
});

test("solo se enlazan URLs http(s): javascript: y data: quedan como texto", () => {
  assert.doesNotMatch(enLinea("[clic](javascript:alert(1))"), /<a /);
  assert.doesNotMatch(enLinea("<javascript:alert(1)>"), /<a /);
  assert.doesNotMatch(enLinea("[x](data:text/html,<script>alert(1)</script>)"), /<a /);
});

test("un enlace no puede romper el atributo href", () => {
  const html = enLinea('https://x.cl/"onmouseover="alert(1)');
  assert.doesNotMatch(html, /href="[^"]*"onmouseover/);
  assert.match(html, /&#34;/);
});

test("títulos un par de niveles más abajo (la página ya tiene h1 y h2), separadores y listas", () => {
  assert.equal(
    informeHtml("## 1. Datos confirmados\n\n- uno\n- **dos**\n\n---\n\n1. a\n2. b"),
    "<h4>1. Datos confirmados</h4>\n<ul><li>uno</li><li><strong>dos</strong></li></ul>\n<hr>\n<ol><li>a</li><li>b</li></ol>",
  );
});

test("las tablas se dibujan como tablas, con su encabezado, y los <br> de una celda como saltos", () => {
  assert.equal(
    informeHtml("| Dato | Fuente |\n|------|--------|\n| **$529.000** | BCN<br>Ministerio |"),
    '<div class="tabla"><table><thead><tr><th>Dato</th><th>Fuente</th></tr></thead><tbody><tr><td><strong>$529.000</strong></td><td>BCN<br>Ministerio</td></tr></tbody></table></div>',
  );
});

test("las líneas seguidas forman un párrafo con saltos; una línea en blanco lo cierra", () => {
  assert.equal(
    informeHtml("**Informe**\n**Afirmación:** x\n\notro"),
    "<p><strong>Informe</strong><br><strong>Afirmación:</strong> x</p>\n<p>otro</p>",
  );
});

test("los espacios angostos que escribe el modelo se vuelven espacios comunes", () => {
  assert.equal(informeHtml("el 1\u202Fde\u202Fmayo\u00A0de 2025"), "<p>el 1 de mayo de 2025</p>");
});
