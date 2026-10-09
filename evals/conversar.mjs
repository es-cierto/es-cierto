// Toda respuesta en el hilo cabe en un post (300 caracteres, dejando espacio) y no usa markdown.
export default function (output) {
  const largo = [...output].length;
  if (largo > 300) {
    return { pass: false, score: 0, reason: `respuesta de ${largo} caracteres` };
  }
  if (/\*\*|^#|\[[^\]]+\]\(/m.test(output)) {
    return { pass: false, score: 0, reason: "usa markdown" };
  }
  return { pass: true, score: 1, reason: `${largo} caracteres` };
}
