import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { z } from "zod";
import { problemaDeCorreccion, textoDeCorreccion, vistaPrevia } from "../bot/verificacion/reglas.ts";
import { ETIQUETAS, PedidoCorreccion, Veredicto } from "../bot/verificacion/veredicto.ts";

type NombreVeredicto = Veredicto["veredicto"];

const VEREDICTOS = Veredicto.shape.veredicto.options;
const CONFIANZAS = Veredicto.shape.confianza.options;
const ESPERA_CORRECCION_MS = 90_000;

const ClaimReview = z.object({
  claimReviewed: z.string(),
  reviewRating: z.object({ alternateName: z.string() }),
});

export interface Pagina {
  afirmacion: string;
  veredicto: NombreVeredicto;
  corregidaPor: string | null;
}

export function enlaceDeInvestigacion(texto: string): { origen: string; id: string } {
  const url = URL.parse(texto.trim());
  const id = url?.pathname.match(/^\/a\/([0-9a-f-]{36})$/)?.[1];
  if (!url || !id) {
    throw new Error(`«${texto}» no es el enlace a una investigación (…/a/<id>)`);
  }
  return { origen: url.origin, id };
}

export function veredictoDeEtiqueta(nombre: string): NombreVeredicto {
  const veredicto = VEREDICTOS.find((v) => ETIQUETAS[v].endsWith(` ${nombre}`));
  if (!veredicto) {
    throw new Error(`veredicto desconocido en la página: «${nombre}»`);
  }
  return veredicto;
}

export function datosDePagina(html: string): Pagina {
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!ld) {
    throw new Error("la página no tiene los datos de la investigación (ClaimReview)");
  }
  const datos = ClaimReview.parse(JSON.parse(ld));
  return {
    afirmacion: datos.claimReviewed,
    veredicto: veredictoDeEtiqueta(datos.reviewRating.alternateName),
    corregidaPor: html.match(/href="\/a\/([0-9a-f-]{36})">Ver la versión corregida/)?.[1] ?? null,
  };
}

function variable(nombre: string): string {
  const linea = readFileSync(".dev.vars", "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${nombre}=`));
  const valor = linea?.slice(nombre.length + 1).trim();
  if (!valor) throw new Error(`Falta ${nombre} en .dev.vars`);
  return valor;
}

async function leerPagina(origen: string, id: string): Promise<Pagina> {
  const respuesta = await fetch(`${origen}/a/${id}`);
  if (!respuesta.ok) {
    throw new Error(`no se pudo abrir ${origen}/a/${id} (${respuesta.status})`);
  }
  return datosDePagina(await respuesta.text());
}

async function tituloDe(url: string): Promise<string | null> {
  const respuesta = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!respuesta?.ok) {
    return null;
  }
  return vistaPrevia(await respuesta.text()).titulo || new URL(url).hostname;
}

type Preguntar = (texto: string, porDefecto?: string) => Promise<string>;

function abrirConsola(): { preguntar: Preguntar; cerrar: () => void } {
  const consola = createInterface({ input: process.stdin });
  const lineas = consola[Symbol.asyncIterator]();
  const preguntar: Preguntar = async (texto, porDefecto = "") => {
    process.stdout.write(porDefecto ? `${texto} [${porDefecto}]: ` : `${texto}: `);
    const { value, done } = await lineas.next();
    if (done && !porDefecto) {
      throw new Error("la entrada se terminó antes de responder todas las preguntas");
    }
    if (!process.stdin.isTTY) {
      process.stdout.write(`${done ? "" : String(value)}\n`);
    }
    return (done ? "" : String(value).trim()) || porDefecto;
  };
  return { preguntar, cerrar: () => consola.close() };
}

async function preguntarPedido(id: string, preguntar: Preguntar): Promise<PedidoCorreccion> {
  const elegir = async <T extends string>(texto: string, opciones: readonly T[]): Promise<T> => {
    for (;;) {
      const respuesta = await preguntar(`${texto} (${opciones.join(", ")})`);
      const opcion = opciones.find((o) => o === respuesta);
      if (opcion) return opcion;
      console.log("  Elige una de las opciones, escrita igual.");
    }
  };

  const veredicto = await elegir("Veredicto nuevo", VEREDICTOS);
  const confianza = await elegir("Confianza", CONFIANZAS);
  const resumen = await preguntar("Resumen (máximo 200 caracteres, sin adjetivos ni opiniones)");

  const fuentes: PedidoCorreccion["fuentes"] = [];
  for (;;) {
    const url = await preguntar(`Fuente ${fuentes.length + 1}: enlace https (vacío para terminar)`, "-");
    if (url === "-") break;
    const titulo = await tituloDe(url);
    if (titulo === null) {
      console.log("  Ese enlace no respondió. Revísalo antes de usarlo como fuente.");
      if ((await preguntar("  ¿Usarlo igual? (s/n)", "n")) !== "s") continue;
    }
    fuentes.push({ url, titulo: await preguntar("  Título", titulo ?? "") });
  }

  const nota = await preguntar("Nota: qué cambió y por qué (10 a 200 caracteres)");
  console.log("");
  return PedidoCorreccion.parse({ investigacionId: id, veredicto, confianza, resumen, fuentes, nota });
}

async function esperarVersionNueva(origen: string, id: string): Promise<string | null> {
  const limite = Date.now() + ESPERA_CORRECCION_MS;
  while (Date.now() < limite) {
    const { corregidaPor } = await leerPagina(origen, id);
    if (corregidaPor) return corregidaPor;
    await new Promise((listo) => setTimeout(listo, 5_000));
  }
  return null;
}

async function principal() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { archivo: { type: "string" }, si: { type: "boolean", default: false } },
  });
  if (positionals.length !== 1) {
    console.log("Uso: pnpm corregir <enlace a la investigación> [--archivo pedido.json] [--si]");
    process.exit(1);
  }
  const { origen, id } = enlaceDeInvestigacion(positionals[0]);
  const pagina = await leerPagina(origen, id);
  if (pagina.corregidaPor) {
    console.log(`Esta investigación ya fue corregida. Corrige la versión nueva: ${origen}/a/${pagina.corregidaPor}`);
    process.exit(1);
  }
  console.log(`Investigación: «${pagina.afirmacion}» · ${ETIQUETAS[pagina.veredicto]}\n`);

  const consola = abrirConsola();
  try {
    await corregir(origen, id, pagina, values, consola.preguntar);
  } finally {
    consola.cerrar();
  }
}

async function corregir(
  origen: string,
  id: string,
  pagina: Pagina,
  opciones: { archivo?: string; si: boolean },
  preguntar: Preguntar,
) {
  const pedido = opciones.archivo
    ? PedidoCorreccion.parse({
        ...z.record(z.string(), z.unknown()).parse(JSON.parse(readFileSync(opciones.archivo, "utf8"))),
        investigacionId: id,
      })
    : await preguntarPedido(id, preguntar);
  const problema = problemaDeCorreccion(pedido);
  if (problema) {
    console.log(`No se puede publicar: ${problema}.`);
    process.exit(1);
  }

  console.log(`Ahora: ${ETIQUETAS[pedido.veredicto]} · confianza ${pedido.confianza}`);
  console.log(`Resumen: ${pedido.resumen}`);
  for (const fuente of pedido.fuentes) console.log(`Fuente: ${fuente.titulo} · ${fuente.url}`);
  console.log(`\nAviso en cada hilo donde respondió (WhatsApp solo si fue en las últimas 23 horas):`);
  console.log(`  ${textoDeCorreccion(pagina.veredicto, pedido.veredicto, pedido.nota).replaceAll("\n", "\n  ")}\n`);
  if (!opciones.si && (await preguntar("¿Publicar la corrección? No se puede deshacer (s/n)", "n")) !== "s") {
    console.log("No se publicó nada.");
    return;
  }

  const respuesta = await fetch(`${origen}/correcciones`, {
    method: "POST",
    headers: { authorization: `Bearer ${variable("CORRECCIONES_TOKEN")}`, "content-type": "application/json" },
    body: JSON.stringify(pedido),
  });
  if (respuesta.status !== 202) {
    console.log(`El bot rechazó la corrección (${respuesta.status}): ${await respuesta.text()}`);
    process.exit(1);
  }
  const nueva = await esperarVersionNueva(origen, id);
  console.log(
    nueva
      ? `Publicada: ${origen}/a/${nueva}`
      : "El bot aceptó la corrección, pero la página todavía no la muestra. Revísala en unos minutos.",
  );
}

if (import.meta.main) {
  await principal();
}
