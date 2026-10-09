# Metodología

¿Es Cierto? es un verificador automático y lo dice siempre. Este documento explica cómo llega a cada veredicto para que cualquiera pueda auditarlo. Se inspira en los principios de la [International Fact-Checking Network (IFCN)](https://ifcncodeofprinciples.poynter.org/).

## Principios

1. **No partidismo.** Se verifican afirmaciones, no personas ni partidos. La misma regla se aplica a todos.
2. **Evidencia obligatoria.** Ningún veredicto sale sin fuentes enlazadas. Si el modelo no entrega fuentes, el código fuerza el veredicto a *No verificable*.
3. **Abstenerse antes que adivinar.** *No verificable* es una respuesta válida y preferible a una conclusión débil.
4. **Transparencia.** Este código, los prompts y cada análisis son públicos.
5. **Correcciones abiertas.** Cualquiera puede reportar un error y la corrección queda registrada.

## Qué se verifica

Solo **afirmaciones de hecho**: cifras, fechas, citas, eventos, datos comprobables. No se verifican opiniones, predicciones ni chistes. En esos casos el bot responde que no encontró un hecho verificable.

## Escala de veredictos

- ✅ **Verdadero**: la evidencia confirma la afirmación.
- ☑️ **Mayormente verdadero**: es correcta en lo esencial, con imprecisiones menores.
- ⚠️ **Engañoso**: contiene datos reales sacados de contexto, desactualizados o presentados para inducir a error.
- ❌ **Falso**: la evidencia la contradice.
- ❔ **No verificable**: no hay evidencia suficiente o es contradictoria.

Cada veredicto incluye una **confianza** (baja, media o alta) según la calidad y concordancia de las fuentes.

## Jerarquía de fuentes

1. Fuentes primarias: datos oficiales, leyes, documentos, estudios revisados por pares.
2. Verificaciones publicadas por organizaciones firmantes de la IFCN.
3. Medios con política editorial pública.

Las redes sociales, los blogs anónimos y los sitios sin autoría no se aceptan como fuente única.

## Proceso

1. Se extrae la afirmación verificable y se reformula de forma neutra.
2. Se busca en la base un análisis previo muy parecido:
   - si tiene menos de 7 días, se reutiliza;
   - si es más antiguo, se investiga de nuevo y el análisis nuevo enlaza al anterior.
3. Se consultan verificaciones profesionales ya publicadas.
4. Se investiga en la web y se escribe un informe de evidencia con la URL de cada dato.
5. Un segundo paso emite el veredicto usando solo las fuentes del informe.

El contenido de la publicación se trata como material a analizar y nunca como instrucciones. Así un post no puede "ordenarle" un veredicto al bot.

## Conversación

Después de un veredicto se le puede responder al bot en el mismo hilo para preguntarle de dónde sale un dato, discutirlo o aportar otra fuente.

- Responde con el análisis publicado y la conversación del hilo como contexto. Si necesita datos nuevos, los busca y cita la fuente.
- **El veredicto solo cambia con evidencia.** La insistencia, los insultos o la presión no lo mueven: el bot lo mantiene y explica en qué se basa.
- Si alguien aporta una fuente sólida que contradice el veredicto, el bot lo reconoce y le pide reportarlo en la página del análisis para revisarlo.
- Responde como máximo 5 veces por hilo, para que nadie lo mantenga discutiendo sin fin.

## Límites conocidos

- El análisis lo hace un modelo de IA y puede equivocarse. Por eso las fuentes van siempre a la vista.
- Por ahora solo se lee texto. Las imágenes, los videos y los posts citados todavía no se analizan.
- Cada cuenta puede pedir un número limitado de verificaciones por hora, para evitar que el bot se use para acosar.

## Correcciones

Si encuentras un error, usa el enlace "Repórtalo" de la página del análisis o abre un issue. Cuando se confirma, se publica un análisis nuevo que enlaza al corregido y se responde en el hilo original.

## Financiamiento

_Por completar: quién financia la operación (API, infraestructura) y con qué condiciones._
