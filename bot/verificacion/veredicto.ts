import { z } from "zod";

export const Veredicto = z.object({
  veredicto: z.enum(["verdadero", "mayormente_verdadero", "enganoso", "falso", "no_verificable"]),
  confianza: z.enum(["baja", "media", "alta"]),
  resumen: z.string().describe("máximo 200 caracteres, español neutro, sin adjetivos ni opiniones"),
  fuentes: z.array(z.object({ titulo: z.string(), url: z.string() })),
});
export type Veredicto = z.infer<typeof Veredicto>;

export const ETIQUETAS: Record<Veredicto["veredicto"], string> = {
  verdadero: "✅ Verdadero",
  mayormente_verdadero: "☑️ Mayormente verdadero",
  enganoso: "⚠️ Engañoso",
  falso: "❌ Falso",
  no_verificable: "❔ No verificable",
};
