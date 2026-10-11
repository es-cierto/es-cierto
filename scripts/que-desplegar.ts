// Decide qué hay que desplegar según los archivos que cambió un merge: el bot, la landing, los dos o nada.
// Lo usa .github/workflows/desplegar.yml. Un merge que solo toca documentación, tests, perfiles o evals no despliega.
//
// Uso: git diff --name-only HEAD^1 HEAD | node scripts/que-desplegar.ts   → imprime bot | landing | todo | nada

export type Despliegue = "bot" | "landing" | "todo" | "nada";

// Lo que nunca cambia lo que corre en producción, aunque esté dentro de bot/ o landing/.
const SIN_EFECTO = [/\.test\.ts$/, /(^|\/)(AGENTS|CLAUDE)\.md$/, /^landing\/PROMPTS\.md$/];

// Lo que cambia lo que se instala: afecta a los dos.
const DEPENDENCIAS = [/^pnpm-lock\.yaml$/, /^pnpm-workspace\.yaml$/];

const BOT = [/^bot\//, /^migrations\//, /^wrangler\.jsonc$/, /^package\.json$/];
// llms-full.txt incluye METODOLOGIA.md entera: si cambia la metodología, la página también.
const LANDING = [/^landing\//, /^METODOLOGIA\.md$/];

export function queDesplegar(archivos: string[]): Despliegue {
  const conEfecto = archivos.filter((a) => a && !SIN_EFECTO.some((r) => r.test(a)));
  const dependencias = conEfecto.some((a) => DEPENDENCIAS.some((r) => r.test(a)));
  const bot = dependencias || conEfecto.some((a) => BOT.some((r) => r.test(a)));
  const landing = dependencias || conEfecto.some((a) => LANDING.some((r) => r.test(a)));
  return bot && landing ? "todo" : bot ? "bot" : landing ? "landing" : "nada";
}

if (import.meta.main) {
  const entrada = await new Response(process.stdin as unknown as ReadableStream).text();
  console.log(queDesplegar(entrada.split("\n").map((l) => l.trim())));
}
