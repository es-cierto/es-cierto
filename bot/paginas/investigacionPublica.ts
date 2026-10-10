import { ETIQUETAS, Veredicto } from "../verificacion/veredicto.ts";
import { escapar, pagina } from "./html.ts";

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

// Escala numérica para ClaimReview (1 = falso, 4 = verdadero). "No verificable" no tiene número: solo su nombre.
const PUNTAJE: Partial<Record<Veredicto["veredicto"], number>> = {
  falso: 1,
  enganoso: 2,
  mayormente_verdadero: 3,
  verdadero: 4,
};

// Marcado ClaimReview (schema.org) para Google Fact Check Explorer: uno por página y con lo mismo que se ve en ella.
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
  // Dentro de <script>, un "</script>" en la afirmación cerraría la etiqueta: se escapa el "<".
  return JSON.stringify(datos).replaceAll("<", "\\u003c");
}

// La versión corregida avisa arriba de todo y enlaza a la nueva; la nueva explica qué cambió.
export function avisosDeCorreccion(fila: FilaInvestigacion): { corregida: string; correccion: string } {
  return {
    corregida: fila.corregida_por
      ? `<p role="alert" style="padding:.75rem;border:2px solid currentColor"><strong>Esta investigación fue corregida.</strong> <a href="/a/${escapar(fila.corregida_por)}">Ver la versión corregida</a>.</p>`
      : "",
    correccion: fila.nota_correccion
      ? `<p style="padding:.75rem;border:1px solid currentColor"><strong>Corrección:</strong> ${escapar(fila.nota_correccion)}${fila.anterior_id ? ` <a href="/a/${escapar(fila.anterior_id)}">Ver la versión anterior</a>.` : ""}</p>`
      : "",
  };
}

export async function verInvestigacion(env: Env, id: string): Promise<Response> {
  const fila = await env.DB.prepare("SELECT * FROM investigaciones WHERE id = ?").bind(id).first<FilaInvestigacion>();
  if (!fila) {
    return new Response("No existe esa investigación", { status: 404 });
  }
  const fuentes = Veredicto.shape.fuentes.parse(JSON.parse(fila.fuentes));
  const enlacesSeguros = fuentes.filter((f) => /^https?:\/\//.test(f.url));
  const nombre = ETIQUETAS[fila.veredicto].replace(/^\S+\s/, ""); // sin el emoji
  const { corregida, correccion } = avisosDeCorreccion(fila);
  return pagina(
    `${ETIQUETAS[fila.veredicto]}: ${fila.afirmacion}`,
    `<script type="application/ld+json">${claimReview(fila, `${env.PUBLIC_URL}/a/${id}`, nombre)}</script>
${corregida}
<p><a href="/">¿Es Cierto?</a></p>
<h1>${escapar(ETIQUETAS[fila.veredicto])}</h1>
${correccion}
<blockquote>${escapar(fila.afirmacion)}</blockquote>
<p>${escapar(fila.resumen)}</p>
<p>Confianza: ${escapar(fila.confianza)} · ${new Date(fila.creado_en).toLocaleDateString("es-CL")}</p>
<h2>Fuentes</h2>
<ul>${enlacesSeguros.map((f) => `<li><a href="${escapar(f.url)}" rel="nofollow noopener">${escapar(f.titulo)}</a></li>`).join("")}</ul>
<h2>Informe de evidencia</h2>
<p style="white-space:pre-wrap">${escapar(fila.informe)}</p>
${fila.anterior_id && !fila.nota_correccion ? `<p>Actualiza una <a href="/a/${escapar(fila.anterior_id)}">investigación anterior</a>.</p>` : ""}
<p><small>Investigación automática con IA (${escapar(fila.modelo)}). Lee la <a href="${env.REPO_URL}/blob/main/METODOLOGIA.md">metodología</a> · ¿Encontraste un error? <a href="${env.REPO_URL}/issues/new?title=${encodeURIComponent(`Corrección: ${id}`)}">Repórtalo</a>.</small></p>`,
  );
}
