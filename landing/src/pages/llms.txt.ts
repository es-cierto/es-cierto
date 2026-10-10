import type { APIRoute } from 'astro';
import { resumenParaModelos } from '../data/llms';

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Falta site en astro.config.mjs');
  return new Response(resumenParaModelos(new URL('/', site).href), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
