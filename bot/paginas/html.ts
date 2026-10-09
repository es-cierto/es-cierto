// Todo lo que viene de la base pasa por `escapar`; los enlaces que se generan son solo http(s).
export function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function pagina(titulo: string, cuerpo: string): Response {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(titulo)}</title><style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.5}</style></head><body>${cuerpo}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export function conEnlaces(texto: string): string {
  return escapar(texto).replace(/https?:\/\/[^\s<&]+/g, (url) => `<a href="${url}">${url}</a>`);
}
