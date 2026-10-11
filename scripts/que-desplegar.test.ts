import { test } from "node:test";
import assert from "node:assert/strict";
import { queDesplegar } from "./que-desplegar.ts";

test("solo documentación, tests, perfiles o evals: no se despliega", () => {
  assert.equal(queDesplegar(["README.md", "GOVERNANCE.md", "CONTRIBUTING.md"]), "nada");
  assert.equal(queDesplegar(["bot/verificacion/reglas.test.ts", "landing/src/arquitectura.test.ts"]), "nada");
  assert.equal(queDesplegar(["bot/paginas/AGENTS.md", "landing/AGENTS.md", "landing/PROMPTS.md"]), "nada");
  assert.equal(queDesplegar(["perfiles/datos.ts", "evals/promptfooconfig.yaml", ".github/CODEOWNERS"]), "nada");
});

test("código del bot, migraciones o su configuración: solo el bot", () => {
  assert.equal(queDesplegar(["bot/verificacion/prompts.ts", "bot/verificacion/reglas.test.ts"]), "bot");
  assert.equal(queDesplegar(["migrations/0003_algo.sql"]), "bot");
  assert.equal(queDesplegar(["wrangler.jsonc"]), "bot");
});

test("código de la página: solo la landing", () => {
  assert.equal(queDesplegar(["landing/src/components/Escala.astro"]), "landing");
  assert.equal(queDesplegar(["landing/public/video/clip-A-720.mp4"]), "landing");
});

test("la metodología cambia la página, porque llms-full.txt la incluye entera", () => {
  assert.equal(queDesplegar(["METODOLOGIA.md"]), "landing");
  assert.equal(queDesplegar(["METODOLOGIA.md", "bot/verificacion/prompts.ts"]), "todo");
});

test("las dependencias afectan a los dos", () => {
  assert.equal(queDesplegar(["pnpm-lock.yaml"]), "todo");
  assert.equal(queDesplegar(["bot/index.ts", "landing/src/pages/index.astro"]), "todo");
});

test("una lista vacía (o con líneas en blanco) no despliega", () => {
  assert.equal(queDesplegar([]), "nada");
  assert.equal(queDesplegar(["", ""]), "nada");
});

test("todo .md que el bot o la landing importan al construir dispara su despliegue", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const { dirname, join, normalize, relative } = await import("node:path");
  const raiz = join(import.meta.dirname, "..");
  for (const carpeta of ["bot", "landing/src"]) {
    const archivos = (readdirSync(join(raiz, carpeta), { recursive: true }) as string[]).filter(
      (f) => /\.(ts|astro|mjs)$/.test(f) && !f.endsWith(".test.ts"),
    );
    for (const archivo of archivos) {
      const texto = readFileSync(join(raiz, carpeta, archivo), "utf8");
      for (const [, ruta] of texto.matchAll(/from ["']([^"']+\.md)(?:\?raw)?["']/g)) {
        const md = relative(raiz, normalize(join(raiz, carpeta, dirname(archivo), ruta)));
        assert.notEqual(queDesplegar([md]), "nada", `${carpeta}/${archivo} importa ${md}, pero cambiarlo no despliega`);
      }
    }
  }
});
