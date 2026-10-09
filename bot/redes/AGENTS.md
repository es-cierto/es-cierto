# Redes

Las redes sociales donde vive el bot. Solo depende de `shared/`.

## Invariantes

- Todas las redes tienen la misma forma: leer un post, leer el hilo, responder. El Workflow las usa solo a través de `red.ts`; nunca importa una red directamente.
- Lo que responde una red se valida con zod.

## Archivos

- `red.ts`: el contrato que usa el Workflow y la elección de red. Una red nueva es un archivo hermano y un caso más aquí.
- `bluesky.ts`: todo AT Protocol, con `fetch` y zod (sin SDK).
- `web.ts`: red de prueba (`/probar`), un chat con el hilo en D1. Solo se activa con `PRUEBA_WEB=si` en `.dev.vars`; en producción queda apagada porque cualquiera podría gastar el modelo.
