import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const sharp = createRequire(new URL("../landing/package.json", import.meta.url))("sharp");

const aqui = (archivo) => fileURLToPath(new URL(archivo, import.meta.url));

await sharp(aqui("avatar-fuente.png"))
  .resize(1000, 1000)
  .modulate({ brightness: 1.12 })
  .sharpen({ sigma: 1.2 })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(aqui("avatar.jpg"));

await sharp(aqui("../landing/src/assets/recorrido/3-algo-atado.webp"))
  .extract({ left: 0, top: 170, width: 1920, height: 640 })
  .resize(1500, 500)
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(aqui("portada.jpg"));

console.log("listas: perfiles/avatar.jpg y perfiles/portada.jpg");
