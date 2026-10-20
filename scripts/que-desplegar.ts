export type Despliegue = "bot" | "landing" | "todo" | "nada";
const SIN_EFECTO = [/\.test\.ts$/, /(^|\/)(AGENTS|CLAUDE)\.md$/, /^landing\/PROMPTS\.md$/];
const DEPENDENCIAS = [/^pnpm-lock\.yaml$/, /^pnpm-workspace\.yaml$/];

const BOT = [/^bot\//, /^migrations\//, /^wrangler\.jsonc$/, /^package\.json$/];
const LANDING = [/^landing\//, /^METODOLOGIA\.md$/, /^PRIVACIDAD\.md$/];

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
