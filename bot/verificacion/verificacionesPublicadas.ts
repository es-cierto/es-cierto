import { z } from "zod";

const RespuestaFactCheck = z.object({
  claims: z
    .array(
      z.object({
        text: z.string().optional(),
        claimReview: z.array(
          z.object({
            publisher: z.object({ name: z.string().optional() }).optional(),
            url: z.string(),
            textualRating: z.string().optional(),
            reviewDate: z.string().optional(),
          }),
        ),
      }),
    )
    .default([]),
});

// "ninguna" es lo que guarda scripts/secretos.sh cuando no hay clave: un secreto de Cloudflare no puede quedar vacío.
const SIN_CLAVE = "ninguna";

export async function verificacionesPublicadas(apiKey: string, afirmacion: string): Promise<string> {
  if (!apiKey.trim() || apiKey.trim() === SIN_CLAVE) {
    return "";
  }
  const url = new URL("https://factchecktools.googleapis.com/v1alpha1/claims:search");
  url.search = new URLSearchParams({ query: afirmacion, languageCode: "es", pageSize: "5", key: apiKey }).toString();
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`fact check tools ${respuesta.status}: ${await respuesta.text()}`);
  }
  const { claims } = RespuestaFactCheck.parse(await respuesta.json());
  return claims
    .flatMap((c) =>
      c.claimReview.map(
        (r) =>
          `- "${c.text ?? ""}" → ${r.textualRating ?? "?"} (${r.publisher?.name ?? "?"}, ${r.reviewDate ?? "sin fecha"}) ${r.url}`,
      ),
    )
    .join("\n");
}
