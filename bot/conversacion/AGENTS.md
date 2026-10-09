# Conversación

Responder en el hilo después de un veredicto: dudas, fuentes, discusión. Solo depende de `shared/`.

## Invariantes

- **El veredicto solo cambia con evidencia.** La investigación que usa el bot sale únicamente de un link publicado por el propio bot en el hilo (`investigacionDelHilo`); uno que pegue una persona no cuenta.
- **Solo se enlaza lo investigado.** Toda respuesta pasa por `respaldarRespuesta` antes de publicarse: un enlace que no está en la investigación descarta la respuesta.
- **El tope de respuestas por hilo no se quita** (`puedeSeguirConversando`).
- La memoria es el hilo, que se relee en cada turno. Este dominio no guarda estado.

## Archivos

- `prompt.ts`: el prompt para conversar. Cambiarlo es cambio de metodología.
- `reglas.ts`: reglas puras de la conversación, con su test al lado.
