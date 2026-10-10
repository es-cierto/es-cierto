# Prompts · landing "Tirar del hilo"

> Los originales (imágenes 2K, clips 2560×1440, descartes y hojas de revisión) quedan fuera del repo, en `escierto-landing-produccion/`, por peso. Aquí entran solo las versiones web (`public/video/`) y las imágenes de parada (`src/assets/recorrido/`). Para revisar un clip nuevo: `./revisar-clip.sh clip.mp4 inicio.png fin.png`.

Guía para generar imágenes y clips con criterio fijo. Cada prompt se arma con los bloques de abajo, en este orden: **referencia → estilo → hilo → acción/cámara → evitar**.

## 1. Bloques fijos (se copian tal cual, palabra por palabra)

**Estilo**

> Cinematic macro photograph, shallow depth of field, warm amber tungsten light, deep warm shadows, 35mm film grain, muted palette of walnut wood, cream paper and sepia.

**Hilo** (la "biblia" del objeto: nunca se parafrasea)

> THREAD (identical in every shot): one single thin 2 mm twisted natural undyed linen thread, beige with fine loose fibers catching the light.

**Referencia** (desde la imagen 3, que fijó el grosor correcto)

> Use the reference image for the exact thread, light and color grade.

## 2. Reglas para video (MiniMax H3)

- **Primer y último fotograma siempre**: cada clip va de una imagen clave a la siguiente (`start_image` → `end_image`). Así los clips se unen sin corte.
- **Cámara sobre steady gimbal** ("filmed on a steady gimbal, one continuous shot, no cuts"): el truco de midudev para que el movimiento no se note.
- **Un solo movimiento de cámara por clip**, descrito con dirección y velocidad: "the camera glides slowly forward along the thread", no "dynamic camera".
- **Describir la física**: el hilo se tensa, se desliza, roza el papel. El movimiento sale del hilo, no de la cámara sola.
- **5 segundos**, continuo, sin cambios de escena dentro del clip.
- **Sin audio** (se silencia y además se descarta al codificar con `-an`).
- **16:9**. El celular usa la misma versión recortada con punto de foco: el hilo va siempre cerca del centro del cuadro.

## 3. Antipatrones (lo que se evita y por qué)

| Antipatrón                                              | Por qué es un problema                                                                                                 | Cómo se evita                                                                                                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Describir el hilo distinto en cada prompt               | Cada imagen inventó un grosor: hilo, cuerda, soga                                                                      | Bloque "Hilo" idéntico + imagen de referencia                                                                                                                                            |
| Negaciones sueltas ("no red")                           | A veces el modelo trae justo lo negado                                                                                 | Describir en positivo y dejar una lista breve "Avoid:" al final                                                                                                                          |
| Pedir varios movimientos de cámara                      | El modelo corta o mezcla planos                                                                                        | Uno solo, con dirección y velocidad                                                                                                                                                      |
| Fundidos, cortes, morphing                              | Se nota la unión entre clips                                                                                           | Pedir "one continuous shot" y listarlos en "Avoid:"                                                                                                                                      |
| Texto legible, logos, emblemas                          | Inventa palabras falsas; un verificador no puede mostrar documentos falsos que parezcan reales                         | "no readable text, no logos, no national emblems"                                                                                                                                        |
| Imágenes clave con el hilo en direcciones incompatibles | Para unirlas, el modelo inventa un segundo hilo (pasó en el primer clip A: un hilo colgaba y otro aparecía de la nada) | El hilo entra y sale de cada imagen clave por el mismo lado y en la misma dirección que en la vecina; el clip solo tensa, desliza o sigue                                                |
| Objetos en el camino del hilo                           | El hilo atraviesa lo que encuentra (pasó en A v2: cruzó por dentro de una taza con posavasos)                          | En la imagen clave el camino del hilo queda despejado y los objetos atrás; en el prompt: "the thread is a solid object, always in front, never passes through, behind or under anything" |
| Revisar solo con métricas                               | La detección de cortes no ve un hilo que aparece de la nada                                                            | Revisar siempre a ojo la hoja de contactos, cuadro a cuadro en la zona del hilo                                                                                                          |
| Personas o manos                                        | Un rostro distrae y puede parecer alguien real                                                                         | "no people, no hands"                                                                                                                                                                    |
| Rojo                                                    | En Chile se asocia a un sector político                                                                                | Paleta fija ámbar, crudo y sepia                                                                                                                                                         |
| Zoom brusco, temblor, parpadeo                          | El scroll se siente a saltos                                                                                           | "steady, smooth, no flicker"                                                                                                                                                             |

**Regla física** (va después del bloque Hilo en todo clip):

> There is only this one thread from start to end, and it obeys real physics: it is a solid object that always stays in front of every other object; it never passes through, behind or under anything.

**Lista "Avoid:" para clips** (al final de cada prompt de video):

> Avoid: the thread passing through or intersecting any object, objects moving onto the thread's path, a second thread, a new thread appearing, cuts, fades, crossfades, morphing, flicker, sudden zoom, camera shake, extra threads, thread changing thickness or color, readable text, logos, people, hands, red color.

## 4. Imágenes clave aprobadas

| #   | Escena                                                                 | Job                                                                                                |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | El post: el hilo sale del celular, flojo hacia la derecha              | `9f6240cb-63e1-4f06-b6d0-32dab2fd3f81` (reemplaza a `969bcc15`, donde colgaba)                     |
| 2   | El ruido: el hilo cruza recortes                                       | `4fd5ca4f-d832-439f-806b-d968fa0cfa0c`                                                             |
| 3   | El archivo: el hilo entra al fichero                                   | `f848b8bc-83fc-4e69-b319-b2773618c18d`                                                             |
| 4a  | Hay algo atado: al fondo del pasillo del fichero, nudo en el documento | `18051b5b-fd09-4b3f-a2d5-99bdb53c0bc0` (reemplaza a `e8f117a4`, donde el hilo bajaba desde arriba) |
| 4b  | Nada atado: extremo deshilachado                                       | `6be6d161-64a6-4722-96fc-93e49d392e13`                                                             |

## 5. Clips

| Clip | De → a | Movimiento                                                                          |
| ---- | ------ | ----------------------------------------------------------------------------------- |
| A    | 1 → 2  | El hilo se tensa y la cámara lo sigue bajando del escritorio hasta los recortes     |
| B    | 2 → 3  | La cámara avanza a lo largo del hilo tenso y entra al fichero                       |
| C    | 3 → 4a | La cámara recorre el hilo entre las fichas hasta llegar al nudo                     |
| D    | 3 → 4b | Desde el fichero, el hilo sale de golpe y su extremo queda colgando en la oscuridad |

## 6. Técnica de uniones (cómo se pegan los clips)

- Cada clip **parte del último cuadro real del clip anterior** (extraído con `ffmpeg -sseof -0.05 ... -frames:v 1`, subido con `media_upload`), no de la imagen clave original. El modelo no reproduce exacta la imagen final, así que reusar el cuadro real hace que la unión sea idéntica por construcción.
- Si un clip ya generado tiene que terminar donde empieza otro existente, se le da como `end_image` el **primer cuadro real** del siguiente (así se rehízo A para pegar con B).
- Antes de generar, se revisa que el hilo **entre y salga por el mismo lado** en la imagen de inicio y la de fin. Si no, se rehace la imagen clave (0,25 créditos) en vez de arriesgar el clip (10 créditos).
- Revisión de cada clip: `revisar-clip.sh` (cortes, unión, versiones web) **más** hoja de contactos mirada a ojo en la zona del hilo.
- La unión se acepta si a la vista es la misma imagen. El SSIM castiga el grano del macro: 0,55 puede ser una unión correcta con 1–2 px de desplazamiento (comprobar con el mapa de diferencias).

## 7. Registro de clips

Todos con `minimax_h3`, 5 s, 16:9, 2560×1440, 10 créditos.

### A v1 · descartado

- Job `da544146-96b4-45e3-abae-ee3016639e9d` · inicio `969bcc15` (hilo colgando) → fin `4fd5ca4f` (imagen 2).
- **Descartado:** el hilo colgaba por el borde y la imagen 2 lo tenía en diagonal hacia arriba. El modelo inventó un segundo hilo que cruzaba el celular. Las métricas no lo detectaron; se vio a ojo.

### A v2 · descartado (el hilo atraviesa la taza)

- Job `5740d83e-d1e2-45dd-bd89-4b843ba3d4e0` · inicio `9f6240cb` (hilo flojo hacia la derecha) → fin `efc8617f` (primer cuadro real de B).
- Un solo hilo y buena unión con B, pero **descartado**: en la segunda mitad el hilo pasa por dentro de la base de una taza con posavasos que estaba en su camino.

### A v3 · aprobado

- Job `c4efc31b-d08f-4659-b39c-62f3b499d755` · inicio `4518c103` (hilo por el borde delantero, objetos atrás) → fin `efc8617f` (primer cuadro real de B).
- Prompt: el de A v2 más la regla física y la lista Avoid ampliada (ver sección 3).
- Aprobado: un solo hilo, que pasa por delante del posavasos rozando su borde, sin atravesarlo. Unión con B: 0,93.
- Prompt:

> One continuous macro shot, filmed on a steady gimbal, no cuts. [Estilo] [Hilo] There is only this one thread from start to end. The slack thread lying on the desk, coming out of the glowing smartphone screen, is slowly pulled taut from the right: its curves straighten and it lifts slightly off the wood, becoming one straight line. The camera glides slowly and steadily to the right along this same taut thread, leaving the phone behind and travelling low over the walnut desk until the thread crosses a chaotic pile of crumpled printouts, torn newspaper clippings and printed screenshots. Smooth, constant speed; the thread stays near the center of the frame and in sharp focus the whole time. Avoid: a second thread, a new thread appearing, thread hanging off the desk, cuts, fades, crossfades, morphing, flicker, sudden zoom, camera shake, thread changing thickness or color, readable text, logos, people, hands, red color.

### B · aprobado (fue la prueba)

- Job `0e4ca5b0-54b2-4dff-9d1f-d35f52d6f8a5` · inicio `4fd5ca4f` (imagen 2) → fin `f848b8bc` (imagen 3).
- Sin cortes; del escritorio al fichero en una toma. Su último cuadro (`279e8465`) es el inicio de C.
- Prompt:

> One continuous macro shot. [Estilo] [Hilo] The thread slowly tightens as if pulled from far away and slides across the crumpled printouts. The camera glides slowly and steadily forward along the taut thread, following it off the edge of the cluttered desk, through soft darkness, and into an old wooden archive card-catalog drawer, where the thread runs between rows of aged index cards. Smooth, steady, constant speed, the thread stays near the center of the frame and in sharp focus the whole time. Avoid: cuts, fades, crossfades, morphing, flicker, sudden zoom, camera shake, extra threads, thread changing thickness or color, readable text, logos, people, hands, red color.

### C · aprobado

- Job `1218f67e-fefe-423c-8c45-99a52d6adc87` · inicio `279e8465` (último cuadro real de B) → fin `18051b5b` (fondo del pasillo, nudo en el documento).
- Aprobado al primer intento: un solo hilo, cámara recta por el pasillo, llega al nudo. Confirma que rehacer la imagen clave antes de generar ahorra reintentos.
- Prompt:

> One continuous macro shot, filmed on a steady gimbal, no cuts. [Estilo] [Hilo] There is only this one thread from start to end. We are inside an old wooden archive card-catalog drawer, looking down the narrow aisle between two rows of aged index cards. The thread enters from the bottom left foreground and runs forward along the aisle. The camera moves slowly and steadily straight forward along the aisle, following the thread, without turning. As the camera approaches the far end of the aisle it gently slows down and comes to rest on the small tight knot where the thread is tied through the top corner of an official cream document standing upright at the end of the drawer, with an embossed seal and a dark ink stamp. Calm, solid, final. Smooth constant speed, then a soft ease-out. Avoid: a second thread, a new thread appearing, the thread changing direction, camera turning or rotating, cuts, fades, crossfades, morphing, flicker, sudden zoom, camera shake, thread changing thickness or color, readable text, logos, people, hands, red color.

## 8. Créditos

| Ítem                                             | Créditos        |
| ------------------------------------------------ | --------------- |
| 5 imágenes clave iniciales                       | 1,25            |
| Rehacer 4a y 4b con referencia (grosor del hilo) | 0,5             |
| Clip B (prueba, aprobado)                        | 10              |
| Clip A v1 (descartado)                           | 10              |
| Rehacer imagen 1                                 | 0,25            |
| Clip A v2 (aprobado)                             | 10              |
| Rehacer imagen 4a (dirección del hilo)           | 0,25            |
| Clip C                                           | 10              |
| Rehacer imagen 1 (camino despejado)              | 0,25            |
| Clip A v3                                        | 10              |
| **Total**                                        | **52,5** de 110 |
