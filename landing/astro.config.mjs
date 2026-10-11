// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITIO ?? 'https://es.cierto.workers.dev';

export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
  },
});
