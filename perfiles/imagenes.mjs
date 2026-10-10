// Genera las imágenes de los perfiles: avatar.jpg (de avatar-fuente.png, la imagen elegida con el prompt de
// avatar-prompt.md) y portada.jpg (un cuadro real del video de la landing).
// Usa el sharp que ya instala la landing, sin sumar dependencias: `node perfiles/imagenes.mjs`.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const sharp = createRequire(new URL("../landing/package.json", import.meta.url))("sharp");

const aqui = (archivo) => fileURLToPath(new URL(archivo, import.meta.url));

// Avatar: cuadrado de 1000 px (Bluesky y GitHub lo recortan en círculo). Un poco más de brillo y nitidez para que el
// hilo no se apague cuando se ve a 32 px.
await sharp(aqui("avatar-fuente.png"))
  .resize(1000, 1000)
  .modulate({ brightness: 1.12 })
  .sharpen({ sigma: 1.2 })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(aqui("avatar.jpg"));

// Portada de Bluesky: 3:1. La franja central de la ficha sellada, donde está el nudo.
await sharp(aqui("../landing/src/assets/recorrido/3-algo-atado.webp"))
  .extract({ left: 0, top: 170, width: 1920, height: 640 })
  .resize(1500, 500)
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(aqui("portada.jpg"));

console.log("listas: perfiles/avatar.jpg y perfiles/portada.jpg");
