# Verificación

De una publicación a un veredicto con evidencia: extraer la afirmación, buscar, escribir el informe, emitir el veredicto. Solo depende de `shared/`.

## Invariantes

- **Evidencia obligatoria.** Todo veredicto pasa por `exigirEvidencia` antes de guardarse. Solo cuentan las fuentes cuya URL apareció en la evidencia reunida; si no queda ninguna, el veredicto es "no verificable". Que el prompt también lo pida no reemplaza esa función.
- **Abstenerse antes que adivinar.** "No encontré evidencia" no es "falso". Los prompts lo piden; los evals lo comprueban.
- **La búsqueda tiene tope.** Rondas y consultas por ronda los fija `consultasNuevas`; el modelo no puede saltárselos.
- Los prompts, la escala de veredictos y los umbrales son metodología: cambiarlos actualiza `METODOLOGIA.md` en el mismo commit.

## Archivos

- `prompts.ts`: los prompts de este dominio (extraer, planificar búsquedas, investigar, redactar el veredicto) y los esquemas de lo que devuelven.
- `veredicto.ts`: la escala de veredictos y cómo se muestra.
- `reglas.ts`: reglas puras, sin I/O (reciclar o investigar de nuevo, exigir evidencia, cuándo dejar de buscar). Toda regla de este dominio que se pueda probar sin red va aquí, con su test al lado.
- `investigacion.ts`: el bucle de investigación. Lo comparten el Workflow y los evals; recibe cómo ejecutar cada paso (`step.do` en producción, la función directa en los evals).
- `busqueda.ts`: búsqueda web (Tavily) y lectura de enlaces.
- `verificacionesPublicadas.ts`: verificaciones profesionales ya publicadas (Google Fact Check Tools). Sin clave, o con la clave "ninguna", devuelve vacío: "ninguna" es lo que sube `scripts/secretos.sh` cuando no hay clave, porque un secreto de Cloudflare no puede quedar vacío.

## Por qué está así

- **Evidencia:** solo cuentan las fuentes cuya URL apareció en la evidencia reunida; el modelo no puede inventar URLs. Dos páginas del mismo sitio (`www.bcn.cl` y `bcn.cl`) cuentan como una fuente.
- **Dos fuentes para confianza alta** (principio 2 de la IFCN): con un solo sitio, el veredicto se mantiene (a veces la única fuente es la ley misma), pero la confianza baja a media.
- **Correcciones:** las decide una persona, así que sus fuentes no salen de la búsqueda; igual tienen que ser `https`, y solo "no verificable" puede ir sin fuentes. `textoDeCorreccion` es lo que el bot responde en cada hilo donde había dado el veredicto anterior. La nota de `PedidoCorreccion` va en la página y en esa respuesta.
- **Enlaces:** si el mensaje trae URLs, `bot/chequeo.ts` lee el título y la descripción de hasta `ENLACES_POR_MENSAJE` páginas (`vistaPrevia`: las etiquetas `og:`, lo mismo que muestra la vista previa en una red) y los suma a la publicación, dentro de `<publicacion>`: sin eso, un mensaje que es solo un enlace no tiene nada que verificar. Ese contenido no cuenta como evidencia (no entra a la búsqueda, así que `exigirEvidencia` no lo acepta como fuente). Se piden directo, sin Tavily: no gastan créditos, y Tavily `/extract` no alcanzó a leer una noticia de BioBío en sus 10 segundos y devuelve el menú del sitio antes que el artículo. Si una página no responde, se sigue sin ella: es mejor intentar con el texto que no responder. Si aparecen sitios que no entregan `og:` (páginas armadas con JavaScript o que bloquean bots), el paso siguiente es Browser Rendering de Cloudflare (`/markdown`).
- **Instagram** (`codigoDeInstagram`, `textoDeInstagram`): a un pedido común Instagram le devuelve una página reducida, sin el texto de la publicación. A uno con las cabeceras de un navegador (`COMO_NAVEGADOR` en `busqueda.ts`) le entrega, sin iniciar sesión, un JSON incrustado donde `xig_polaris_media.if_not_gated_logged_out.caption.text` es el texto de la publicación pedida; la misma página trae una lista de publicaciones recientes del autor con sus textos, y el test exige no confundirlas. Es una estructura interna sin documentar y leerla de forma automatizada va contra las condiciones de Instagram: por eso es solo un complemento (si no la encuentra, devuelve vacío y queda la imagen de `og:image`), sin cuenta y sin la app de Meta de por medio. La salida oficial es el oEmbed de Meta, que exige verificar el negocio. Si Instagram cambia la estructura, el test sigue pasando (usa un trozo fijo) pero el bot deja de leer el texto: revisar a mano con una publicación real.
- **Imágenes:** `bot/chequeo.ts` lee hasta `IMAGENES_POR_MENSAJE`, primero las del mensaje y después las de la vista previa de los enlaces (`og:image`). `transcribirImagen` solo transcribe y describe; lo que sale va a `<publicacion>` como cualquier texto de terceros. Cada imagen es su propio `step.do`, que descarga y transcribe junto, porque lo que devuelve un step tiene un tope de tamaño y una imagen no cabe. Si una imagen no se puede descargar, se sigue sin ella. Si alguna se leyó, la respuesta suma `AVISO_IMAGEN`: el bot verifica lo que la imagen afirma, no si es auténtica. En Bluesky el aviso puede quedar fuera si la respuesta no cabe en 300 caracteres.
- **`consultasNuevas`** devuelve las búsquedas de la ronda siguiente, sin repetir las hechas; vacío si hay que dejar de buscar.

## Límites y umbrales a calibrar

- `IMAGENES_POR_MENSAJE` (2) se fijó a ojo: cada imagen gasta neuronas del modelo de visión.
- `ENLACES_POR_MENSAJE` (3) se fijó a ojo: un mensaje reenviado rara vez trae más, y cada enlace es un pedido más antes de responder.
- `PARECIDO_MINIMO` (0,88) y `FRESCURA_MS` (7 días) se fijaron a ojo: calibrarlos con afirmaciones reales cuando haya base.
- La búsqueda tiene tope de 3 rondas de 3 consultas: 9 búsquedas de Tavily como máximo por investigación: unas 110 investigaciones al mes con el plan gratis. Subirlo si muchas terminan en "no verificable" por falta de evidencia.
