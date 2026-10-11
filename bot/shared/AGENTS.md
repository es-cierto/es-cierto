# Compartido

Lo que usan varios dominios. **No depende de ningún dominio**: si algo de aquí necesita importar de `verificacion/`, `conversacion/` o `redes/`, no es compartido.

## Archivos

- `modelo.ts`: el modelo (Workers AI) y `REGLA_DATO`. Es el único archivo que llama al modelo de texto; los prompts viven en cada dominio.
- `hilo.ts`: un mensaje de un hilo, en cualquier red.
- `enlaces.ts`: extraer URLs de un texto, con su test al lado.

## Por qué está así

- **JSON del modelo:** Workers AI ignora `response_format` con `gpt-oss`; una llamada a función forzada sí devuelve JSON, y eso usa `completar` cuando se le pasa un esquema.
- **La memoria de una conversación es el hilo** (`Turno[]`), releído en cada turno desde la red: no hay estado guardado.
