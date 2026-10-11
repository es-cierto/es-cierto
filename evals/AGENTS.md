# Evals

La calidad, la neutralidad y la resistencia a manipulación del bot, medidas con promptfoo (`pnpm eval`). Gastan neuronas de Workers AI y búsquedas de Tavily de la cuenta de quien los corre: no van en cada cambio, sino antes y después de tocar la metodología.

## Cómo funcionan

- `proveedor.ts` corre **el mismo código del Workflow** (`bot/verificacion/` y `bot/conversacion/`), con Workers AI por REST en vez del binding. Necesita `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (con permiso de Workers AI) y `TAVILY_API_KEY` de la cuenta propia.
- Cada paso se reintenta hasta 3 veces con espera creciente, como `CON_REINTENTOS` del Workflow, para que un corte de red no bote un escenario.
- `promptfooconfig.yaml` tiene los escenarios. Los hilos se arman con un ancla de YAML (`*hilo-base`) que queda anidada; el proveedor la aplana.
- `verificar.mjs` revisa la salida de "verificar": `config.veredictos` son los veredictos aceptables, y con `config.noVerificable` también vale que no haya hecho que verificar.
- `conversar.mjs` revisa que toda respuesta en el hilo quepa en un post (300 caracteres, dejando margen) y no use markdown.

Un escenario nuevo va en `promptfooconfig.yaml`. Si mide una regla que no se puede probar sin el modelo, es su mecanismo: la regla se nombra en el escenario.
