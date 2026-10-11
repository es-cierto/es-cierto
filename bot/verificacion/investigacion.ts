import { buscar } from "./busqueda.ts";
import { investigar, planificarBusquedas, redactarVeredicto } from "./prompts.ts";
import { consultasNuevas, exigirEvidencia, MAX_RONDAS_BUSQUEDA } from "./reglas.ts";
import type { Veredicto } from "./veredicto.ts";

export type Paso = <T>(nombre: string, fn: () => Promise<T>) => Promise<T>;

export async function investigarAfirmacion(
  paso: Paso,
  servicios: { ai: Ai; tavilyApiKey: string },
  afirmacion: string,
  verificaciones: string,
  anterior?: string,
): Promise<{ informe: string; veredicto: Veredicto; consultas: string[] }> {
  const hechas: string[] = [];
  let resultados = "";
  for (let ronda = 1; ronda <= MAX_RONDAS_BUSQUEDA; ronda++) {
    const plan = await paso(`planificar búsquedas ${ronda}`, () =>
      planificarBusquedas(servicios.ai, afirmacion, hechas, resultados),
    );
    const consultas = consultasNuevas(plan, hechas);
    if (consultas.length === 0) {
      break;
    }
    const encontrados = await paso(`buscar en la web ${ronda}`, async () =>
      (await Promise.all(consultas.map((c) => buscar(servicios.tavilyApiKey, c)))).join("\n"),
    );
    hechas.push(...consultas);
    resultados = [resultados, encontrados].filter(Boolean).join("\n");
  }

  const informe = await paso("investigar", () =>
    investigar(servicios.ai, afirmacion, resultados, verificaciones, anterior),
  );
  const redactado = await paso("redactar veredicto", () => redactarVeredicto(servicios.ai, afirmacion, informe));
  const evidencia = [resultados, verificaciones, anterior ?? ""].join("\n");
  return { informe, veredicto: exigirEvidencia(redactado, evidencia), consultas: hechas };
}
