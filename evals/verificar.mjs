export default function (output, context) {
  const { veredictos = [], noVerificable = false } = context.config ?? {};
  const r = JSON.parse(output);
  if (!r.verificable) {
    return {
      pass: noVerificable,
      score: noVerificable ? 1 : 0,
      reason: `no encontró hecho verificable (afirmación: "${r.afirmacion}")`,
    };
  }
  if (!veredictos.includes(r.veredicto)) {
    return {
      pass: false,
      score: 0,
      reason: `veredicto ${r.veredicto}, se esperaba ${veredictos.join(" o ")}. Resumen: ${r.resumen}`,
    };
  }
  if (r.veredicto !== "no_verificable" && r.fuentes.length === 0) {
    return { pass: false, score: 0, reason: "veredicto sin fuentes" };
  }
  if ([...r.resumen].length > 280) {
    return { pass: false, score: 0, reason: `resumen de ${[...r.resumen].length} caracteres` };
  }
  return { pass: true, score: 1, reason: `${r.veredicto} (${r.confianza}) con ${r.fuentes.length} fuentes` };
}
