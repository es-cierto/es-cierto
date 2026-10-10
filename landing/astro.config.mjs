// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// URL pública de la landing: canónica, og:image, robots.txt y llms.txt salen de aquí.
// PENDIENTE: pasar a https://escierto.org cuando el dominio apunte a este Worker.
const site = process.env.SITIO ?? 'https://escierto-landing.israelhuentecurar.workers.dev';

export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
  },
});
