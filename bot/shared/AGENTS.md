# Compartido

Lo que usan varios dominios. **No depende de ningún dominio**: si algo de aquí necesita importar de `verificacion/`, `conversacion/` o `redes/`, no es compartido.

## Archivos

- `modelo.ts`: los modelos (Workers AI) y `REGLA_DATO`. Es el único archivo que llama a un modelo: `completar` al de texto y `verImagen` al de visión. Los prompts viven en cada dominio.
- `imagen.ts`: una imagen descargada como data URL, para el modelo de visión. Rechaza lo que no sea `image/*` (una página de inicio de sesión, por ejemplo) y lo que pase de 4 MB, con su test al lado.
- `hilo.ts`: un mensaje de un hilo, en cualquier red.
- `enlaces.ts`: extraer URLs de un texto, con su test al lado.

## Por qué está así

- **JSON del modelo:** Workers AI ignora `response_format` con `gpt-oss`; una llamada a función forzada sí devuelve JSON, y eso usa `completar` cuando se le pasa un esquema.
- **AI Gateway:** toda llamada a Workers AI (el modelo de texto y el embedding) pasa por `pasarela`, la pasarela `default`, que Cloudflare crea sola en la primera llamada de cada cuenta; así funciona igual en producción y en la cuenta de cada colaborador sin configurar nada. Deja en el panel cada llamada con sus tokens, su latencia y su error, para entender un veredicto raro o ver cuánto se gastó. La caché queda apagada: los prompts casi nunca se repiten. Lo exige un test de `bot/arquitectura.test.ts`.
- **La memoria de una conversación es el hilo** (`Turno[]`), releído en cada turno desde la red: no hay estado guardado.
