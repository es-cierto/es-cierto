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
- `busqueda.ts`: búsqueda web (Tavily).
- `verificacionesPublicadas.ts`: verificaciones profesionales ya publicadas (Google Fact Check Tools). Sin clave, devuelve vacío.
