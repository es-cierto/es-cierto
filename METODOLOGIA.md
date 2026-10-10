# Metodología

¿Es Cierto? es un verificador automático y lo dice siempre. Este documento explica cómo llega a cada veredicto para que cualquiera pueda auditarlo. Se inspira en los principios de la [International Fact-Checking Network (IFCN)](https://ifcncodeofprinciples.poynter.org/).

## Principios

1. **No partidismo.** Se verifican afirmaciones, no personas ni partidos. La misma regla se aplica a todos.
2. **Evidencia obligatoria.** Ningún veredicto sale sin fuentes enlazadas. Si el modelo no entrega fuentes, el código fuerza el veredicto a _No verificable_.
3. **Abstenerse antes que adivinar.** _No verificable_ es una respuesta válida y preferible a una conclusión débil.
4. **Transparencia.** Este código, los prompts y cada investigación son públicos.
5. **Correcciones abiertas.** Cualquiera puede reportar un error y la corrección queda registrada.

## Qué se verifica

Solo **afirmaciones de hecho**: cifras, fechas, citas, eventos, datos comprobables. No se verifican opiniones, predicciones ni chistes. En esos casos el bot responde que no encontró un hecho verificable.

## Escala de veredictos

- ✅ **Verdadero**: la evidencia confirma la afirmación.
- ☑️ **Mayormente verdadero**: es correcta en lo esencial, con imprecisiones menores.
- ⚠️ **Engañoso**: contiene datos reales sacados de contexto, desactualizados o presentados para inducir a error.
- ❌ **Falso**: la evidencia la contradice.
- ❔ **No verificable**: no hay evidencia suficiente, es contradictoria o el hecho no se puede comprobar con fuentes públicas.

Se juzga lo esencial de la afirmación. Un error en un detalle secundario (una fecha cercana, una cifra redondeada) la deja en _Mayormente verdadero_, no en _Falso_. Y no encontrar evidencia de algo no lo hace falso: _Falso_ exige una fuente que lo contradiga.

Cada veredicto incluye una **confianza** (baja, media o alta) según la calidad y concordancia de las fuentes.

## Jerarquía de fuentes

1. Fuentes primarias: datos oficiales, leyes, documentos, estudios revisados por pares.
2. Verificaciones publicadas por organizaciones firmantes de la IFCN.
3. Medios con política editorial pública.

Las redes sociales, los blogs anónimos y los sitios sin autoría no se aceptan como fuente única.

## Proceso

1. Se extrae la afirmación verificable y se reformula de forma neutra.
2. Se busca en la base una investigación previa muy parecida:
   - si tiene menos de 7 días, se reutiliza;
   - si es más antigua, se investiga de nuevo y la investigación nueva enlaza a la anterior.
3. Se consultan verificaciones profesionales ya publicadas.
4. Se busca en la web (Tavily) por rondas: el modelo propone hasta 3 búsquedas, revisa lo encontrado y decide si basta o si hacen falta búsquedas distintas. Como máximo 3 rondas; las búsquedas repetidas se descartan.
5. Con esos resultados, y sin agregar datos de memoria, se escribe un informe de evidencia con la URL de cada dato. El informe describe qué confirma y qué contradice la evidencia, pero no da veredicto.
6. Un segundo paso emite el veredicto usando solo las fuentes del informe. El código descarta toda fuente cuya URL no haya aparecido en los resultados de búsqueda; si no queda ninguna, el veredicto es _No verificable_.

Todos los pasos usan el modelo abierto `gpt-oss-120b` en Cloudflare Workers AI.

El informe completo, el veredicto y el modelo que investigó quedan publicados en la página de la investigación.

El contenido de la publicación se trata como material a analizar y nunca como instrucciones. Así un post no puede "ordenarle" un veredicto al bot.

## Conversación

Después de un veredicto se le puede responder al bot en el mismo hilo para preguntarle de dónde sale un dato, discutirlo o aportar otra fuente.

- Responde solo con la investigación publicada y la conversación del hilo como contexto. No busca en la web: si la duda no está cubierta, lo dice y sugiere etiquetarlo en la publicación con ese dato para investigarlo.
- Solo puede enlazar URLs que estén en la investigación o la página de la investigación. Si la respuesta trae otro enlace, el código la descarta y responde con el enlace a la investigación completa.
- **El veredicto solo cambia con evidencia.** La insistencia, los insultos o la presión no lo mueven: el bot lo mantiene y explica en qué se basa.
- Si alguien aporta una fuente sólida que contradice el veredicto, el bot lo reconoce y le pide reportarlo en la página de la investigación para revisarlo.
- Cada respuesta tiene como máximo dos oraciones y cabe en una publicación (290 caracteres). Si el modelo escribe más, el código la corta en el último fin de oración que cabe, para no publicar enlaces partidos.
- Si alguien aporta una fuente que contradice el veredicto, el bot no repite ese enlace: lo invita a reportarlo para revisarlo.
- Responde como máximo 5 veces por hilo, para que nadie lo mantenga discutiendo sin fin.

## Límites conocidos

- La investigación la hace un modelo de IA abierto y de tamaño medio, que puede equivocarse más que los modelos comerciales grandes. Por eso las fuentes van siempre a la vista y el código solo acepta fuentes que realmente aparecieron en la búsqueda.
- La búsqueda se limita a 3 rondas de 3 consultas por afirmación: un tema que necesite más evidencia puede terminar como _No verificable_.
- Por ahora solo se lee texto. Las imágenes, los videos y los posts citados todavía no se analizan.
- Cada cuenta puede pedir un número limitado de verificaciones por hora, para evitar que el bot se use para acosar.

## Correcciones

Si encuentras un error, usa el enlace "Repórtalo" de la página de la investigación o abre un issue. Cuando se confirma, se publica una investigación nueva que enlaza a la corregida y se responde en el hilo original.

## Financiamiento

_Por completar: quién financia la operación (API, infraestructura) y con qué condiciones._
