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

// Lo que manda quien mantiene el proyecto para corregir una investigación (POST /correcciones). La nota explica qué
// cambió y por qué; va en la página y en la respuesta del hilo.
export const PedidoCorreccion = Veredicto.extend({
  investigacionId: z.uuid(),
  nota: z.string().trim().min(10).max(200),
});
export type PedidoCorreccion = z.infer<typeof PedidoCorreccion>;
