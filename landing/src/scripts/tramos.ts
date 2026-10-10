// Cálculos puros del recorrido: dónde está la cámara según el scroll. Sin DOM, con tests al lado.

/** Fracción de cada tramo en que la cámara sigue quieta en la parada, para que su texto se alcance a leer. */
export const PAUSA = 0.35;

const acotar = (v: number) => Math.min(1, Math.max(0, v));
const suave = (t: number) => t * t * (3 - 2 * t);

/**
 * Posición de la cámara en el recorrido: 0 es la primera parada, 1 la segunda, 1.5 a medio camino entre la segunda y
 * la tercera. `marcas` son las posiciones de scroll donde empieza cada parada; `fin`, donde termina el recorrido.
 * Al comienzo de cada tramo la cámara espera (PAUSA) y después avanza con aceleración suave hasta la parada siguiente.
 */
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

/** Qué parada se lee: la más cercana a la posición. */
export const paradaActual = (w: number) => Math.round(w);

/** El clip del tramo actual y el segundo al que hay que llevarlo; null si la cámara está quieta en una parada. */
export function tramo(w: number, cantidadClips: number): { clip: number; avance: number } | null {
  const clip = Math.floor(w);
  const avance = w - clip;
  if (avance <= 0 || clip >= cantidadClips) return null;
  return { clip, avance };
}

/**
 * Orden de carga de los clips: primero el del tramo actual, después el más cercano a la cámara, y a igual distancia el
 * que viene por delante.
 */
export function ordenDeCarga(pendientes: number[], w: number): number[] {
  const distancia = (i: number) => {
    if (i === Math.floor(w)) return -1;
    return i > w ? i - w : w - (i + 1) + 0.5;
  };
  return [...pendientes].sort((a, b) => distancia(a) - distancia(b));
}
