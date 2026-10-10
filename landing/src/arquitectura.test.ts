// Las invariantes de landing/AGENTS.md que se pueden comprobar leyendo el repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const raiz = join(import.meta.dirname, '..');
const leer = (ruta: string) => readFileSync(join(raiz, ruta), 'utf8');
const fuentes = (readdirSync(join(raiz, 'src'), { recursive: true }) as string[])
  .filter((f) => /\.(astro|ts|css)$/.test(f) && !f.endsWith('.test.ts'))
  .map((f) => `src/${f}`);

const hexARgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
function tono(hex: string): { h: number; s: number } {
  const [r, g, b] = hexARgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return { h: 0, s: 0 };
  const s = d / (1 - Math.abs(max + min - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s };
}

test('la paleta no tiene rojos', () => {
  for (const ruta of fuentes) {
    for (const hex of leer(ruta).match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
      const { h, s } = tono(hex);
      const rojo = s > 0.35 && (h < 18 || h > 335);
      assert.ok(!rojo, `${ruta} usa ${hex}, un rojo (tono ${h.toFixed(0)}°)`);
    }
  }
});

test('sin emojis de color: los íconos son Phosphor', () => {
  const emojis = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
  for (const ruta of fuentes) {
    assert.ok(!emojis.test(leer(ruta)), `${ruta} tiene un emoji`);
  }
});

test('la cuenta del bot no es la de otra persona', () => {
  assert.ok(!/['"]escierto\.bsky\.social['"]/.test(leer('src/data/sitio.ts')), 'escierto.bsky.social es de otra persona');
});

test('solo se enlazan URLs https o anclas internas', () => {
  for (const ruta of fuentes) {
    for (const [, url] of leer(ruta).matchAll(/href=["']([^"'{]+)["']/g)) {
      assert.ok(/^(https:\/\/|#|\/)/.test(url), `${ruta} enlaza ${url}`);
    }
    for (const [, url] of leer(ruta).matchAll(/url: '([^']+)'/g)) {
      assert.ok(url.startsWith('https://'), `${ruta} tiene la URL ${url}`);
    }
  }
});

test('el video y las imágenes se declaran como generados con IA', () => {
  assert.match(leer('src/components/Recorrido.astro'), /generadas con IA/);
  assert.match(leer('src/components/Pie.astro'), /generados con IA/);
});

test('hay un clip por tramo, con sus tres variantes, y cada uno pesa menos de 4 MB', () => {
  const paradas = (leer('src/data/sitio.ts').match(/\{ id: '/g) ?? []).length;
  const clips = leer('src/components/Recorrido.astro').match(/const clips = \[([^\]]+)\]/)?.[1].match(/'(\w)'/g) ?? [];
  assert.equal(clips.length, paradas - 1, 'tiene que haber un clip entre cada par de paradas');
  for (const clip of clips.map((c) => c.slice(1, -1))) {
    for (const variante of ['1080.webm', '1080.mp4', '720.mp4']) {
      const ruta = join(raiz, 'public/video', `clip-${clip}-${variante}`);
      assert.ok(existsSync(ruta), `falta ${ruta}`);
      assert.ok(statSync(ruta).size < 4 * 1024 * 1024, `clip-${clip}-${variante} pesa más de 4 MB`);
    }
  }
});

test('cada imagen de parada pesa menos de 300 KB', () => {
  const carpeta = join(raiz, 'src/assets/recorrido');
  for (const archivo of readdirSync(carpeta)) {
    assert.ok(statSync(join(carpeta, archivo)).size < 300 * 1024, `${archivo} pesa más de 300 KB`);
  }
});

test('con movimiento reducido o ahorro de datos no se descarga ningún video', () => {
  assert.match(leer('src/scripts/recorrido.ts'), /if \(!clips\.length \|\| reducir \|\| conexion\?\.saveData\) return;/);
});

test('una palabra para cada cosa: mencionar (no etiquetar) y publicación (no post)', () => {
  for (const ruta of fuentes) {
    const texto = leer(ruta).replace(/class="[^"]*"/g, '').replace(/\/\/.*$/gm, '');
    for (const prohibida of [/\betiquet(a|á|ar|as|o|alo|arlo)\b/i, /\bposts?\b/i]) {
      assert.ok(!prohibida.test(texto), `${ruta} usa ${prohibida}`);
    }
  }
});

test('el texto de lectura no baja de 18 px ni las etiquetas de 14 px', () => {
  for (const ruta of fuentes.filter((r) => r.endsWith('.astro'))) {
    const texto = leer(ruta);
    for (const [, clases] of texto.matchAll(/<p class="([^"]*)"/g)) {
      const esNota = /text-\[11px\]|text-papel\/50/.test(clases);
      assert.ok(esNota || !/\btext-xs\b/.test(clases), `${ruta}: párrafo con text-xs (${clases})`);
    }
  }
});
