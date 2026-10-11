export const PAUSA = 0.35;

const acotar = (v: number) => Math.min(1, Math.max(0, v));
const suave = (t: number) => t * t * (3 - 2 * t);

export function posicion(y: number, marcas: number[], fin: number): number {
  const bordes = [...marcas, fin];
  if (y <= bordes[0]) return 0;
  const ultima = marcas.length - 1;
  for (let i = 0; i < ultima; i++) {
    const [a, b] = [bordes[i], bordes[i + 1]];
    if (y < b) return i + suave(acotar(((y - a) / (b - a || 1) - PAUSA) / (1 - PAUSA)));
  }
  return ultima;
}

export const paradaActual = (w: number) => Math.round(w);

export function tramo(w: number, cantidadClips: number): { clip: number; avance: number } | null {
  const clip = Math.floor(w);
  const avance = w - clip;
  if (avance <= 0 || clip >= cantidadClips) return null;
  return { clip, avance };
}

export function ordenDeCarga(pendientes: number[], w: number): number[] {
  const distancia = (i: number) => {
    if (i === Math.floor(w)) return -1;
    return i > w ? i - w : w - (i + 1) + 0.5;
  };
  return [...pendientes].sort((a, b) => distancia(a) - distancia(b));
}
