export const BYTES_MAXIMOS_IMAGEN = 4 * 1024 * 1024;

export async function comoDatos(respuesta: Response): Promise<string> {
  const tipo = respuesta.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (!respuesta.ok || !tipo.startsWith("image/")) {
    throw new Error(`no es una imagen: ${respuesta.status} ${tipo}`);
  }
  const bytes = new Uint8Array(await respuesta.arrayBuffer());
  if (bytes.length > BYTES_MAXIMOS_IMAGEN) {
    throw new Error(`imagen de ${bytes.length} bytes, el máximo es ${BYTES_MAXIMOS_IMAGEN}`);
  }
  return `data:${tipo};base64,${Buffer.from(bytes).toString("base64")}`;
}
