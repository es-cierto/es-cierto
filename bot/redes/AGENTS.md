# Redes

Las redes sociales donde vive el bot. Solo depende de `shared/`.

## Invariantes

- Todas las redes tienen la misma forma: leer un post, leer el hilo, responder. El Workflow las usa solo a través de `red.ts`; nunca importa una red directamente.
- Lo que responde una red se valida con zod.

## Archivos

- `red.ts`: el contrato que usa el Workflow y la elección de red. Una red nueva es un archivo hermano y un caso más aquí.
- `bluesky.ts`: todo AT Protocol, con `fetch` y zod (sin SDK).
- `whatsapp.ts`: WhatsApp Cloud API (Meta), con `fetch` y zod. Meta llama al webhook `/whatsapp` (`bot/index.ts`) y el bot responde citando el mensaje.
- `web.ts`: red de prueba (`/probar`), un chat con el hilo en D1. Solo se activa con `PRUEBA_WEB=si` en `.dev.vars`; en producción queda apagada porque cualquiera podría gastar el modelo.

## Por qué está así

- **La sesión de Bluesky se guarda en D1** (tabla `sesion_bluesky`, 90 minutos): `createSession` tiene un límite diario de unas 300 sesiones, y el cron corre cada minuto.
- **El hilo es solo la cadena de padres** (hasta 20 mensajes): las ramas laterales no son parte de la conversación con el bot.
- **La red de prueba** (`web.ts`) tiene el mismo contrato que `bluesky.ts`, con el hilo en D1. Una URI es `web:<hilo>:<n>`: el turno 0 es la publicación y el 1 la pregunta.
- **WhatsApp es un chat privado al que se reenvía un mensaje.** Cada mensaje de texto es una verificación nueva (razón `mention`, sin publicación padre: lo reenviado es la pregunta). No hay conversación todavía: no se puede leer el historial de un chat por la API, así que `leerHilo` devuelve vacío. Audios, imágenes y otros tipos se ignoran.
- **La URI de WhatsApp lleva todo lo necesario para responder:** `whatsapp:<phone_number_id>:<número>:<wamid>`. Así no hace falta configurar el id del número: sale del webhook. El autor es `whatsapp:<número>`, para el límite por hora.
- **El webhook se autentica con la firma** `x-hub-signature-256` (HMAC del cuerpo con `WHATSAPP_APP_SECRET`); sin firma válida no se encola nada. Responde 200 rápido: Meta reintenta si no, y el id de la instancia derivado de la URI evita verificar dos veces el mismo mensaje.
- **Ventana de 24 horas:** Meta solo deja responder texto libre dentro de las 24 horas desde el último mensaje de la persona.
