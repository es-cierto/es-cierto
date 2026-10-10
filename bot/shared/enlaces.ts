export function enlacesDe(texto: string): string[] {
  return (texto.match(/https?:\/\/[^\s<>"'\]]+/g) ?? []).map((url) => url.replace(/[.,;:!?)]+$/, ""));
}
