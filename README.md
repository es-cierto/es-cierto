# ¿Es Cierto?

Verificador de datos para redes sociales y la web. Lo mencionas en una publicación, busca de dónde sale el dato y te responde ahí mismo con un veredicto y sus fuentes, o te avisa si no encontró ninguna. Abierto y no partidista.

Parte en Bluesky, que tiene una API abierta y gratuita. La idea es sumar otras redes sociales y cualquier página web: cada red es un módulo en `bot/redes/`.

**Página:** https://es.cierto.workers.dev

```
@<cuenta del bot> ¿es cierto?
```

```
☑️ Mayormente verdadero · confianza alta
El monto es correcto, pero rige desde el 1 de mayo de 2025, no desde julio.
→ <página de la investigación>
```

Cada investigación queda publicada con su informe y sus fuentes. Si alguien vuelve a preguntar lo mismo, se reutiliza la investigación reciente o se complementa con evidencia nueva si ya es antigua.

> **Estado:** el bot todavía no está desplegado. Falta crear su cuenta propia en Bluesky (`escierto.bsky.social` es de otra persona). Mientras no haya dominio propio, el bot vive en `https://escierto.cierto.workers.dev`. Ver [Pendientes](#pendientes).

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

| Carpeta       | Qué es                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `bot/`        | El bot (un Worker), con una carpeta por dominio: `verificacion/`, `conversacion/`, `redes/`, `paginas/` y `shared/`. |
| `landing/`    | La página pública: Astro estático en su propio Worker, con un video controlado por el scroll.                        |
| `evals/`      | Escenarios de calidad del modelo con promptfoo.                                                                      |
| `migrations/` | El esquema de D1, con las migraciones de wrangler.                                                                   |

Es un monorepo: un solo `pnpm install` en la raíz instala el bot y la landing (workspace de pnpm, un solo lockfile), y `pnpm check` revisa los dos.

Cada carpeta tiene su `AGENTS.md` con sus reglas. El repo sigue [context architecture](https://context-architecture.dev/): cada regla que el repo afirma sobre sí mismo está atada a un test que falla si deja de cumplirse.

## Correrlo localmente

Requisitos: Node 24+, pnpm y una cuenta de Cloudflare.

```bash
pnpm install
cp .dev.vars.example .dev.vars        # completa las claves
pnpm types
npx wrangler login                    # Workers AI y Vectorize corren remotos aun en local
npx wrangler vectorize create escierto-afirmaciones --dimensions 1024 --metric cosine   # una vez
pnpm db:migrar -- --local
pnpm dev                              # http://localhost:8787
curl "http://localhost:8787/__scheduled"   # simula el cron
# o, sin Bluesky: PRUEBA_WEB=si en .dev.vars y abre http://localhost:8787/probar
```

Para la cuenta del bot en Bluesky usa una **contraseña de aplicación** (Ajustes → Privacidad y seguridad → Contraseñas de aplicación), nunca la contraseña principal. Para probar, usa una cuenta aparte y pon su handle en `BSKY_HANDLE=` dentro de `.dev.vars`.

```bash
pnpm check     # formato, lint, tipos y tests (lo mismo que el CI)
pnpm eval      # calidad del modelo; gasta neuronas y búsquedas de Tavily
```

## La página pública

`landing/` se publica en **https://es.cierto.workers.dev** (Worker `es` en el subdominio `cierto` de workers.dev). Al hacer scroll, un video sigue un hilo de lino desde una publicación hasta su fuente. Las imágenes y los clips se generaron con IA (Higgsfield, GPT Image y MiniMax H3); los prompts, las técnicas y los antipatrones están en [landing/PROMPTS.md](landing/PROMPTS.md).

```bash
cd landing     # la instalación de la raíz ya incluye la landing (workspace de pnpm)
pnpm typecheck # tipos (astro sync + tsc)
pnpm test      # cálculo del recorrido y reglas de la página
pnpm run deploy    # astro build + wrangler deploy
```

Después de desplegar, espera unos 30 segundos antes de probar: el HTML nuevo puede llegar a Cloudflare antes que sus estilos.

## Desplegar el bot

```bash
npx wrangler d1 create escierto                  # copia el database_id a wrangler.jsonc
npx wrangler vectorize create escierto-afirmaciones --dimensions 1024 --metric cosine
npx wrangler vectorize create-metadata-index escierto-afirmaciones --property-name creado_en --type number
pnpm db:migrar -- --remote
npx wrangler secret put TAVILY_API_KEY      # búsqueda web, plan gratis en tavily.com
npx wrangler secret put BSKY_APP_PASSWORD
npx wrangler secret put GOOGLE_FACTCHECK_KEY
npx wrangler secret put CORRECCIONES_TOKEN     # para publicar correcciones (POST /correcciones); genera uno largo y aleatorio
pnpm run deploy
```

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

- **Cuenta del bot en Bluesky.** `escierto.bsky.social` es de otra persona (creada en 2024, miles de publicaciones). Hay que crear la propia y ponerla en `BSKY_HANDLE` (`wrangler.jsonc`) y en `cuentaBluesky` (`landing/src/data/sitio.ts`).
- **Dominio propio.** `escierto.dev`, `escierto.org` y `escierto.cl` estaban libres el 10 de octubre de 2026. Al comprar uno, va en `PUBLIC_URL` del bot (hoy `escierto.cierto.workers.dev`) y en `site` de la landing.
- **Financiamiento.** Se publicará quién financia el proyecto y con qué condiciones.
- **Registro de cuentas que publican falsedades.** Subproducto de las verificaciones, no el foco del bot: anota quién publicó cada afirmación verificada. Aplica a cualquier cuenta (personas, medios, figuras públicas o bots), con la misma regla. Diseño en revisión; no forma parte del bot todavía.

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md). Las vulnerabilidades se reportan en privado: [SECURITY.md](SECURITY.md).

## Licencia

[AGPL-3.0](LICENSE). Si operas una versión modificada como servicio, debes publicar tus cambios.
