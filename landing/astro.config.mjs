// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// URL pública de la landing: canónica, og:image, robots.txt y llms.txt salen de aquí.
// PENDIENTE: cambiar al dominio propio cuando exista (escierto.dev, .org y .cl estaban libres el 10/10/2026).
const site = process.env.SITIO ?? 'https://escierto.israelhuentecurar.workers.dev';

export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
  },
});
