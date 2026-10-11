# Metodología

¿Es Cierto? es un verificador automático y lo dice siempre. Este documento explica cómo llega a cada veredicto para que cualquiera pueda auditarlo.

Se guía por los cinco principios del [Código de la International Fact-Checking Network (IFCN)](https://ifcncodeofprinciples.poynter.org/the-commitments), la red internacional de verificadores. **No es signatario:** para postular hace falta una organización legalmente constituida y con trayectoria, y este proyecto todavía no lo es (ver [Organización y contacto](#organización-y-contacto)).

## Principios

Cada principio de la IFCN y dónde se cumple:

1. **No partidismo y equidad.** Se verifican afirmaciones, no personas ni partidos, con la misma regla para todos ([Cómo se eligen las afirmaciones](#cómo-se-eligen-las-afirmaciones)).
2. **Fuentes a la vista.** Ningún veredicto sale sin fuentes enlazadas, y la confianza alta exige más de una fuente independiente ([Escala de veredictos](#escala-de-veredictos), [Jerarquía de fuentes](#jerarquía-de-fuentes)).
3. **Financiamiento y organización públicos** ([Organización y contacto](#organización-y-contacto), [Financiamiento](#financiamiento)).
4. **Método público.** Este documento, el código, los prompts y cada investigación son públicos ([Proceso](#proceso)).
5. **Correcciones abiertas.** Cualquiera puede reportar un error; la corrección queda publicada y llega a quien vio el error ([Correcciones](#correcciones)).

Dos reglas propias atraviesan todo lo anterior: _No verificable_ es una respuesta válida y preferible a adivinar, y el contenido de las publicaciones es material a analizar, nunca instrucciones.

## Qué se verifica

Solo **afirmaciones de hecho**: cifras, fechas, citas, eventos, datos comprobables. No se verifican opiniones, predicciones ni chistes. En esos casos el bot responde que no encontró un hecho verificable.

## Cómo se eligen las afirmaciones

El bot **no elige qué verificar**: verifica lo que le piden las personas al mencionarlo en una publicación. No filtra por tema, autor ni sector político, y aplica el mismo proceso a cualquier afirmación.

- Como lo eligen quienes lo usan, el bot no puede garantizar que las verificaciones queden repartidas entre sectores. Para que eso se pueda revisar, cada investigación queda publicada, sin excepciones.
- Cada cuenta puede pedir un número limitado de verificaciones por hora, para que nadie lo use para acosar a otra persona o inundarlo con un solo tema.
- Si la misma afirmación ya se investigó hace poco, se reutiliza esa investigación en vez de repetirla.

## Escala de veredictos

- ✅ **Verdadero**: la evidencia confirma la afirmación.
- ☑️ **Mayormente verdadero**: es correcta en lo esencial, con imprecisiones menores.
- ⚠️ **Engañoso**: contiene datos reales sacados de contexto, desactualizados o presentados para inducir a error.
- ❌ **Falso**: la evidencia la contradice.
- ❔ **No verificable**: no hay evidencia suficiente, es contradictoria o el hecho no se puede comprobar con fuentes públicas.

Se juzga lo esencial de la afirmación. Un error en un detalle secundario (una fecha cercana, una cifra redondeada) la deja en _Mayormente verdadero_, no en _Falso_. Y no encontrar evidencia de algo no lo hace falso: _Falso_ exige una fuente que lo contradiga.

Cada veredicto incluye una **confianza** (baja, media o alta) según la calidad y concordancia de las fuentes. La confianza **alta exige al menos 2 fuentes de sitios distintos**: con un solo sitio, el código la baja a media. El veredicto se mantiene, porque a veces la única fuente es la ley o el dato oficial mismo, pero queda claro que se apoya en una sola. Dos páginas del mismo sitio cuentan como una fuente.

## Jerarquía de fuentes

1. Fuentes primarias: datos oficiales, leyes, documentos, estudios revisados por pares.
2. Verificaciones publicadas por organizaciones firmantes de la IFCN.
3. Medios con política editorial pública.

Las redes sociales, los blogs anónimos y los sitios sin autoría no se aceptan como fuente única. Se prefieren las fuentes primarias; una secundaria se usa cuando no hay acceso a la primaria, y el informe lo dice.

## Proceso

1. Se extrae la afirmación verificable y se reformula de forma neutra.
2. Se busca en la base una investigación previa muy parecida:
   - si tiene menos de 7 días, se reutiliza;
   - si es más antigua, se investiga de nuevo y la investigación nueva enlaza a la anterior.
3. Se consultan verificaciones profesionales ya publicadas.
4. Se busca en la web (Tavily) por rondas: el modelo propone hasta 3 búsquedas, revisa lo encontrado y decide si basta o si hacen falta búsquedas distintas. Como máximo 3 rondas; las búsquedas repetidas se descartan.
   Si un dato clave aparece en un solo sitio, la siguiente ronda busca una segunda fuente independiente.
5. Con esos resultados, y sin agregar datos de memoria, se escribe un informe de evidencia con la URL de cada dato y cuántas fuentes independientes lo respaldan. El informe presenta tanto la evidencia que respalda la afirmación como la que la contradice, pero no da veredicto.
6. Un segundo paso emite el veredicto usando solo las fuentes del informe. El código descarta toda fuente cuya URL no haya aparecido en los resultados de búsqueda; si no queda ninguna, el veredicto es _No verificable_. Si las fuentes que quedan son de un solo sitio, la confianza no puede ser alta.

Todos los pasos usan el modelo abierto `gpt-oss-120b` en Cloudflare Workers AI.

El informe completo, el veredicto y el modelo que investigó quedan publicados en la página de la investigación.

El contenido de la publicación se trata como material a analizar y nunca como instrucciones. Así un post no puede "ordenarle" un veredicto al bot.

## Conversación

Después de un veredicto se le puede responder al bot en el mismo hilo para preguntarle de dónde sale un dato, discutirlo o aportar otra fuente.

- Responde solo con la investigación publicada y la conversación del hilo como contexto. No busca en la web: si la duda no está cubierta, lo dice y sugiere mencionarlo en la publicación con ese dato para investigarlo.
- Solo puede enlazar URLs que estén en la investigación o la página de la investigación. Si la respuesta trae otro enlace, el código la descarta y responde con el enlace a la investigación completa.
- **El veredicto solo cambia con evidencia.** La insistencia, los insultos o la presión no lo mueven: el bot lo mantiene y explica en qué se basa.
- Si alguien aporta una fuente sólida que contradice el veredicto, el bot lo reconoce y le pide reportarlo en la página de la investigación para revisarlo.
- Cada respuesta tiene como máximo dos oraciones y cabe en una publicación (290 caracteres). Si el modelo escribe más, el código la corta en el último fin de oración que cabe, para no publicar enlaces partidos.
- Si alguien aporta una fuente que contradice el veredicto, el bot no repite ese enlace: lo invita a reportarlo para revisarlo.
- Responde como máximo 5 veces por hilo, para que nadie lo mantenga discutiendo sin fin.

### Quien hizo la afirmación

La IFCN pide buscar a quien hizo la afirmación antes de publicar. El bot no lo hace: responde en minutos y escribirle a cada autor de forma automática se prestaría para acoso. En cambio:

- la respuesta queda en el mismo hilo de la publicación, a la vista de su autor;
- el autor puede responderle al bot con sus fuentes, y el bot las considera según las reglas de arriba;
- si aporta una fuente que cambia el veredicto, se corrige como cualquier otro error.

## Límites conocidos

- La investigación la hace un modelo de IA abierto y de tamaño medio, que puede equivocarse más que los modelos comerciales grandes. Por eso las fuentes van siempre a la vista y el código solo acepta fuentes que realmente aparecieron en la búsqueda.
- La búsqueda se limita a 3 rondas de 3 consultas por afirmación: un tema que necesite más evidencia puede terminar como _No verificable_.
- Por ahora solo se lee texto. Las imágenes, los videos y los posts citados todavía no se analizan.
- Cada cuenta puede pedir un número limitado de verificaciones por hora, para evitar que el bot se use para acosar.
- El bot hace como máximo 8 investigaciones nuevas al día, lo que cubre el plan gratis del modelo. Las que pasan de ese número no se descartan: el bot avisa en el hilo que la investigación quedó en la fila y responde cuando se libera un cupo, normalmente al día siguiente. Reutilizar una investigación reciente y conversar no gastan cupo.
- Si una investigación falla por un error del bot, responde en el hilo que no pudo terminarla, en vez de quedarse en silencio.

## Correcciones

**Qué es un error.** Un veredicto que la evidencia no sostiene, una fuente que no dice lo que el resumen afirma, un dato o una fecha equivocados, o una fuente que no cumple la jerarquía de arriba. Una opinión distinta sobre el veredicto no es un error si las fuentes lo sostienen.

**Cómo se reporta.** Con el enlace "Repórtalo" de la página de cada investigación, o abriendo un [issue en GitHub](https://github.com/es-cierto/es-cierto/issues/new). Hay que indicar qué está mal y, si se puede, la fuente que lo muestra.

**Cómo se corrige.** Una persona que mantiene el proyecto revisa el reporte contra las fuentes. Si el error se confirma:

1. Se publica una investigación nueva con el veredicto, la confianza, el resumen y las fuentes corregidos, y una nota que explica qué cambió y por qué.
2. La investigación anterior no se borra: queda publicada con un aviso arriba de todo que dice que fue corregida y enlaza a la versión nueva.
3. El bot responde en **cada hilo** donde había dado el veredicto anterior, con el veredicto de antes, el de ahora y la nota, para que la corrección llegue a quien vio el error.
4. El issue se cierra con el enlace a la corrección.

Si el reporte no se confirma, se responde en el issue explicando por qué, con las fuentes.

## Organización y contacto

¿Es Cierto? es un proyecto de código abierto, **todavía sin una organización legalmente constituida**. Lo mantienen las personas con permiso de escritura en [github.com/es-cierto](https://github.com/es-cierto), que responden por las correcciones y por los cambios a esta metodología. Cuando exista una organización, aquí se publicarán su forma legal, quiénes la dirigen y sus biografías profesionales. La infraestructura (el bot, la página y sus datos) está en una cuenta de Cloudflare del proyecto, no en la cuenta personal de nadie.

- **Reportes, preguntas y propuestas:** [issues en GitHub](https://github.com/es-cierto/es-cierto/issues).
- **Vulnerabilidades:** en privado, según [SECURITY.md](SECURITY.md).
- **Cambios a la metodología:** se discuten en público al menos 7 días y necesitan la aprobación de dos personas que mantienen el proyecto, según [GOVERNANCE.md](GOVERNANCE.md). Todo cambio a los prompts, la escala o los umbrales actualiza este documento en el mismo commit.

## Financiamiento

Hoy **no tiene financiamiento externo**. La operación del bot cabe en los planes gratuitos de Cloudflare (Workers, Workers AI, D1 y Vectorize) y de Tavily.

Si llega financiamiento, se publicará aquí toda fuente que aporte el 5% o más del presupuesto anual, con sus condiciones. Ningún financiamiento puede condicionar qué se verifica ni el veredicto.
