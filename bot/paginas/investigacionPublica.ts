import { ETIQUETAS, Veredicto } from "../verificacion/veredicto.ts";
import { escapar, pagina } from "./html.ts";
import { iconos } from "./iconos.ts";
import { informeHtml } from "./informe.ts";

export interface FilaInvestigacion {
  afirmacion: string;
  veredicto: Veredicto["veredicto"];
  confianza: string;
  resumen: string;
  fuentes: string;
  informe: string;
  modelo: string;
  anterior_id: string | null;
  corregida_por: string | null;
  nota_correccion: string | null;
  creado_en: number;
}

const PUNTAJE: Partial<Record<Veredicto["veredicto"], number>> = {
  falso: 1,
  enganoso: 2,
  mayormente_verdadero: 3,
  verdadero: 4,
};

export function claimReview(fila: FilaInvestigacion, url: string, nombre: string): string {
  const puntaje = PUNTAJE[fila.veredicto];
  const datos = {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    url,
    claimReviewed: fila.afirmacion,
    datePublished: new Date(fila.creado_en).toISOString().slice(0, 10),
    author: { "@type": "Organization", name: "¿Es Cierto?", url: new URL("/", url).href },
    reviewRating: {
      "@type": "Rating",
      alternateName: nombre,
      ...(puntaje ? { ratingValue: puntaje, bestRating: 4, worstRating: 1 } : {}),
    },
  };

  return JSON.stringify(datos).replaceAll("<", "\\u003c");
}

export function avisosDeCorreccion(fila: FilaInvestigacion): { corregida: string; correccion: string } {
  return {
    corregida: fila.corregida_por
      ? `<div class="aviso" role="alert">${iconos.alerta}<p><strong>Esta investigación fue corregida.</strong> <a href="/a/${escapar(fila.corregida_por)}">Ver la versión corregida</a>.</p></div>`
      : "",
    correccion: fila.nota_correccion
      ? `<div class="aviso">${iconos.alerta}<p><strong>Corrección:</strong> ${escapar(fila.nota_correccion)}${fila.anterior_id ? ` <a href="/a/${escapar(fila.anterior_id)}">Ver la versión anterior</a>.` : ""}</p></div>`
      : "",
  };
}

const sitioDe = (url: string) => new URL(url).hostname.replace(/^www\./, "");

const FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Santiago",
});

const CONFIANZA: Record<string, string> = { alta: "Confianza alta", media: "Confianza media", baja: "Confianza baja" };

export async function verInvestigacion(env: Env, id: string): Promise<Response> {
  const fila = await env.DB.prepare("SELECT * FROM investigaciones WHERE id = ?").bind(id).first<FilaInvestigacion>();
  if (!fila) {
    return new Response("No existe esa investigación", { status: 404 });
  }
  const fuentes = Veredicto.shape.fuentes.parse(JSON.parse(fila.fuentes)).filter((f) => /^https?:\/\//.test(f.url));
  const nombre = ETIQUETAS[fila.veredicto].replace(/^\S+\s/, "");
  const { corregida, correccion } = avisosDeCorreccion(fila);
  const url = `${env.PUBLIC_URL}/a/${id}`;
  const sitios = new Set(fuentes.map((f) => sitioDe(f.url))).size;
  const reportar = `${env.REPO_URL}/issues/new?template=1-veredicto-equivocado.yml&title=${encodeURIComponent(`Corrección: ${id}`)}`;
  return pagina(
    `${nombre}: ${fila.afirmacion} · ¿Es Cierto?`,
    `<script type="application/ld+json">${claimReview(fila, url, nombre)}</script>
<header class="cabecera"><a class="marca" href="${escapar(env.LANDING_URL)}" aria-label="¿Es Cierto?, ir al inicio">¿Es Cierto?</a><nav class="navegacion" aria-label="Principal"><a class="oculto-movil" href="${escapar(env.LANDING_URL)}/#recorrido">Cómo funciona</a><a class="boton secundario" href="${escapar(env.LANDING_URL)}/verificaciones">Verificaciones</a></nav></header>
<p class="contexto">Esto lo investigó <a href="${escapar(env.LANDING_URL)}">¿Es Cierto?</a>, un bot que verifica datos de redes sociales: alguien lo mencionó en una publicación y buscó de dónde sale el dato. <a href="${escapar(env.LANDING_URL)}/#recorrido">Cómo funciona</a>.</p>
${corregida}
<main>
<p class="antetitulo">Investigación · ${escapar(FECHA.format(fila.creado_en))}</p>
<h1 class="veredicto">${iconos[fila.veredicto]}<span>${escapar(nombre)}</span></h1>
<p class="confianza">${escapar(CONFIANZA[fila.confianza] ?? fila.confianza)} · ${fuentes.length === 1 ? "1 fuente" : `${fuentes.length} fuentes`}${sitios > 1 ? ` de ${sitios} sitios distintos` : ""}</p>
${correccion}
<blockquote class="afirmacion">«${escapar(fila.afirmacion.replace(/[\u00A0\u2007\u202F]/g, " "))}»</blockquote>
<p class="resumen">${escapar(fila.resumen.replace(/[\u00A0\u2007\u202F]/g, " "))}</p>
<section class="seccion" aria-labelledby="fuentes"><h2 id="fuentes">Fuentes</h2>
<ul class="fuentes">${fuentes.map((f) => `<li><a class="fuente" href="${escapar(f.url)}" rel="nofollow noopener"><span><span>${escapar(f.titulo)}</span><span class="sitio">${escapar(sitioDe(f.url))}</span></span>${iconos.enlace}</a></li>`).join("")}</ul>
</section>
<section class="seccion" aria-labelledby="informe"><h2 id="informe">Informe de evidencia</h2>
<p class="resumen-informe">Todo lo que encontró la búsqueda: qué confirma la evidencia, qué la contradice y qué no se pudo comprobar.</p>
<details class="plegable"><summary class="boton secundario">${iconos.informe}Leer el informe completo</summary>
<div class="informe">${informeHtml(fila.informe)}</div>
</details>
</section>
${fila.anterior_id && !fila.nota_correccion ? `<p class="seccion">Esta investigación actualiza una <a href="/a/${escapar(fila.anterior_id)}">anterior</a>.</p>` : ""}
</main>
<footer class="pie">
<p>Investigación automática con inteligencia artificial (${escapar(fila.modelo)}). Puede equivocarse: por eso muestra todas sus fuentes y el informe completo. <a href="${escapar(env.REPO_URL)}/blob/main/METODOLOGIA.md">Cómo verifica</a>.</p>
<div class="acciones"><a class="boton principal" href="${escapar(reportar)}">Reportar un error</a><a class="boton secundario" href="${escapar(env.LANDING_URL)}">Qué es ¿Es Cierto?</a></div>
</footer>`,
    { descripcion: `${nombre}. ${fila.resumen}`, canonica: url },
  );
}
