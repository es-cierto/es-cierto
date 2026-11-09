export class SinSaldo extends Error {
  constructor(servicio: "Workers AI" | "Tavily") {
    super(`${servicio} sin saldo`);
  }
}

export const agotoNeuronas = (error: unknown) =>
  error instanceof Error && /\b3036\b|daily free allocation/i.test(error.message);

export const agotoBusquedas = (estado: number) => estado === 432 || estado === 433;

export function hastaElDiaSiguiente(ahora: number): number {
  const d = new Date(ahora);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - ahora;
}
