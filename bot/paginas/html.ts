export function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const ESTILOS = `
@font-face{font-family:"Manrope";src:url("https://es.cierto.workers.dev/fuentes/manrope.woff2") format("woff2");font-weight:200 800;font-display:swap}
:root{--fondo:#131209;--tarjeta:#1c1a12;--papel:#f3eadb;--lino:#d6b27c;--suave:color-mix(in oklab,var(--papel) 72%,transparent);--borde:color-mix(in oklab,var(--papel) 12%,transparent);color-scheme:dark}
*{box-sizing:border-box}
html{background:var(--fondo);color:var(--papel);-webkit-font-smoothing:antialiased}
body{margin:0;font-family:"Manrope",ui-sans-serif,system-ui,sans-serif;font-size:1.125rem;line-height:1.65}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:4px;text-decoration-color:color-mix(in oklab,var(--papel) 40%,transparent)}
a:hover{text-decoration-color:var(--lino)}
:focus-visible{outline:2px solid var(--lino);outline-offset:4px}
::selection{background:var(--lino);color:var(--fondo)}
h1,h2,h3,h4,h5,h6{font-weight:600;letter-spacing:-.02em;line-height:1.15;text-wrap:balance;margin:0}
p,li,td,th{text-wrap:pretty}
svg{width:1em;height:1em;flex:none}
.marco{max-width:46rem;margin:0 auto;padding:1.5rem 1.25rem 4rem}
.cabecera{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.5rem .5rem .5rem 1.1rem;border-radius:999px;background:color-mix(in oklab,var(--fondo) 70%,transparent);box-shadow:inset 0 0 0 1px var(--borde);margin-bottom:3.5rem}
.cabecera a{text-decoration:none;font-size:.9rem}
.marca{font-weight:600}
.navegacion{display:flex;align-items:center;gap:1.25rem}
.contexto{margin:-1.5rem 0 3rem;padding:1rem 1.15rem;border-radius:1rem;background:var(--tarjeta);box-shadow:inset 0 0 0 1px var(--borde);font-size:1rem;color:var(--suave)}
.contexto a{color:var(--papel)}
.boton{display:inline-flex;align-items:center;gap:.5rem;border-radius:999px;padding:.55rem 1.1rem;font-weight:600;font-size:1rem;text-decoration:none;transition:background-color .5s,color .5s}
.principal{background:var(--lino);color:var(--fondo)}
.principal:hover{background:var(--papel)}
.secundario{box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--papel) 30%,transparent)}
.secundario:hover{background:var(--papel);color:var(--fondo)}
.antetitulo{font-size:.85rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--lino);margin:0 0 1rem}
.veredicto{display:flex;align-items:center;gap:.6rem;font-size:clamp(2.4rem,7vw,3.6rem);color:var(--lino)}
.confianza{margin:.75rem 0 0;color:var(--suave);font-size:1rem}
.afirmacion{margin:2rem 0 0;font-size:clamp(1.35rem,3.5vw,1.75rem);line-height:1.35;font-weight:500}
.resumen{margin:1.25rem 0 0;font-size:1.25rem;color:color-mix(in oklab,var(--papel) 88%,transparent)}
.seccion{margin-top:3.5rem}
.seccion>h2{font-size:1.6rem;margin-bottom:1.25rem}
.fuentes{list-style:none;margin:0;padding:0;display:grid;gap:.75rem}
.fuente{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.15rem;border-radius:1rem;background:var(--tarjeta);box-shadow:inset 0 0 0 1px var(--borde);text-decoration:none}
.fuente:hover{box-shadow:inset 0 0 0 1px var(--lino)}
.fuente span{display:block}
.fuente .sitio{font-size:.9rem;color:var(--suave);margin-top:.15rem}
.fuente svg{color:var(--lino);font-size:1.2rem}
.resumen-informe{margin:0 0 1.25rem;color:var(--suave)}
.plegable>summary{cursor:pointer;list-style:none}
.plegable>summary::-webkit-details-marker{display:none}
.plegable[open]>summary{margin-bottom:2rem}
.informe{font-size:1.05rem;color:color-mix(in oklab,var(--papel) 90%,transparent)}
.informe>*+*{margin-top:1rem}
.informe h3,.informe h4,.informe h5,.informe h6{font-size:1.2rem;margin-top:2rem;color:var(--papel)}
.informe hr{border:0;border-top:1px solid var(--borde);margin:2rem 0}
.informe ul,.informe ol{padding-left:1.25rem}
.informe li+li{margin-top:.35rem}
.informe strong{color:var(--papel);font-weight:600}
.informe a{word-break:break-word}
.tabla{overflow-x:auto;border-radius:.75rem;box-shadow:inset 0 0 0 1px var(--borde)}
.tabla table{border-collapse:collapse;width:100%;min-width:34rem;font-size:.95rem}
.tabla th,.tabla td{text-align:left;vertical-align:top;padding:.7rem .85rem;border-bottom:1px solid var(--borde)}
.tabla th{color:var(--lino);font-weight:600;background:var(--tarjeta)}
.tabla tr:last-child td{border-bottom:0}
.aviso{display:flex;gap:.75rem;padding:1rem 1.15rem;border-radius:1rem;background:color-mix(in oklab,var(--lino) 14%,var(--fondo));box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--lino) 45%,transparent);margin-bottom:2rem}
.aviso svg{color:var(--lino);font-size:1.3rem;margin-top:.2rem}
.aviso p{margin:0}
.pie{margin-top:4rem;padding-top:2rem;border-top:1px solid var(--borde);color:var(--suave);font-size:.95rem}
.pie .acciones{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.25rem}
@media (max-width:40rem){body{font-size:1.0625rem}.cabecera{margin-bottom:2.5rem}.oculto-movil{display:none}}
`;

export interface Compartir {
  titulo: string;
  descripcion: string;
  url: string;
  imagen: string;
}

interface Opciones {
  descripcion?: string;
  canonica?: string;
  compartir?: Compartir;
}

export function metaParaCompartir(c: Compartir): string {
  const og = (propiedad: string, valor: string) => `<meta property="${propiedad}" content="${escapar(valor)}">`;
  const tw = (nombre: string, valor: string) => `<meta name="${nombre}" content="${escapar(valor)}">`;
  return [
    og("og:type", "article"),
    og("og:site_name", "¿Es Cierto?"),
    og("og:locale", "es_CL"),
    og("og:title", c.titulo),
    og("og:description", c.descripcion),
    og("og:url", c.url),
    og("og:image", c.imagen),
    og("og:image:width", "1200"),
    og("og:image:height", "630"),
    og("og:image:alt", c.titulo),
    tw("twitter:card", "summary_large_image"),
    tw("twitter:title", c.titulo),
    tw("twitter:description", c.descripcion),
    tw("twitter:image", c.imagen),
  ].join("");
}

export function pagina(titulo: string, cuerpo: string, opciones: Opciones = {}): Response {
  const meta = [
    opciones.descripcion && `<meta name="description" content="${escapar(opciones.descripcion)}">`,
    opciones.canonica && `<link rel="canonical" href="${escapar(opciones.canonica)}">`,
    opciones.compartir && metaParaCompartir(opciones.compartir),
  ]
    .filter(Boolean)
    .join("");
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(titulo)}</title>${meta}<link rel="preload" href="https://es.cierto.workers.dev/fuentes/manrope.woff2" as="font" type="font/woff2" crossorigin><style>${ESTILOS}</style></head><body><div class="marco">${cuerpo}</div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export function conEnlaces(texto: string): string {
  return escapar(texto).replace(/https?:\/\/[^\s<&]+/g, (url) => `<a href="${url}">${url}</a>`);
}
