import { ETIQUETAS, Veredicto } from "../verificacion/veredicto.ts";
import { escapar, pagina } from "./html.ts";

interface FilaInvestigacion {
  afirmacion: string;
  veredicto: Veredicto["veredicto"];
  confianza: string;
  resumen: string;
  fuentes: string;
  informe: string;
  modelo: string;
  anterior_id: string | null;
  creado_en: number;
}

export async function verInvestigacion(env: Env, id: string): Promise<Response> {
  const fila = await env.DB.prepare("SELECT * FROM investigaciones WHERE id = ?").bind(id).first<FilaInvestigacion>();
  if (!fila) {
    return new Response("No existe esa investigación", { status: 404 });
  }
  const fuentes = Veredicto.shape.fuentes.parse(JSON.parse(fila.fuentes));
  const enlacesSeguros = fuentes.filter((f) => /^https?:\/\//.test(f.url));
  return pagina(
    `${ETIQUETAS[fila.veredicto]}: ${fila.afirmacion}`,
    `<p><a href="/">¿Es Cierto?</a></p>
<h1>${escapar(ETIQUETAS[fila.veredicto])}</h1>
<blockquote>${escapar(fila.afirmacion)}</blockquote>
<p>${escapar(fila.resumen)}</p>
<p>Confianza: ${escapar(fila.confianza)} · ${new Date(fila.creado_en).toLocaleDateString("es-CL")}</p>
<h2>Fuentes</h2>
<ul>${enlacesSeguros.map((f) => `<li><a href="${escapar(f.url)}" rel="nofollow noopener">${escapar(f.titulo)}</a></li>`).join("")}</ul>
<h2>Informe de evidencia</h2>
<p style="white-space:pre-wrap">${escapar(fila.informe)}</p>
${fila.anterior_id ? `<p>Actualiza un <a href="/a/${escapar(fila.anterior_id)}">investigación anterior</a>.</p>` : ""}
<p><small>Investigación automática con IA (${escapar(fila.modelo)}). Lee la <a href="${env.REPO_URL}/blob/main/METODOLOGIA.md">metodología</a> · ¿Encontraste un error? <a href="${env.REPO_URL}/issues/new?title=${encodeURIComponent(`Corrección: ${id}`)}">Repórtalo</a>.</small></p>`,
  );
}
