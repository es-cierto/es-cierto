import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Falta site en astro.config.mjs');
  return new Response(
    `User-agent: *\nAllow: /\n\n# Para modelos de lenguaje: resumen y versión completa con la metodología\n# ${new URL('/llms.txt', site).href}\n# ${new URL('/llms-full.txt', site).href}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
};
