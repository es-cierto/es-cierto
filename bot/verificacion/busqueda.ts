import { z } from "zod";
import { comoDatos } from "../shared/imagen.ts";
import { codigoDeInstagram, textoDeInstagram, vistaPrevia } from "./reglas.ts";

const AGENTE = "Mozilla/5.0 (compatible; EsCiertoBot/1.0; +https://es.cierto.workers.dev)";
const COMO_NAVEGADOR = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};

const RespuestaTavily = z.object({
  results: z.array(z.object({ title: z.string(), url: z.string(), content: z.string() })),
});

export async function buscar(apiKey: string, consulta: string): Promise<string> {
  const respuesta = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ query: consulta, search_depth: "basic", max_results: 5 }),
  });
  if (!respuesta.ok) {
    throw new Error(`tavily ${respuesta.status}: ${await respuesta.text()}`);
  }
  const { results } = RespuestaTavily.parse(await respuesta.json());
  return results.map((r) => `- ${r.title} (${r.url})\n  ${r.content}`).join("\n");
}

export async function leerEnlaces(urls: string[]): Promise<{ texto: string; imagenes: string[] }> {
  const leidos = await Promise.all(
    urls.map(async (url) => {
      try {
        const codigo = codigoDeInstagram(url);
        const respuesta = await fetch(url, {
          headers: codigo ? COMO_NAVEGADOR : { "user-agent": AGENTE },
          signal: AbortSignal.timeout(8000),
        });
        const html = respuesta.ok ? await respuesta.text() : "";
        const { titulo, descripcion, imagen } = vistaPrevia(html);
        const deLaPublicacion = codigo ? textoDeInstagram(html, codigo) : "";
        const lineas = [titulo, descripcion, deLaPublicacion && `Texto de la publicación: ${deLaPublicacion}`].filter(
          Boolean,
        );
        return {
          texto: lineas.length ? `- ${url}\n  ${lineas.join("\n  ")}` : "",
          imagen: imagen && new URL(imagen, url).href,
        };
      } catch (error) {
        console.warn(JSON.stringify({ evento: "no_se_pudo_leer_enlace", url, error: String(error) }));
        return { texto: "", imagen: "" };
      }
    }),
  );
  return {
    texto: leidos
      .map((l) => l.texto)
      .filter(Boolean)
      .join("\n"),
    imagenes: leidos.map((l) => l.imagen).filter(Boolean),
  };
}

export async function descargarImagen(url: string): Promise<string> {
  return comoDatos(await fetch(url, { headers: { "user-agent": AGENTE }, signal: AbortSignal.timeout(8000) }));
}
