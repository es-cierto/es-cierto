// El texto de /llms.txt y /llms-full.txt (formato de llmstxt.org). Funciones puras: las páginas las sirven y el test
// las revisa sin levantar Astro.
import { enlaces, escala, pasos, preguntas, seo } from './sitio.ts';

export function resumenParaModelos(inicio: string): string {
  return `# ¿Es Cierto?

> ${seo.descripcion}

## Cómo funciona

${pasos.map((p, i) => `${i + 1}. ${p.titulo}: ${p.texto}`).join('\n')}

## Veredictos

${escala.map((e) => `- ${e.nombre}: ${e.texto}`).join('\n')}

## Preguntas frecuentes

${preguntas.map((p) => `### ${p.pregunta}\n\n${p.respuesta}`).join('\n\n')}

## Enlaces

- [Metodología](${enlaces.metodologia}): cómo llega a cada veredicto, la escala y los límites conocidos.
- [Código abierto](${enlaces.repo}): el bot, los prompts y los evals.
- [Página](${inicio}): esta landing.

## Optional

- [Versión completa](${new URL('/llms-full.txt', inicio).href}): este resumen más la metodología entera en un solo archivo.
`;
}

/** El resumen más METODOLOGIA.md completa. */
export function completoParaModelos(inicio: string, metodologia: string): string {
  // Sin su título (ya lo da «Metodología completa») y con las secciones un nivel más abajo.
  const bajada = metodologia
    .trim()
    .replace(/^# .*\n+/, '')
    .replace(/^(#+) /gm, '$1# ');
  return `${resumenParaModelos(inicio)}
## Metodología completa

Copia de [METODOLOGIA.md](${enlaces.metodologia}), la fuente de verdad de cómo verifica el bot.

${bajada}
`;
}
