# Privacidad

¿Es Cierto? es un bot que verifica afirmaciones. Para hacerlo necesita leer lo que le envías y saber a quién responder. Aquí está qué guarda, para qué y por cuánto tiempo. El código es abierto: cada punto se puede comprobar en el [repositorio](https://github.com/es-cierto/es-cierto).

## Qué se publica

Cada verificación tiene una página pública con la **afirmación** que el bot extrajo, el veredicto, el resumen, las fuentes y el informe de la investigación. Esa página no muestra quién pidió la verificación ni el mensaje original.

El bot verifica afirmaciones, no personas: si escribes un dato personal en tu mensaje (un nombre, un teléfono), evita que forme parte de la afirmación que quieres verificar, porque la afirmación queda publicada.

## Qué se guarda

**Si lo mencionas en Bluesky:** la dirección de tu publicación, tu identificador de Bluesky y el texto de la mención. Tu publicación ya es pública en Bluesky; el bot la guarda para poder volver a ese hilo si corrige un veredicto. Se guarda mientras exista la investigación.

**Si le escribes por WhatsApp:** tu número de teléfono y el texto de tu mensaje. Si envías una imagen, el bot la lee para transcribir su texto y no la guarda. Se borran a las **23 horas**. Ese tiempo sirve para dos cosas: limitar cuántos mensajes por hora puede enviar cada número (para que el bot no se use para acosar) y avisarte si se corrige el veredicto mientras WhatsApp todavía permite escribirte.

El bot no guarda tu nombre, tu foto ni tus contactos, y no guarda la conversación: cada mensaje es una verificación aparte.

## Quién más lo procesa

- **Cloudflare** aloja el bot y ejecuta el modelo de lenguaje. Sus registros técnicos (que pueden incluir el texto del mensaje y, en WhatsApp, el número) se borran solos a los pocos días.
- **Tavily** y **Google Fact Check Tools** reciben las búsquedas sobre la afirmación, nunca tu número ni tu identificador.
- **Kapso** conecta el bot con WhatsApp: los mensajes pasan por su plataforma, que guarda una copia de las conversaciones según [su propia política](https://kapso.com/privacy). Las 23 horas de arriba son lo que guarda el bot; lo que guarda Kapso no depende de nosotros.
- **Meta** (WhatsApp) y **Bluesky** transmiten los mensajes, con sus propias políticas de privacidad.

Nada se vende ni se usa para publicidad.

## Tus derechos

Puedes pedir que se borre lo que el bot guarda sobre ti, o preguntar qué hay, escribiendo a escierto.dev@gmail.com o abriendo un [reporte](https://github.com/es-cierto/es-cierto/issues/new). Si una página pública muestra un dato personal tuyo, también se corrige.
