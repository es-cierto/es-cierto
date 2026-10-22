# ¿Es Cierto?

Verificador de datos para redes sociales y la web. Lo mencionas en una publicación, busca de dónde sale el dato y te responde ahí mismo con un veredicto y sus fuentes, o te avisa si no encontró ninguna. Abierto y no partidista.

Parte en Bluesky, que tiene una API abierta y gratuita. La idea es sumar otras redes sociales y cualquier página web: cada red es un módulo en `bot/redes/`.

**Página:** https://es.cierto.workers.dev

```
@es-cierto.bsky.social ¿es cierto?
```

```
☑️ Mayormente verdadero · confianza alta
El monto es correcto, pero rige desde el 1 de mayo de 2025, no desde julio.
→ <página de la investigación>
```

Cada investigación queda publicada con su informe y sus fuentes. Si alguien vuelve a preguntar lo mismo, se reutiliza la investigación reciente o se complementa con evidencia nueva si ya es antigua.

> **Estado:** el bot está en línea en Bluesky como [@es-cierto.bsky.social](https://bsky.app/profile/es-cierto.bsky.social). Respóndele a una publicación mencionándolo y te contesta con el veredicto y sus fuentes. Mientras no haya dominio propio, sus páginas viven en `https://escierto.cierto.workers.dev`.

## Cómo funciona

1. Cada minuto revisa sus menciones y las respuestas que recibe en Bluesky.
2. Por cada mención inicia un flujo durable (Cloudflare Workflow):
   - lee la publicación y extrae la afirmación que se puede comprobar;
   - busca en la base si ya investigó algo muy parecido (Vectorize): si es reciente, lo reutiliza; si es antiguo, lo complementa;
   - consulta verificaciones profesionales ya publicadas (Google Fact Check Tools);
   - busca en la web por rondas (Tavily) y escribe un informe solo con lo que encontró;
   - emite el veredicto **con fuentes obligatorias**: el código descarta toda fuente que no apareció en la búsqueda;
   - guarda la investigación (D1) y responde en el hilo.

Todo el razonamiento usa el modelo abierto `gpt-oss-120b` en Cloudflare Workers AI, dentro del plan gratis.

Si le respondes en el hilo, **conversa**: explica de dónde sale cada dato usando solo la investigación publicada. El veredicto solo cambia con evidencia, nunca por insistencia, y responde como máximo 5 veces por hilo.

La metodología completa, con la escala de veredictos y los límites conocidos, está en [METODOLOGIA.md](METODOLOGIA.md).

## Estructura del repo

| Carpeta       | Qué es                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `bot/`        | El bot (un Worker), con una carpeta por dominio: `verificacion/`, `conversacion/`, `redes/`, `paginas/` y `shared/`.  |
| `landing/`    | La página pública: Astro estático en su propio Worker, con un video controlado por el scroll.                         |
| `evals/`      | Escenarios de calidad del modelo con promptfoo.                                                                       |
| `migrations/` | El esquema de D1, con las migraciones de wrangler.                                                                    |
| `perfiles/`   | Los perfiles del bot en Bluesky y de la organización en GitHub: textos, avatar y portada. `pnpm perfiles` los aplica. |

Es un monorepo: un solo `pnpm install` en la raíz instala el bot y la landing (workspace de pnpm, un solo lockfile), y `pnpm check` revisa los dos.

Cada carpeta tiene su `AGENTS.md` con sus reglas. El repo sigue [context architecture](https://context-architecture.dev/): cada regla que el repo afirma sobre sí mismo está atada a un test que falla si deja de cumplirse.

## Correrlo localmente

Requisitos: Node 24+, pnpm, y para que el bot investigue, una cuenta gratis de Cloudflare y una clave gratis de Tavily (las tuyas; nunca hacen falta las del proyecto).

```bash
pnpm install
pnpm check                 # formato, lint, tipos y tests: sin claves ni red
pnpm entorno               # te pide lo que falte (sesión de Cloudflare, clave de Tavily) y arranca pnpm dev
                           # el chat de prueba, sin Bluesky, queda en http://localhost:8787/probar
pnpm eval                  # calidad del modelo; gasta neuronas y búsquedas de tu plan
```

El paso a paso está en [CONTRIBUTING.md](CONTRIBUTING.md#probar-el-bot-de-punta-a-punta).

## La página pública

`landing/` se publica en **https://es.cierto.workers.dev** (Worker `es` en el subdominio `cierto` de workers.dev). Al hacer scroll, un video sigue un hilo de lino desde una publicación hasta su fuente. Las imágenes y los clips se generaron con IA (Higgsfield, GPT Image y MiniMax H3); los prompts, las técnicas y los antipatrones están en [landing/PROMPTS.md](landing/PROMPTS.md).

```bash
cd landing     # la instalación de la raíz ya incluye la landing (workspace de pnpm)
pnpm typecheck # tipos (astro sync + tsc)
pnpm test      # cálculo del recorrido y reglas de la página
pnpm dev       # http://localhost:4321
```

Después de desplegar, espera unos 30 segundos antes de probar: el HTML nuevo puede llegar a Cloudflare antes que sus estilos.

## Desplegar

Al mergear a `main`, cuando el CI termina en verde, `.github/workflows/desplegar.yml` despliega en la cuenta de Cloudflare del proyecto **solo lo que el merge cambió** (`scripts/que-desplegar.ts`): el bot con sus migraciones, la página, los dos o nada. Un merge de solo documentación o tests no despliega; `METODOLOGIA.md` sí cuenta como parte de la página, porque `llms-full.txt` la incluye. Usa el entorno `produccion` de GitHub, con el secreto `CLOUDFLARE_API_TOKEN` y la variable `CLOUDFLARE_ACCOUNT_ID`.

Los secretos del bot viven en Cloudflare, cifrados, y nunca en el repo. Se suben desde `.dev.vars` con `./scripts/secretos.sh`, que apunta siempre a la cuenta del proyecto (solo mantenedores, con acceso a ella). Son:

- `TAVILY_API_KEY`: la búsqueda web (plan gratis en tavily.com).
- `BSKY_APP_PASSWORD`: la contraseña de aplicación de la cuenta del bot en Bluesky.
- `GOOGLE_FACTCHECK_KEY`: verificaciones profesionales ya publicadas (opcional: con «ninguna», se salta).
- `CORRECCIONES_TOKEN`: para publicar correcciones (`POST /correcciones`).
- `KAPSO_API_KEY`: la clave del proyecto en Kapso, para responder por WhatsApp y descargar las imágenes.
- `KAPSO_WEBHOOK_SECRET`: el secreto con que Kapso firma cada webhook (`POST /whatsapp`); lo elige el proyecto al crear el webhook.

Para desplegar a mano (solo mantenedores, con acceso a la cuenta del proyecto): `CLOUDFLARE_ACCOUNT_ID=<cuenta del proyecto> ./scripts/desplegar.sh todo`. Sin esa cuenta, el script se niega.

## Publicar una corrección

Cuando un reporte se confirma (ver [Correcciones](METODOLOGIA.md#correcciones)), quien mantiene el proyecto publica la versión corregida. El bot la guarda, marca la anterior como corregida y avisa en cada hilo donde había respondido:

```bash
curl -X POST "$PUBLIC_URL/correcciones" \
  -H "authorization: Bearer $CORRECCIONES_TOKEN" \
  -d '{
    "investigacionId": "<id de la investigación equivocada>",
    "veredicto": "mayormente_verdadero",
    "confianza": "media",
    "resumen": "El monto es correcto, pero rige desde mayo.",
    "fuentes": [{ "titulo": "Ministerio del Trabajo", "url": "https://www.mintrab.gob.cl/..." }],
    "nota": "Qué cambió y por qué, en una o dos oraciones."
  }'
```

Las fuentes tienen que ser `https`, y la confianza alta exige fuentes de dos sitios distintos, igual que en una investigación. Cada investigación se corrige una sola vez: para volver a corregir, se corrige la versión nueva.

## Pendientes

- **Dominio propio.** `escierto.dev`, `escierto.org` y `escierto.cl` estaban libres el 10 de octubre de 2026. Al comprar uno, va en `PUBLIC_URL` del bot (hoy `escierto.cierto.workers.dev`) y en `site` de la landing.
- **Financiamiento.** Se publicará quién financia el proyecto y con qué condiciones.
- **Registro de cuentas que publican falsedades.** Subproducto de las verificaciones, no el foco del bot: anota quién publicó cada afirmación verificada. Aplica a cualquier cuenta (personas, medios, figuras públicas o bots), con la misma regla. Diseño en revisión; no forma parte del bot todavía.

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md), el [código de conducta](CODE_OF_CONDUCT.md) y la [gobernanza](GOVERNANCE.md). Para empezar, busca issues con la etiqueta `good first issue`. Las vulnerabilidades se reportan en privado: [SECURITY.md](SECURITY.md).

## Licencia

[AGPL-3.0](LICENSE). Si operas una versión modificada como servicio, debes publicar tus cambios.
