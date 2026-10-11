# Redes

Las redes sociales donde vive el bot. Solo depende de `shared/`.

## Invariantes

- Todas las redes tienen la misma forma: leer un post, leer el hilo, responder. El Workflow las usa solo a través de `red.ts`; nunca importa una red directamente.
- Lo que responde una red se valida con zod.

## Archivos

- `red.ts`: el contrato que usa el Workflow y la elección de red. Una red nueva es un archivo hermano y un caso más aquí.
- `bluesky.ts`: todo AT Protocol, con `fetch` y zod (sin SDK).
- `web.ts`: red de prueba (`/probar`), un chat con el hilo en D1. Solo se activa con `PRUEBA_WEB=si` en `.dev.vars`; en producción queda apagada porque cualquiera podría gastar el modelo.

## Por qué está así

- **La sesión de Bluesky se guarda en D1** (tabla `sesion_bluesky`, 90 minutos): `createSession` tiene un límite diario de unas 300 sesiones, y el cron corre cada minuto.
- **El hilo es solo la cadena de padres** (hasta 20 mensajes): las ramas laterales no son parte de la conversación con el bot.
- **La red de prueba** (`web.ts`) tiene el mismo contrato que `bluesky.ts`, con el hilo en D1. Una URI es `web:<hilo>:<n>`: el turno 0 es la publicación y el 1 la pregunta.
