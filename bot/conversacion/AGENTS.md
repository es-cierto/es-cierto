# Conversación

Responder en el hilo después de un veredicto: dudas, fuentes, discusión. Solo depende de `shared/`.

## Invariantes

- **El veredicto solo cambia con evidencia.** La investigación que usa el bot sale únicamente de un link publicado por el propio bot en el hilo (`investigacionDelHilo`); uno que pegue una persona no cuenta.
- **Solo se publica lo que cabe y está investigado.** Toda respuesta pasa por `respuestaPublicable` antes de publicarse: un enlace que no está en la investigación descarta la respuesta, y una respuesta más larga que un post se corta en un fin de oración.
- **El tope de respuestas por hilo no se quita** (`puedeSeguirConversando`).
- La memoria es el hilo, que se relee en cada turno. Este dominio no guarda estado.

## Archivos

- `prompt.ts`: el prompt para conversar. Cambiarlo es cambio de metodología.
- `reglas.ts`: reglas puras de la conversación, con su test al lado.

## Por qué está así

- **Largo:** Bluesky permite 300 grafemas por post; `LARGO_MAXIMO_RESPUESTA` (290) deja margen. El modelo no siempre respeta el largo que pide el prompt, así que `ajustarLargo` corta en el último fin de oración que cabe, para no publicar un enlace partido; si ni la primera oración cabe, la respuesta manda a la investigación.
- **Lo que se publica** en el hilo tiene solo enlaces que están en la investigación y cabe en un post (`respuestaPublicable`).

## Límites y umbrales a calibrar

- El tope de 5 respuestas por hilo es fijo, contra discusiones infinitas que gastan el modelo. Si hay que ajustarlo seguido, se mueve a `vars` de `wrangler.jsonc`.
