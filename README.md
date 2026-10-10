# ¿Es Cierto?

Verificador de datos abierto que vive en las redes sociales. Lo etiquetas en una publicación, investiga con fuentes y te responde con un veredicto y un enlace a la investigación completa.

```
@escierto.bsky.social ¿es cierto?
```

```
❌ Falso · confianza alta
La cifra real fue 6%, no 50%. El dato viene de un proyecto que no se aprobó.
→ escierto.org/a/…
```

Cada investigación queda publicada con su informe y sus fuentes. Si alguien vuelve a preguntar lo mismo, se reutiliza la investigación reciente o se complementa con evidencia nueva si ya es antiguo.

Su mascota es un **queltehue**, el ave que da la alarma cuando se acerca un intruso.

## Cómo funciona

1. Cada minuto revisa sus menciones y las respuestas que recibe en Bluesky.
2. Por cada mención inicia un flujo durable (Cloudflare Workflow):
   - lee la publicación etiquetada y extrae la afirmación verificable;
   - busca en la base si ya se analizó algo muy parecido (Vectorize):
     - si es reciente, responde con esa investigación;
     - si es antiguo, lo complementa;
   - consulta verificaciones profesionales ya publicadas (Google Fact Check Tools);
   - investiga en la web y redacta el veredicto **con fuentes obligatorias**;
   - guarda la investigación (D1) y responde en el hilo.

Si le respondes en el hilo, **conversa**: explica de dónde salen los datos, responde dudas y busca evidencia nueva si hace falta. El veredicto solo cambia con evidencia, nunca por insistencia. Responde como máximo 5 veces por hilo.

La metodología completa está en [METODOLOGIA.md](METODOLOGIA.md).

## Correrlo localmente

Requisitos: Node 24+, pnpm y una cuenta de Cloudflare.

```bash
pnpm install
cp .dev.vars.example .dev.vars        # completa las claves
pnpm types
npx wrangler login                    # Workers AI y Vectorize corren remotos aun en local
npx wrangler vectorize create escierto-afirmaciones --dimensions 1024 --metric cosine   # una vez
npx wrangler d1 execute escierto --local --file schema.sql
pnpm dev                              # http://localhost:8787
curl "http://localhost:8787/__scheduled"   # simula el cron
# o, sin Bluesky: PRUEBA_WEB=si en .dev.vars y abre http://localhost:8787/probar
```

Para la cuenta del bot en Bluesky usa una **contraseña de aplicación** (Ajustes → Privacidad y seguridad → Contraseñas de aplicación), nunca la contraseña principal. Para probar, usa una cuenta aparte y pon su handle en `BSKY_HANDLE=` dentro de `.dev.vars`.

## La página pública

`landing/` es la landing (Astro estático en un Worker de Cloudflare propio). El scroll avanza un video que sigue un hilo hasta su fuente; las imágenes y los clips se generaron con IA (Higgsfield, MiniMax H3) y los prompts están en `landing/PROMPTS.md`.

```bash
cd landing
pnpm install
pnpm test
pnpm deploy   # astro build + wrangler deploy
```

## Desplegar

```bash
npx wrangler d1 create escierto                  # copia el database_id a wrangler.jsonc
npx wrangler vectorize create escierto-afirmaciones --dimensions 1024 --metric cosine
npx wrangler vectorize create-metadata-index escierto-afirmaciones --property-name creado_en --type number
pnpm db:init -- --remote
npx wrangler secret put TAVILY_API_KEY      # búsqueda web, plan gratis en tavily.com
npx wrangler secret put BSKY_APP_PASSWORD
npx wrangler secret put GOOGLE_FACTCHECK_KEY
pnpm deploy
```

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md). Las vulnerabilidades se reportan en privado: [SECURITY.md](SECURITY.md).

## Licencia

[AGPL-3.0](LICENSE). Si operas una versión modificada como servicio, debes publicar tus cambios.
