// Las reglas de perfiles/AGENTS.md que se pueden comprobar leyendo el repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { bluesky, github } from "./datos.ts";

const raiz = join(import.meta.dirname, "..");
const grafemas = (texto: string) => [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(texto)].length;

// PNG: ancho y alto en el encabezado IHDR. JPEG: en el primer marcador SOF.
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

test("el avatar no tiene rojo: los colores son los de la landing", () => {
  const colores = readFileSync(join(raiz, "perfiles/avatar.svg"), "utf8").match(/#[0-9a-fA-F]{6}\b/g) ?? [];
  assert.deepEqual([...new Set(colores.map((c) => c.toLowerCase()))].sort(), ["#131209", "#d6b27c", "#f3eadb"]);
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
