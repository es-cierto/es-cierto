import { idDeInstancia } from "../chequeo.ts";
import { agregarTurno, mencionWeb, turnosWeb } from "../redes/web.ts";
import { conEnlaces, escapar, pagina } from "./html.ts";

const FORMULARIO_PRUEBA = `<form method="post" action="/probar"><p><label>Publicación a verificar<br><textarea name="publicacion" rows="4" cols="60" required></textarea></label></p><p><label>Tu pregunta<br><input name="pregunta" size="60" value="¿es cierto?" required></label></p><button>Verificar</button></form>`;

// ponytail: chat de prueba sin Bluesky; se recarga cada 5 s en vez de streaming.
export async function probar(request: Request, env: Env, hilo: string | undefined): Promise<Response> {
  if (request.method === "POST") {
    const datos = await request.formData();
    const campo = (nombre: string) => {
      const valor = datos.get(nombre);
      return typeof valor === "string" ? valor : "";
    };
    const texto = campo(hilo ? "texto" : "pregunta").trim();
    if (!texto) {
      return new Response("Falta el texto", { status: 400 });
    }
    const id = hilo ?? crypto.randomUUID();
    if (!hilo) {
      await agregarTurno(env, id, false, campo("publicacion"));
    }
    const uri = await agregarTurno(env, id, false, texto);
    await env.CHEQUEO.create({ id: await idDeInstancia(uri), params: { mencion: mencionWeb(uri, texto), red: "web" } });
    return Response.redirect(new URL(`/probar/${id}`, request.url).toString(), 303);
  }
  if (!hilo) {
    return pagina("Probar ¿Es Cierto?", `<h1>Probar ¿Es Cierto?</h1>${FORMULARIO_PRUEBA}`);
  }
  const turnos = await turnosWeb(env, hilo);
  if (turnos.length === 0) {
    return new Response("No existe ese hilo", { status: 404 });
  }
  const pendiente = turnos.at(-1)?.deBot
    ? null
    : await env.CHEQUEO.get(await idDeInstancia(`web:${hilo}:${turnos.length - 1}`));
  const estado = pendiente ? await pendiente.status() : null;
  const esperando =
    estado !== null && estado.status !== "errored" && estado.status !== "terminated" && estado.status !== "complete";
  return pagina(
    "Probar ¿Es Cierto?",
    `${esperando ? '<meta http-equiv="refresh" content="5">' : ""}<p><a href="/probar">← Nueva prueba</a></p>
${turnos.map((t, i) => `<p style="white-space:pre-wrap;padding:.5rem;background:${t.deBot ? "#eef" : "#f4f4f4"}"><strong>${i === 0 ? "Publicación" : t.deBot ? "Bot" : "Tú"}:</strong> ${conEnlaces(t.texto)}</p>`).join("\n")}
${estado?.status === "errored" ? `<p style="color:#b00">Falló: ${escapar(String(estado.error?.message ?? "error desconocido"))}</p>` : ""}
${esperando ? "<p><em>El bot está pensando… (investigar puede tardar unos minutos)</em></p>" : `<form method="post"><input name="texto" size="50" placeholder="Respóndele al bot" required> <button>Enviar</button></form>`}`,
  );
}
