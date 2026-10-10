# Landing — guía para agentes

La página pública de ¿Es Cierto?: Astro estático en un Worker de solo assets (`es`), publicado en **https://es.cierto.workers.dev** (subdominio `cierto` de workers.dev). El concepto es **tirar del hilo**: el scroll avanza un video que sigue un hilo de lino crudo desde una publicación hasta su fuente. Las reglas del repo (`../AGENTS.md`) aplican aquí también.

## Invariantes

Si un cambio rompe uno de estos, el cambio está mal aunque compile. Los que tienen mecanismo están en `src/arquitectura.test.ts`.

- **Ningún dato inventado.** Todo texto sale de `METODOLOGIA.md` o de una fuente comprobada a mano. Nada de cifras, testimonios ni logos. El skill `landing-page-design` pide "números orgánicos": aquí no aplica, y se anula.
- **Sin rojo.** En Chile se lee como el color de un sector político. La paleta sale de las imágenes: fondo, papel y lino (`src/styles/global.css`). Tampoco emojis de color: los íconos son Phosphor en `currentColor`.
- **La cuenta del bot no se inventa.** `escierto.bsky.social` es de otra persona. Mientras `cuentaBluesky` sea `null`, la página dice "Muy pronto, primero en Bluesky" y no enlaza ninguna cuenta.
- **Para redes sociales y la web, no solo Bluesky.** Bluesky se nombra como la primera red donde funciona, nunca como la única ("para Bluesky", "bot de Bluesky").
- **El texto vive en el HTML.** El video es fondo (`aria-hidden`); sin JS, sin video o con movimiento reducido la página se entiende entera.
- **Movimiento reducido y ahorro de datos:** no se descarga ningún video; quedan las imágenes de cada parada.
- **Las imágenes y el video se declaran como generados con IA**, en el recorrido y en el pie.
- **Pocas palabras.** Quien llega lee en diagonal: cada pantalla es un titular de pocas palabras y, como mucho, una línea de apoyo (unas 12 palabras). Si una sección repite lo que ya contó el recorrido, se saca.
- **Redacción clara.** Primero lo literal y después la metáfora del hilo, que aparece una sola vez como imagen ("Tira del hilo", la búsqueda). Una palabra para cada cosa: _mencionar_ (no etiquetar), _publicación_ (no post), _el bot_, _fuentes_, _veredicto_ o _respuesta_. Nada de jerga: si aparece una sigla (IFCN), se explica. Titulares de las pantallas en `text-5xl`/`lg:text-7xl`; texto de apoyo en 20 px; nada bajo 14 px salvo la nota de IA.
- **Peso:** cada clip pesa menos de 4 MB en cada variante y cada imagen de parada menos de 300 KB.

## Archivos

- `src/data/sitio.ts`: todo el texto, los enlaces y las paradas. Un dato nuevo va aquí, no suelto en un componente.
- `src/data/llms.ts`: `/llms.txt` (resumen, formato llmstxt.org) y `/llms-full.txt` (resumen más `METODOLOGIA.md` entera). Salen de los mismos datos que la página; el test revisa el formato y que no falte ninguna sección de la metodología.
- `src/components/Recorrido.astro`: el recorrido (escenario fijo, imágenes de las paradas, clips y texto de cada parada).
- `src/components/Parada.astro`: una parada; su texto aparece cuando la cámara está quieta en ella.
- `src/scripts/tramos.ts`: el cálculo puro del recorrido (posición de la cámara, tramo, orden de carga), con sus tests.
- `src/scripts/recorrido.ts`: el motor con DOM: carga los clips de a uno (enteros, como blob) y los avanza con el scroll.
- `src/scripts/movimiento.ts`: Lenis, entradas al hacer scroll, titulares con SplitText (cada línea sube tras su máscara) y el lema palabra por palabra, con el hilo que se corta al final.
- `src/scripts/tendedero.ts`: la escala de veredictos como tendedero (DrawSVG). El hilo se calcula con las posiciones de las tarjetas: horizontal en escritorio, vertical en pantallas angostas. _No verificable_ nunca queda atada.

El hilo sigue después del video como trazo SVG, y siempre dice algo: se ata a lo que tiene fuentes y queda deshilachado donde no las hay. No es decoración: si un trazo no cuenta nada del método, no va. Con movimiento reducido el hilo queda dibujado entero y quieto.

## El recorrido

- Hay una parada por imagen clave y un clip por tramo: el clip k va de la parada k a la k+1 (`public/video/clip-{A,B,C}-*`).
- La imagen de cada parada es un **cuadro real del video** (el primero de su clip; la última, el último del clip C), nunca la imagen clave original. Así el clip entra encima sin que se note.
- Cada clip tiene tres variantes: WebM 1080p (escritorio), MP4 1080p (Safari) y MP4 720p con keyframe cada 4 cuadros (celular).
- Cómo se generaron, los prompts y los antipatrones: `PROMPTS.md`. Un clip nuevo sigue esas reglas.

## Verificar

```bash
pnpm typecheck # tipos (astro sync + tsc)
pnpm test      # cálculo del recorrido y arquitectura
pnpm build
pnpm run deploy    # build + wrangler deploy
```

Después de desplegar, esperar unos 30 segundos antes de probar el sitio publicado: el HTML nuevo puede llegar al borde de Cloudflare antes que su CSS y dar un 404 transitorio.

Para probar el scroll de verdad (escritorio, celular, movimiento reducido), usar un navegador headless con perfil propio, nunca el Chrome de la persona.

## Desarrollo

Servidor en segundo plano: `astro dev --background` (`astro dev stop`, `astro dev status`, `astro dev logs`). Documentación: https://docs.astro.build
