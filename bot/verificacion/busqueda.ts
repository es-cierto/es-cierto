import { z } from "zod";
import { agotoBusquedas, SinSaldo } from "../shared/saldo.ts";

const RespuestaTavily = z.object({
  results: z.array(z.object({ title: z.string(), url: z.string(), content: z.string() })),
});

export async function buscar(apiKey: string, consulta: string): Promise<string> {
  const respuesta = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ query: consulta, search_depth: "basic", max_results: 5 }),
  });
  if (agotoBusquedas(respuesta.status)) {
    throw new SinSaldo("Tavily");
  }
  if (!respuesta.ok) {
    throw new Error(`tavily ${respuesta.status}: ${await respuesta.text()}`);
  }
  const { results } = RespuestaTavily.parse(await respuesta.json());
  return results.map((r) => `- ${r.title} (${r.url})\n  ${r.content}`).join("\n");
}
