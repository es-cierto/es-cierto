# ¿Es Cierto?

Verificador de datos abierto que vive en las redes sociales. Lo etiquetas en una publicación, investiga con fuentes y te responde con un veredicto y un enlace al análisis completo.

```
@escierto.bsky.social ¿es cierto?
```

```
❌ Falso · confianza alta
La cifra real fue 6%, no 50%. El dato viene de un proyecto que no se aprobó.
→ escierto.org/a/…
```

Cada análisis queda publicado con sus fuentes. Si alguien vuelve a preguntar lo mismo, se reutiliza el análisis reciente o se complementa con evidencia nueva si ya es antiguo.

Su mascota es un **queltehue**, el ave que da la alarma cuando se acerca un intruso.

## Cómo funciona

1. Cada minuto revisa sus menciones en Bluesky.
2. Por cada mención inicia un flujo durable (Cloudflare Workflow):
   - lee la publicación etiquetada y extrae la afirmación verificable;
   - busca en la base si ya se analizó algo muy parecido (Vectorize):
     - si es reciente, responde con ese análisis;
     - si es antiguo, lo complementa;
   - consulta verificaciones profesionales ya publicadas (Google Fact Check Tools);
   - investiga en la web y redacta el veredicto **con fuentes obligatorias**;
   - guarda el análisis (D1) y responde en el hilo.

La metodología completa está en [METODOLOGIA.md](METODOLOGIA.md).

## Correrlo localmente

Requisitos: Node 24+, pnpm y una cuenta de Cloudflare.

```bash
pnpm install
cp .dev.vars.example .dev.vars        # completa las claves
pnpm types
npx wrangler d1 execute escierto --local --file schema.sql
pnpm dev                              # http://localhost:8787
curl "http://localhost:8787/__scheduled"   # simula el cron
```

Para la cuenta del bot en Bluesky usa una **contraseña de aplicación** (Ajustes → Privacidad y seguridad → Contraseñas de aplicación), nunca la contraseña principal.

## Desplegar

```bash
npx wrangler d1 create escierto                  # copia el database_id a wrangler.jsonc
npx wrangler vectorize create escierto-afirmaciones --dimensions 1024 --metric cosine
npx wrangler vectorize create-metadata-index escierto-afirmaciones --property-name creado_en --type number
pnpm db:init -- --remote
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put BSKY_APP_PASSWORD
npx wrangler secret put GOOGLE_FACTCHECK_KEY
pnpm deploy
```

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md). Las vulnerabilidades se reportan en privado: [SECURITY.md](SECURITY.md).

## Licencia

[AGPL-3.0](LICENSE). Si operas una versión modificada como servicio, debes publicar tus cambios.
