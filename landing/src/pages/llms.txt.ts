import type { APIRoute } from 'astro';
import { enlaces, escala, pasos, preguntas, seo } from '../data/sitio';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Falta site en astro.config.mjs');
  const cuerpo = `# ¿Es Cierto?

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
- [Página](${new URL('/', site).href}): esta landing.
`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
