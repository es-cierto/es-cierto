import { escapar } from "./html.ts";

const ESPACIOS_RAROS = /[\u00A0\u2007\u202F]/g;

const ENLINEA =
  /<(https?:\/\/[^\s>]+)>|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>]+)|\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*|<br\s*\/?>/gi;

const sitio = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

function enlace(url: string): string {
  const limpia = url.replace(/[.,;:)\]]+$/, "");
  const sobra = url.slice(limpia.length);
  return `<a href="${escapar(limpia)}" rel="nofollow noopener" title="${escapar(limpia)}">${escapar(sitio(limpia))}</a>${escapar(sobra)}`;
}

export function enLinea(texto: string): string {
  let salida = "";
  let desde = 0;
  for (const m of texto.matchAll(ENLINEA)) {
    salida += escapar(texto.slice(desde, m.index));
    const [todo, autoenlace, etiqueta, destino, suelto, negrita, cursiva] = m;
    if (autoenlace) salida += enlace(autoenlace);
    else if (destino) salida += `<a href="${escapar(destino)}" rel="nofollow noopener">${escapar(etiqueta)}</a>`;
    else if (suelto) salida += enlace(suelto);
    else if (negrita) salida += `<strong>${enLinea(negrita)}</strong>`;
    else if (cursiva) salida += `<em>${enLinea(cursiva)}</em>`;
    else salida += "<br>";
    desde = m.index + todo.length;
  }
  return salida + escapar(texto.slice(desde));
}

const celdas = (fila: string) =>
  fila
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

const esSeparador = (fila: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*-*\s*$/.test(fila.trim());

function tabla(filas: string[]): string {
  const separador = filas.findIndex(esSeparador);
  const encabezado = separador === 1 ? celdas(filas[0]) : null;
  const cuerpo = filas.filter((_, i) => i !== separador && !(encabezado && i === 0));
  const th = encabezado ? `<thead><tr>${encabezado.map((c) => `<th>${enLinea(c)}</th>`).join("")}</tr></thead>` : "";
  const td = cuerpo
    .map(
      (f) =>
        `<tr>${celdas(f)
          .map((c) => `<td>${enLinea(c)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<div class="tabla"><table>${th}<tbody>${td}</tbody></table></div>`;
}

export function informeHtml(markdown: string): string {
  const lineas = markdown.replace(ESPACIOS_RAROS, " ").replace(/\r\n?/g, "\n").split("\n");
  const bloques: string[] = [];
  let parrafo: string[] = [];
  let lista: { tipo: "ul" | "ol"; items: string[] } | null = null;
  let filasTabla: string[] = [];

  const cerrar = () => {
    if (parrafo.length) bloques.push(`<p>${parrafo.map(enLinea).join("<br>")}</p>`);
    if (lista) {
      bloques.push(`<${lista.tipo}>${lista.items.map((i) => `<li>${enLinea(i)}</li>`).join("")}</${lista.tipo}>`);
    }
    if (filasTabla.length) bloques.push(tabla(filasTabla));
    parrafo = [];
    lista = null;
    filasTabla = [];
  };

  for (const cruda of lineas) {
    const linea = cruda.trim();
    if (linea.startsWith("|")) {
      if (!filasTabla.length) cerrar();
      filasTabla.push(linea);
      continue;
    }
    const titulo = linea.match(/^(#{1,6})\s+(.*)$/);
    const item = linea.match(/^(?:[-*•]|(\d+)[.)])\s+(.*)$/);
    if (!linea) cerrar();
    else if (/^(-{3,}|\*{3,}|_{3,})$/.test(linea)) {
      cerrar();
      bloques.push("<hr>");
    } else if (titulo) {
      cerrar();
      const nivel = Math.min(titulo[1].length + 2, 6);
      bloques.push(`<h${nivel}>${enLinea(titulo[2].replace(/^\*\*(.*)\*\*$/, "$1"))}</h${nivel}>`);
    } else if (item) {
      const tipo = item[1] ? "ol" : "ul";
      if (parrafo.length || filasTabla.length || (lista && lista.tipo !== tipo)) cerrar();
      lista ??= { tipo, items: [] };
      lista.items.push(item[2]);
    } else {
      if (lista || filasTabla.length) cerrar();
      parrafo.push(linea);
    }
  }
  cerrar();
  return bloques.join("\n");
}
