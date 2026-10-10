# Landing — guía para agentes

La página pública de ¿Es Cierto? (Astro estático en un Worker de Cloudflare propio). El concepto es **tirar del hilo**: el scroll avanza un video que sigue un hilo de lino crudo desde una publicación hasta su fuente. Las reglas del repo (`../AGENTS.md`) aplican aquí también.

## Invariantes

Si un cambio rompe uno de estos, el cambio está mal aunque compile. Los que tienen mecanismo están en `src/arquitectura.test.ts`.

- **Ningún dato inventado.** Todo texto sale de `METODOLOGIA.md` o de una fuente comprobada a mano. Nada de cifras, testimonios ni logos. El skill `landing-page-design` pide "números orgánicos": aquí no aplica, y se anula.
- **Sin rojo.** En Chile se lee como el color de un sector político. La paleta sale de las imágenes: fondo, papel y lino (`src/styles/global.css`). Tampoco emojis de color: los íconos son Phosphor en `currentColor`.
- **La cuenta del bot no se inventa.** `escierto.bsky.social` es de otra persona. Mientras `cuentaBluesky` sea `null`, la página dice que el bot está en preparación.
- **El texto vive en el HTML.** El video es fondo (`aria-hidden`); sin JS, sin video o con movimiento reducido la página se entiende entera.
- **Movimiento reducido y ahorro de datos:** no se descarga ningún video; quedan las imágenes de cada parada.
- **Las imágenes y el video se declaran como generados con IA**, en el recorrido y en el pie.
- **Redacción clara.** Primero lo literal y después la metáfora del hilo, que aparece una sola vez como imagen (la búsqueda). Una palabra para cada cosa: *mencionar* (no etiquetar), *publicación* (no post), *el bot*, *fuentes*, *veredicto* o *respuesta*. Nada de jerga: si aparece una sigla (IFCN), se explica. Texto de lectura en 18 px, etiquetas en 14 px como mínimo.
- **Peso:** cada clip pesa menos de 4 MB en cada variante y cada imagen de parada menos de 300 KB.

## Archivos

- `src/data/sitio.ts`: todo el texto, los enlaces y las paradas. Un dato nuevo va aquí, no suelto en un componente.
- `src/components/Recorrido.astro`: el recorrido (escenario fijo, imágenes de las paradas, clips y texto de cada parada).
- `src/components/Parada.astro`: una parada; su texto aparece cuando la cámara está quieta en ella.
- `src/scripts/tramos.ts`: el cálculo puro del recorrido (posición de la cámara, tramo, orden de carga), con sus tests.
- `src/scripts/recorrido.ts`: el motor con DOM: carga los clips de a uno (enteros, como blob) y los avanza con el scroll.
- `src/scripts/movimiento.ts`: Lenis, entradas al hacer scroll, el lema palabra por palabra.

## El recorrido

- Hay una parada por imagen clave y un clip por tramo: el clip k va de la parada k a la k+1 (`public/video/clip-{A,B,C}-*`).
- La imagen de cada parada es un **cuadro real del video** (el primero de su clip; la última, el último del clip C), nunca la imagen clave original. Así el clip entra encima sin que se note.
- Cada clip tiene tres variantes: WebM 1080p (escritorio), MP4 1080p (Safari) y MP4 720p con keyframe cada 4 cuadros (celular).
- Cómo se generaron, los prompts y los antipatrones: `PROMPTS.md`. Un clip nuevo sigue esas reglas.

## Verificar

```bash
pnpm test      # cálculo del recorrido y arquitectura
pnpm build
pnpm deploy    # build + wrangler deploy
```

Para probar el scroll de verdad (escritorio, celular, movimiento reducido), usar un navegador headless con perfil propio, nunca el Chrome de la persona.

## Desarrollo

Servidor en segundo plano: `astro dev --background` (`astro dev stop`, `astro dev status`, `astro dev logs`). Documentación: https://docs.astro.build
