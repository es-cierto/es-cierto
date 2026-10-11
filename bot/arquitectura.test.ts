import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const raiz = join(import.meta.dirname, "..");
const leer = (ruta: string) => readFileSync(join(raiz, ruta), "utf8");
const codigo = (readdirSync(join(raiz, "bot"), { recursive: true }) as string[])
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => `bot/${f}`);
const dominios = readdirSync(join(raiz, "bot"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const dominioDe = (ruta: string) => (ruta.split("/").length > 2 ? ruta.split("/")[1] : null);

const FRONTERAS: Record<string, string[]> = {
  shared: [],
  verificacion: ["shared"],
  conversacion: ["shared"],
  redes: ["shared"],
  paginas: ["shared", "verificacion", "redes", "bot"],
};

test("cada dominio tiene su AGENTS.md, sus fronteras y su lugar en el AGENTS.md de la raíz", () => {
  const agentesRaiz = leer("AGENTS.md");
  for (const dominio of dominios) {
    assert.ok(existsSync(join(raiz, "bot", dominio, "AGENTS.md")), `bot/${dominio}/ no tiene AGENTS.md`);
    assert.ok(agentesRaiz.includes(`\`bot/${dominio}/\``), `bot/${dominio}/ no aparece en el AGENTS.md de la raíz`);
    assert.ok(dominio in FRONTERAS, `bot/${dominio}/ no tiene fronteras declaradas en FRONTERAS`);
  }
});

test("todo archivo tiene su lugar en el AGENTS.md que le corresponde", () => {
  for (const ruta of codigo) {
    const dominio = dominioDe(ruta);
    const guia = dominio ? `bot/${dominio}/AGENTS.md` : "AGENTS.md";
    const nombre = dominio ? ruta.split("/").at(-1) : ruta;
    assert.ok(leer(guia).includes(`\`${nombre}\``), `${ruta} no aparece en ${guia}`);
  }
});

test("los AGENTS.md solo nombran archivos que existen", () => {
  const guias = ["AGENTS.md", ...dominios.map((d) => `bot/${d}/AGENTS.md`)].filter((g) => existsSync(join(raiz, g)));
  for (const guia of guias) {
    for (const ruta of leer(guia).match(/`[\w./-]+\.(?:ts|mjs|yaml|md)`/g) ?? []) {
      const limpia = ruta.slice(1, -1);
      const existe = existsSync(join(raiz, limpia)) || existsSync(join(raiz, dirname(guia), limpia));
      assert.ok(existe, `${guia} nombra ${ruta}, que no existe`);
    }
  }
});

test("ningún dominio importa fuera de sus fronteras", () => {
  for (const ruta of codigo) {
    const dominio = dominioDe(ruta);
    if (!dominio) {
      continue;
    }
    for (const [, destino] of leer(ruta).matchAll(/from "(\.[^"]+)"/g)) {
      const importado = normalize(join(dirname(ruta), destino));
      const otro = dominioDe(importado) ?? "bot";
      const permitido: boolean = otro === dominio || FRONTERAS[dominio].includes(otro);
      assert.ok(permitido, `${ruta} importa ${importado}: ${dominio} no puede depender de ${otro}`);
    }
  }
});

test("solo shared/modelo.ts llama al modelo de texto (el embedding del Workflow es la excepción)", () => {
  for (const ruta of codigo) {
    for (const llamada of leer(ruta).match(/\b(?:ai|AI)\.run\([^,]+/g) ?? []) {
      const permitida = ruta === "bot/shared/modelo.ts" || (ruta === "bot/chequeo.ts" && llamada.includes("bge-m3"));
      assert.ok(permitida, `${ruta} llama al modelo: ${llamada}`);
    }
  }
});

test("todo system prompt declara que el contenido de terceros es dato", () => {
  const prompts = codigo.flatMap((ruta) => leer(ruta).match(/system: `[\s\S]*?`,\n/g) ?? []);
  assert.ok(prompts.length > 0);
  for (const prompt of prompts) {
    assert.ok(prompt.includes("${REGLA_DATO}"), `prompt sin REGLA_DATO: ${prompt.slice(0, 80)}…`);
  }
});

test("JSON.parse nunca se castea: se valida con zod o queda como unknown", () => {
  for (const ruta of codigo) {
    for (const linea of leer(ruta)
      .split("\n")
      .filter((l) => l.includes("JSON.parse("))) {
      const validada = /\.parse\(JSON\.parse\(/.test(linea) || /:\s*unknown\s*=/.test(linea);
      assert.ok(validada, `${ruta}: ${linea.trim()}`);
    }
  }
});

test("el veredicto que sale de una investigación pasa por exigirEvidencia", () => {
  assert.match(leer("bot/verificacion/investigacion.ts"), /veredicto: exigirEvidencia\(/);
  assert.match(leer("bot/chequeo.ts"), /const \{ informe, veredicto \} = await investigarAfirmacion\(/);
});

test("cada secreto está en wrangler.jsonc, .dev.vars.example y el README", () => {
  const wrangler = leer("wrangler.jsonc").match(/"required":\s*\[([^\]]*)\]/)?.[1] ?? "";
  const requeridos = [...wrangler.matchAll(/"(\w+)"/g)].map((m) => m[1]).sort();
  const ejemplo = [...leer(".dev.vars.example").matchAll(/^(\w+)=/gm)].map((m) => m[1]).sort();
  // En el README, los secretos van listados en la sección de despliegue: "- `NOMBRE`: para qué sirve".
  const seccion = leer("README.md").split("## Desplegar")[1]?.split("\n## ")[0] ?? "";
  const readme = [...seccion.matchAll(/^- `([A-Z_]+)`:/gm)].map((m) => m[1]).sort();
  assert.deepEqual(ejemplo, requeridos, ".dev.vars.example no coincide con secrets.required");
  assert.deepEqual(readme, requeridos, "los pasos de despliegue del README no coinciden con secrets.required");
});

test("cambiar un prompt o un umbral obliga a actualizar METODOLOGIA.md", () => {
  const base = process.env.METODOLOGIA_BASE || "HEAD";
  const enHead = (ruta: string) => {
    try {
      return execFileSync("git", ["show", `${base}:${ruta}`], { cwd: raiz, encoding: "utf8", stdio: "pipe" });
    } catch {
      return null;
    }
  };
  const metodologia = (texto: string) =>
    [...(texto.match(/system: `[\s\S]*?`/g) ?? []), ...(texto.match(/^export const [A-Z_]+ = .*$/gm) ?? [])].join("\n");
  const cambiados = codigo.filter((ruta) => {
    const antes = enHead(ruta);
    return antes !== null && metodologia(antes) !== metodologia(leer(ruta));
  });
  if (cambiados.length > 0) {
    assert.notEqual(enHead("METODOLOGIA.md"), leer("METODOLOGIA.md"), `${cambiados.join(", ")} cambió la metodología`);
  }
});

test("todo `pnpm <script>` que citan las guías existe", () => {
  const guias = ["AGENTS.md", "README.md", "CONTRIBUTING.md", "landing/AGENTS.md"];
  for (const guia of guias) {
    const paquete = guia.startsWith("landing/") ? "landing/package.json" : "package.json";
    const scripts = Object.keys((JSON.parse(leer(paquete)) as { scripts: Record<string, string> }).scripts);

    const texto = leer(guia);
    const bloque = guia === "README.md" ? (texto.match(/cd landing[\s\S]*?```/)?.[0] ?? "") : "";
    const [antes, despues] = [texto.replace(bloque, ""), bloque];
    const citas = (texto: string) => [...texto.matchAll(/(?:^|`|&& )pnpm (?:run )?([a-z][\w:-]*)/gm)].map((m) => m[1]);
    const integrados = new Set(["install", "add", "remove", "exec", "dlx", "approve-builds"]);
    for (const script of citas(antes).filter((s) => !integrados.has(s))) {
      assert.ok(scripts.includes(script), `${guia} cita \`pnpm ${script}\`, que no está en ${paquete}`);
    }
    const landing = Object.keys(
      (JSON.parse(leer("landing/package.json")) as { scripts: Record<string, string> }).scripts,
    );
    for (const script of citas(despues).filter((s) => !integrados.has(s))) {
      assert.ok(
        landing.includes(script),
        `README cita \`pnpm ${script}\` después de \`cd landing\`, que no está en landing/package.json`,
      );
    }
  }
});

test("las migraciones solo se agregan: una ya commiteada no se edita, y van numeradas sin saltos", () => {
  const base = process.env.METODOLOGIA_BASE || "HEAD";
  const migraciones = readdirSync(join(raiz, "migrations")).sort();
  migraciones.forEach((nombre, i) => {
    assert.match(
      nombre,
      new RegExp(`^${String(i + 1).padStart(4, "0")}_[a-z0-9_]+\\.sql$`),
      `migración mal numerada: ${nombre}`,
    );
    let antes: string | null = null;
    try {
      antes = execFileSync("git", ["show", `${base}:migrations/${nombre}`], {
        cwd: raiz,
        encoding: "utf8",
        stdio: "pipe",
      });
    } catch {}
    if (antes !== null) {
      assert.equal(
        leer(`migrations/${nombre}`),
        antes,
        `migrations/${nombre} ya estaba commiteada: crea una migración nueva`,
      );
    }
  });
});

test("CODEOWNERS solo nombra rutas que existen y cubre lo que define la metodología", () => {
  const reglas = leer(".github/CODEOWNERS")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.trim().split(/\s+/));
  for (const [ruta, ...duenos] of reglas) {
    assert.ok(existsSync(join(raiz, ruta)), `CODEOWNERS nombra ${ruta}, que no existe`);
    assert.ok(duenos.length > 0, `${ruta} no tiene dueño en CODEOWNERS`);
  }
  const cubiertas = new Set(reglas.map(([ruta]) => ruta));

  const metodologia = codigo.filter((ruta) => /system: `|^export const [A-Z_]+ = /m.test(leer(ruta)));
  for (const ruta of ["METODOLOGIA.md", ...metodologia]) {
    assert.ok(cubiertas.has(ruta), `${ruta} define metodología y no tiene dueño en CODEOWNERS`);
  }
});

test("producción solo se despliega en la cuenta del proyecto y los wrangler.jsonc no fijan cuenta", () => {
  for (const archivo of ["wrangler.jsonc", "landing/wrangler.jsonc"]) {
    assert.doesNotMatch(
      leer(archivo),
      /"account_id"/,
      `${archivo} fija account_id: en local cada persona usa su cuenta`,
    );
  }
  const script = leer("scripts/desplegar.sh");
  const proyecto = script.match(/PROYECTO="([0-9a-f]{32})"/)?.[1];
  assert.ok(proyecto, "scripts/desplegar.sh no define la cuenta del proyecto");
  assert.match(
    script,
    /CLOUDFLARE_ACCOUNT_ID:-\}" != "\$PROYECTO"/,
    "scripts/desplegar.sh no exige la cuenta del proyecto",
  );
  for (const paquete of ["package.json", "landing/package.json"]) {
    const deploy = (JSON.parse(leer(paquete)) as { scripts: Record<string, string> }).scripts.deploy;
    assert.match(deploy, /scripts\/desplegar\.sh/, `${paquete}: deploy no pasa por scripts/desplegar.sh`);
  }
  assert.match(leer(".github/workflows/desplegar.yml"), /environment: produccion/);
});
