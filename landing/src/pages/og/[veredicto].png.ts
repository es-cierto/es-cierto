import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { escala } from '../../data/sitio';

const svgs = import.meta.glob<string>('/node_modules/@phosphor-icons/core/assets/regular/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const fuente = (archivo: string) => readFileSync(join(process.cwd(), 'src/assets/fuentes', archivo));
const FONDO = '#131209';
const PAPEL = '#f3eadb';
const LINO = '#d6b27c';

export const getStaticPaths: GetStaticPaths = () => escala.map((v) => ({ params: { veredicto: v.id }, props: { v } }));

type Nodo = { type: string; props: Record<string, unknown> };
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra: Record<string, unknown> = {},
): Nodo => ({
  type,
  props: { style, children, ...extra },
});

export const GET: APIRoute = async ({ props }) => {
  const v = props.v as (typeof escala)[number];
  const icono = svgs[`/node_modules/@phosphor-icons/core/assets/regular/${v.icono}.svg`].replace('currentColor', LINO);
  const hilo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 72"><path d="M-10 54 C 220 12, 420 72, 640 36 S 1010 6, 1210 30" fill="none" stroke="${LINO}" stroke-width="3" stroke-linecap="round" opacity="0.55"/></svg>`;

  const arbol = el(
    'div',
    {
      width: 1200 - 72 * 2,
      height: 630 - 56 - 48,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: FONDO,
      padding: '56px 72px 48px',
      fontFamily: 'Manrope',
      color: PAPEL,
    },
    [
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
        el('div', { display: 'flex', fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em' }, '¿Es Cierto?'),
        el('div', { display: 'flex', fontSize: 24, color: PAPEL, opacity: 0.65 }, 'Investigación automática con IA'),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el(
          'div',
          { display: 'flex', fontSize: 26, fontWeight: 600, letterSpacing: '0.12em', color: LINO },
          'VEREDICTO',
        ),
        el('div', { display: 'flex', alignItems: 'center', marginTop: 18 }, [
          el('img', { width: 104, height: 104, marginRight: 26 }, undefined, {
            src: `data:image/svg+xml;base64,${Buffer.from(icono).toString('base64')}`,
            width: 104,
            height: 104,
          }),
          el(
            'div',
            {
              display: 'flex',
              fontSize: v.nombre.length > 14 ? 80 : 108,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: LINO,
              lineHeight: 1,
            },
            v.nombre,
          ),
        ]),
        el('div', { display: 'flex', marginTop: 26, fontSize: 38, color: PAPEL, opacity: 0.85 }, v.texto),
      ]),
      el('div', { display: 'flex', width: '100%', height: 64 }, [
        el('img', { width: 1056, height: 64 }, undefined, {
          src: `data:image/svg+xml;base64,${Buffer.from(hilo).toString('base64')}`,
          width: 1056,
          height: 64,
        }),
      ]),
    ],
  );

  const svg = await satori(arbol as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Manrope', data: fuente('Manrope-Regular.ttf'), weight: 400, style: 'normal' },
      { name: 'Manrope', data: fuente('Manrope-SemiBold.ttf'), weight: 600, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
