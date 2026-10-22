# Redes

Las redes sociales donde vive el bot. Solo depende de `shared/`.

## Invariantes

- Todas las redes tienen la misma forma: leer un post, leer el hilo, responder y entregar una imagen de la mención (`imagen`; las que no traen imágenes lanzan error). El Workflow las usa solo a través de `red.ts`; nunca importa una red directamente.
- Lo que responde una red se valida con zod.

## Archivos

- `red.ts`: el contrato que usa el Workflow y la elección de red. Una red nueva es un archivo hermano y un caso más aquí.
- `bluesky.ts`: todo AT Protocol, con `fetch` y zod (sin SDK).
- `whatsapp.ts`: WhatsApp a través de Kapso, con `fetch` y zod. Kapso reenvía al webhook `/whatsapp` (`bot/index.ts`) el mensaje con el formato exacto de Meta, y el bot responde citando el mensaje por el proxy de Kapso, que acepta el mismo cuerpo que la Cloud API.
- `web.ts`: red de prueba (`/probar`), un chat con el hilo en D1. Solo se activa con `PRUEBA_WEB=si` en `.dev.vars`; en producción queda apagada porque cualquiera podría gastar el modelo.

## Por qué está así

- **La sesión de Bluesky se guarda en D1** (tabla `sesion_bluesky`, 90 minutos): `createSession` tiene un límite diario de unas 300 sesiones, y el cron corre cada minuto.
- **El hilo es solo la cadena de padres** (hasta 20 mensajes): las ramas laterales no son parte de la conversación con el bot.
- **La red de prueba** (`web.ts`) tiene el mismo contrato que `bluesky.ts`, con el hilo en D1. Una URI es `web:<hilo>:<n>`: el turno 0 es la publicación y el 1 la pregunta.
- **WhatsApp es un chat privado al que se reenvía un mensaje.** Cada mensaje de texto es una verificación nueva (razón `mention`, sin publicación padre: lo reenviado es la pregunta). No hay conversación todavía: no se puede leer el historial de un chat por la API, así que `leerHilo` devuelve vacío. Las imágenes (con su pie de foto como texto) también entran: `imagenes` lleva `<phone_number_id>:<id del medio>`, porque Kapso pide el número para entregar el medio, y `imagen` lo descarga solo cuando el Workflow lo lee. Audios, videos y otros tipos se ignoran.
- **La URI de WhatsApp lleva todo lo necesario para responder:** `whatsapp:<phone_number_id>:<número>:<wamid>`. Así no hace falta configurar el id del número: sale del webhook. El autor es `whatsapp:<número>`, para el límite por hora.
- **El webhook se autentica con la firma** `x-webhook-signature` (HMAC del cuerpo con `KAPSO_WEBHOOK_SECRET`, en hexadecimal; `firmaValida` acepta también el prefijo `sha256=` de Meta); sin firma válida no se encola nada. Responde 200 rápido: si no, se reintenta, y el id de la instancia derivado de la URI evita verificar dos veces el mismo mensaje.
- **Ventana de 24 horas:** Meta solo deja responder texto libre dentro de las 24 horas desde el último mensaje de la persona.
- **En WhatsApp la respuesta se siente inmediata:** apenas llega el webhook, el mensaje se marca como leído con «escribiendo…» (si eso falla, solo se anota: la verificación sigue), y el Workflow manda un acuse de recibo en su propio `step.do` antes de investigar.
- **Pasar el límite por hora en WhatsApp tiene aviso**, porque en un chat privado el silencio parece una caída. El mensaje rechazado se anota en `menciones` (sin investigación), así el aviso sale solo con el primero que se pasa y no con cada uno.
- **WhatsApp guarda lo mínimo y por poco tiempo.** El número y el mensaje quedan en `menciones` solo 23 horas (`HORAS_WHATSAPP` en `bot/index.ts`; el cron borra lo más viejo): alcanza para el límite por hora y para avisar una corrección dentro de la ventana de 24 horas de Meta, que después ya no deja escribir. Lo que se publica es la afirmación extraída y su investigación, nunca el mensaje ni el número. Si se cambia este plazo, se cambia también `PRIVACIDAD.md`.
- **Por qué Kapso y no la Cloud API directa:** con una app propia de Meta, para que cualquier persona pueda escribirle al bot hay que publicar la app, y Meta no dejó publicarla sin verificar el negocio (el proyecto no es una persona jurídica). Con Kapso, el número se conecta a su app, que ya está publicada: recibe y responde sin publicar nada ni verificar. El costo es un tercero más que ve los mensajes (en `PRIVACIDAD.md`) y el límite del plan gratis (2.000 mensajes al mes, unas 1.000 verificaciones). El número es `+56 9 2212 2033`; nunca se registra en la app de WhatsApp de un celular, porque eso lo desconecta de la API.
