# Landing — guía para agentes

La página pública de ¿Es Cierto?: Astro estático en un Worker de solo assets (`es`), publicado en **https://es.cierto.workers.dev** (subdominio `cierto` de workers.dev). El concepto es **tirar del hilo**: el scroll avanza un video que sigue un hilo de lino crudo desde una publicación hasta su fuente. Las reglas del repo (`../AGENTS.md`) aplican aquí también.

## Invariantes

Si un cambio rompe uno de estos, el cambio está mal aunque compile. Los que tienen mecanismo están en `src/arquitectura.test.ts`.

- **Lo que viene del bot es dato, nunca HTML.** Las afirmaciones salen de redes sociales: se validan con zod y se asignan con `textContent`. Ningún script usa `innerHTML` ni parecidos (test).
- **Ningún dato inventado.** Todo texto sale de `METODOLOGIA.md`, de `PRIVACIDAD.md` o de una fuente comprobada a mano. Nada de cifras, testimonios ni logos. El skill `landing-page-design` pide "números orgánicos": aquí no aplica, y se anula.
- **Sin símbolos de ningún sector.** Ni rojo (en Chile se lee como el color de un sector político) ni estrellas, banderas, escudos u otros símbolos asociados a partidos o al Estado. El único motivo propio es el hilo y su nudo.
- **Sin rojo.** En Chile se lee como el color de un sector político. La paleta sale de las imágenes: fondo, papel y lino (`src/styles/global.css`). Tampoco emojis de color: los íconos son Phosphor en `currentColor`.
- **La cuenta del bot no se inventa.** Es `es-cierto.bsky.social` (`cuentaBluesky`). `escierto.bsky.social`, sin guion, es de otra persona y nunca se enlaza. Si `cuentaBluesky` vuelve a `null`, la página dice "Muy pronto, primero en Bluesky" y no enlaza ninguna cuenta.
- **Para redes sociales y la web, ninguna red es la única.** WhatsApp va primero en cada llamado a la acción (es donde circula la mayoría de las cadenas en Chile) y Bluesky como segunda opción; ninguna se presenta como la única ("para Bluesky", "bot de Bluesky"). El número es `whatsapp` en `sitio.ts`.
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
- `src/components/Verificaciones.astro` y `src/pages/verificaciones.astro`: lo que el bot ha respondido, leído en vivo de `/api/investigaciones` del bot. Las 3 últimas en el inicio y todas, de a 12, en `/verificaciones`. Sin filtros por tema ni sector.
- `src/scripts/verificaciones.ts` (puro, con tests: validación con zod, URLs, fechas) y `src/scripts/listado.ts` (dibuja las tarjetas clonando un `<template>`).
- `src/pages/privacidad.astro`: `PRIVACIDAD.md` de la raíz, tal cual. El texto se cambia allá, no aquí; el estilo del Markdown va en las clases del `<article>`.
- `src/scripts/tendedero.ts`: la escala de veredictos como tendedero (DrawSVG). El hilo se calcula con las posiciones de las tarjetas: horizontal en escritorio, vertical en pantallas angostas. _No verificable_ nunca queda atada.

El hilo sigue después del video como trazo SVG, y siempre dice algo: se ata a lo que tiene fuentes y queda deshilachado donde no las hay. No es decoración: si un trazo no cuenta nada del método, no va. Con movimiento reducido el hilo queda dibujado entero y quieto.

## El recorrido

- Hay una parada por imagen clave y un clip por tramo: el clip k va de la parada k a la k+1 (`public/video/clip-{A,B,C}-*`).
- La imagen de cada parada es un **cuadro real del video** (el primero de su clip; la última, el último del clip C), nunca la imagen clave original. Así el clip entra encima sin que se note.
- Cada clip tiene tres variantes: WebM 1080p (escritorio), MP4 1080p (Safari) y MP4 720p con keyframe cada 4 cuadros (celular).
- Cómo se generaron, los prompts y los antipatrones: `PROMPTS.md`. Un clip nuevo sigue esas reglas.
- **La cámara** (`tramos.ts`): `posicion` es un número donde 0 es la primera parada, 1 la segunda y 1,5 el medio camino entre la segunda y la tercera. Se calcula con las marcas de scroll donde empieza cada parada. Al comienzo de cada tramo la cámara espera quieta una fracción (`PAUSA`), para que el texto de la parada se alcance a leer, y después avanza con aceleración suave. `paradaActual` es la más cercana a la posición; `tramo` dice qué clip mostrar y en qué segundo, o nada si la cámara está quieta.
- **Carga de clips:** primero el del tramo actual, después el más cercano a la cámara y, a igual distancia, el que viene por delante (`ordenDeCarga`). Cada clip se baja entero como blob para que avanzar con el scroll no dependa de la red, y se muestra recién cuando llegó al cuadro pedido; mientras tanto siguen las imágenes. iOS no pinta los cuadros buscados hasta que el video se reprodujo una vez: por eso se hace `play()` y `pause()` al cargarlo. Solo se ve el clip del tramo actual; el cambio entre clips es instantáneo porque comparten el cuadro de la parada.
- **Imágenes entre paradas:** la de la parada de origen se ve entera y la de destino aparece a medida que avanza el tramo.
- **Pantallas verticales:** la escena 16:9 llenando toda la altura deja ver apenas un cuarto del cuadro, y el celular de la primera parada no se reconoce. Por eso la escena ocupa una franja arriba (dos tercios del ancho) y se funde con el fondo. `foco` (en `sitio.ts`) es la posición horizontal del recorte en cada parada, interpolada entre paradas: el hilo tiene que quedar a la vista.
- **Paradas** (`Parada.astro`): el artículo marca cuánto scroll dura la parada; su texto se queda abajo mientras la cámara está quieta y se va al empezar el tramo siguiente. La portada no lleva "Paso 1 de 4" (`sinPaso`): su titular se presenta solo.
- **El timbre:** el veredicto del ejemplo, en la última parada, cae como un timbre cuando la cámara llega a la respuesta.

## Movimiento

- **Scroll:** Lenis sincronizado con ScrollTrigger; con movimiento reducido, el scroll nativo.
- **Entradas** (`[data-revelar]`): con IntersectionObserver, nunca un listener de scroll. Suben y se enfocan; sin JS o con movimiento reducido, todo queda visible.
- **Titulares** (`[data-titular]`): cada línea sube desde abajo de su propia máscara (SplitText). `autoSplit` vuelve a partir las líneas si cambia el ancho o termina de cargar la fuente, y al volver a partir se descarta la entrada anterior. SplitText deja el texto completo en `aria-label` para los lectores de pantalla. La máscara lleva un poco de aire arriba y abajo (`.linea-mask`): sin él, el `overflow` corta los descendentes (g, p, y).
- **Lema:** cada palabra pasa del tono apagado al pleno en orden de lectura, y el hilo de abajo se tensa mientras tanto y se corta con la última palabra: repetirlo no lo ata a nada.
- **"Nada atado":** la imagen del hilo suelto baja apenas mientras se lee, como si colgara.
- **Tendedero** (`tendedero.ts`): el hilo entra desde el borde de la pantalla, pasa por un nudo sobre cada tarjeta atada y se corta antes de _No verificable_, que cae sola y queda torcida (su posición final está en el CSS); la cola cuelga hacia ella y se abre en fibras. El trazo se calcula con las posiciones de layout (`offsetLeft`/`offsetTop`), que no cambian con las transformaciones de la animación. Detalles que costó encontrar:
  - `gsap.matchMedia` con un objeto de condiciones solo ejecuta si alguna se cumple: por eso hay una condición `siempre`.
  - Con `stagger`, `fromTo` solo deja listo el primer elemento: todo el trazo se pone sin dibujar antes de armar la línea de tiempo.
  - En columna (celular), cada tarjeta se cuelga apenas entra en pantalla, para que nunca quede un hueco donde ya debería estar.
  - Con movimiento reducido, el hilo queda dibujado entero y las tarjetas en su lugar.

## Datos

- **`sitio.ts`:** todo el texto sale de `METODOLOGIA.md`. El ejemplo de respuesta se comprobó a mano: la página del Ministerio del Trabajo dice que el ingreso mínimo sube a $529.000 "a partir del 1 de mayo de 2025". El `id` de cada veredicto de la escala es el valor que usa el bot (`bot/verificacion/veredicto.ts`). `enlaces.bot` es el Worker del bot, que sirve la página de cada investigación y `/api/investigaciones`.
- **`astro.config.mjs`:** `site` es la URL pública de la landing; la canónica, `og:image`, `robots.txt` y `llms.txt` salen de ahí. Cuando exista el dominio propio, se cambia ahí.
- **`llms.ts`:** funciones puras, así las páginas las sirven y el test las revisa sin levantar Astro. En `llms-full.txt`, la metodología va sin su título (ya lo da "Metodología completa") y con las secciones un nivel más abajo.
- **Verificaciones** (`verificaciones.ts` y `listado.ts`): la respuesta del bot llega por la red y se valida con `zod/mini` (la misma validación con una fracción del peso). Las fechas van en hora de Chile, donde parte el proyecto, para que todos vean el mismo día. El modelo a veces escribe espacios angostos o duros (U+202F, U+00A0) en fechas y cifras; con la tipografía de la página se ven como palabras pegadas, así que se muestran como espacios comunes (`legible`). Las tarjetas se clonan de un `<template>` con un `[data-campo]` por dato, y el ícono y el nombre de cada veredicto salen de plantillas en el mismo componente. En el inicio van las 3 últimas; la página propia trae su `<h1>` y muestra de a 12.
- **Íconos:** Phosphor, en línea y pintados con `currentColor`.
- **Imágenes para compartir** (`src/pages/og/[veredicto].png.ts`): una por veredicto, generadas al construir la landing con satori y resvg, con Manrope estática (`src/assets/fuentes/`, licencia OFL; satori no acepta fuentes variables ni woff2). Las usa la página de cada investigación del bot como `og:image`. Son por veredicto y no por investigación porque dibujar una imagen en el Worker supera los 10 ms de CPU del plan gratis; con un plan pago se puede generar una por investigación, con la afirmación. Un test exige que la escala de la landing coincida con la del bot, para que no falte la imagen de ningún veredicto. En satori, el ancho y el alto no incluyen el relleno: el contenedor raíz mide 1200×630 menos el relleno.

## Verificar

```bash
pnpm typecheck # tipos (astro sync + tsc)
pnpm test      # cálculo del recorrido y arquitectura
pnpm build
pnpm dev       # http://localhost:4321
```

Después de desplegar, esperar unos 30 segundos antes de probar el sitio publicado: el HTML nuevo puede llegar al borde de Cloudflare antes que su CSS y dar un 404 transitorio.

Para probar el scroll de verdad (escritorio, celular, movimiento reducido), usar un navegador headless con perfil propio, nunca el Chrome de la persona.

## Desarrollo

Servidor en segundo plano: `astro dev --background` (`astro dev stop`, `astro dev status`, `astro dev logs`). Documentación: https://docs.astro.build
