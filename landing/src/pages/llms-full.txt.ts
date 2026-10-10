import type { APIRoute } from 'astro';
import metodologia from '../../../METODOLOGIA.md?raw';
import { completoParaModelos } from '../data/llms';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Falta site en astro.config.mjs');
  return new Response(completoParaModelos(new URL('/', site).href, metodologia), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
