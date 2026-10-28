import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { bluesky, github } from "./datos.ts";

const raiz = join(import.meta.dirname, "..");
const grafemas = (texto: string) => [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(texto)].length;

function medidas(ruta: string): { ancho: number; alto: number } {
  const b = readFileSync(join(raiz, ruta));
  if (b.readUInt32BE(0) === 0x89504e47) return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) };
  for (let i = 2; i < b.length;) {
    const marcador = b[i + 1];
    if (marcador >= 0xc0 && marcador <= 0xc3) return { alto: b.readUInt16BE(i + 5), ancho: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`${ruta}: no encontré las medidas`);
}

test("los textos de Bluesky caben en sus límites (nombre 64, biografía 256 grafemas)", () => {
  assert.ok(grafemas(bluesky.nombre) <= 64, `nombre: ${grafemas(bluesky.nombre)}`);
  assert.ok(grafemas(bluesky.biografia) <= 256, `biografía: ${grafemas(bluesky.biografia)}`);
});

test("los textos de GitHub caben en sus límites y los temas tienen formato válido", () => {
  assert.ok(github.descripcion.length <= 160, `descripción de la organización: ${github.descripcion.length}`);
  assert.ok(github.repo.descripcion.length <= 350, `descripción del repo: ${github.repo.descripcion.length}`);
  assert.ok(github.repo.temas.length <= 20);
  for (const tema of github.repo.temas) assert.match(tema, /^[a-z0-9][a-z0-9-]{0,49}$/, `tema inválido: ${tema}`);
});

test("el perfil del bot dice que responde con IA y que las imágenes son generadas con IA", () => {
  assert.match(bluesky.biografia, /automáticas con IA/);
  assert.match(bluesky.biografia, /Imágenes generadas con IA/);
});

test("una palabra para cada cosa: mencionar (no etiquetar) y publicación (no post)", () => {
  for (const texto of [bluesky.biografia, github.descripcion, github.repo.descripcion]) {
    assert.doesNotMatch(texto, /etiquet|\bpost\b|\btag/i, texto);
  }
});

test('los perfiles no le dicen "bot" a ¿Es Cierto?', () => {
  for (const texto of [bluesky.biografia, github.descripcion, github.repo.descripcion]) {
    assert.doesNotMatch(texto, /\bbots?\b/i, texto);
  }
});

test("el avatar no tiene rojo: menos de 0,5% de píxeles rojizos saturados", async () => {
  const sharp = createRequire(join(raiz, "landing/package.json"))("sharp") as (ruta: string) => {
    resize(
      ancho: number,
      alto: number,
    ): { raw(): { toBuffer(o: { resolveWithObject: true }): Promise<{ data: Buffer }> } };
  };
  const { data } = await sharp(join(raiz, bluesky.avatar)).resize(100, 100).raw().toBuffer({ resolveWithObject: true });
  let rojos = 0;
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    const tono =
      d === 0 ? 0 : max === r ? (((g - b) / d) % 6) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
    const rojo = (tono + 360) % 360 < 15 || (tono + 360) % 360 > 335;
    if (rojo && max > 0.25 && d / max > 0.45) {
      rojos++;
    }
  }
  assert.ok(rojos / (data.length / 3) < 0.005, `${rojos} píxeles rojizos`);
});

test("las imágenes tienen la forma y el peso que aceptan las redes", () => {
  const avatar = medidas(bluesky.avatar);
  assert.equal(avatar.ancho, avatar.alto, "el avatar es cuadrado");
  const portada = medidas(bluesky.portada);
  assert.equal(portada.ancho, portada.alto * 3, "la portada de Bluesky es 3:1");
  for (const ruta of [bluesky.avatar, bluesky.portada]) {
    assert.ok(statSync(join(raiz, ruta)).size < 1_000_000, `${ruta} pesa 1 MB o más`);
  }
});

test("el prompt del avatar no pide símbolos de un sector: solo el nudo del proyecto", () => {
  const prompt = readFileSync(join(raiz, "perfiles/avatar-prompt.md"), "utf8").match(/```\n([\s\S]*?)```/)?.[1] ?? "";
  const [pedido, evitar = ""] = prompt.split("Avoid:");
  assert.ok(pedido.length > 0, "no encontré el prompt");
  assert.doesNotMatch(
    pedido,
    /\b(star|flag|shield|crest|eagle|laurel|check ?mark)s?\b/i,
    "el prompt pide un símbolo que alguien puede leer como de un sector",
  );
  assert.match(pedido, /knot/i, "el sello lleva el nudo del proyecto");
  assert.match(evitar, /stars/i, "la lista Avoid excluye las estrellas");
});
