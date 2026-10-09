import type { Turno } from "../shared/hilo.ts";
import * as bluesky from "./bluesky.ts";
import type { Mencion } from "./bluesky.ts";
import * as web from "./web.ts";

// Lo que el Workflow necesita de una red social. Una red nueva es un archivo hermano y un caso más aquí.
export type NombreRed = "bluesky" | "web";

export interface Red {
  textoDePost(uri: string): Promise<string>;
  leerHilo(uri: string): Promise<Turno[]>;
  responder(mencion: Mencion, cuerpo: string, enlace?: string): Promise<void>;
}

export function red(env: Env, nombre: NombreRed): Red {
  if (nombre === "web") {
    return {
      textoDePost: (uri) => web.textoDePost(env, uri),
      leerHilo: (uri) => web.leerHilo(env, uri),
      responder: (mencion, cuerpo, enlace) => web.responder(env, mencion, cuerpo, enlace),
    };
  }
  return {
    textoDePost: async (uri) => bluesky.textoDePost(await bluesky.sesionBluesky(env), uri),
    leerHilo: async (uri) => bluesky.leerHilo(await bluesky.sesionBluesky(env), uri),
    responder: async (mencion, cuerpo, enlace) =>
      bluesky.responder(await bluesky.sesionBluesky(env), mencion, cuerpo, enlace),
  };
}
