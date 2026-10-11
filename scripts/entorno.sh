#!/usr/bin/env bash
# Prepara el entorno local para probar el bot de punta a punta, con la cuenta gratis de Cloudflare de cada persona.
# Workers AI y Vectorize no tienen simulación local: corren remotos aun en `pnpm dev`, en la cuenta con que se inició
# sesión en wrangler. Nadie necesita las claves ni la cuenta del proyecto.
#
# Uso:  pnpm entorno     (se puede correr las veces que haga falta: no repite lo que ya está)
set -euo pipefail
cd "$(dirname "$0")/.."

wrangler() { pnpm exec wrangler "$@"; }

# CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN en la terminal (por ejemplo, los de un trabajo) le ganan a la sesión
# de wrangler, aquí y en `pnpm dev`. No se quitan en silencio: se avisa.
if [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "⚠ Tienes CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN en tu terminal: wrangler va a usar esa cuenta, no la de tu sesión."
  echo "  Si no es la que quieres, corre esto y también pnpm dev así:  env -u CLOUDFLARE_ACCOUNT_ID -u CLOUDFLARE_API_TOKEN pnpm entorno"
  echo
fi

echo "── Tipos de Cloudflare"
pnpm -s types >/dev/null && echo "listos"

echo "── Sesión de wrangler"
if ! cuenta=$(wrangler whoami 2>/dev/null | grep -m1 "associated with the email"); then
  echo "No hay sesión. Corre:  pnpm exec wrangler login   (con tu propia cuenta gratis de Cloudflare) y vuelve a correr pnpm entorno"
  exit 1
fi
echo "$cuenta"

echo "── .dev.vars"
if [[ ! -f .dev.vars ]]; then
  cp .dev.vars.example .dev.vars
  printf '\n# Chat de prueba en http://localhost:8787/probar, sin Bluesky.\nPRUEBA_WEB=si\n' >>.dev.vars
  echo "Creé .dev.vars con PRUEBA_WEB=si. Falta tu TAVILY_API_KEY (gratis en tavily.com)."
else
  echo "Ya existe; no lo toco."
fi
grep -qE '^TAVILY_API_KEY=.+' .dev.vars || echo "⚠ Sin TAVILY_API_KEY en .dev.vars: el bot no va a poder buscar."

echo "── Índice de Vectorize en tu cuenta"
if wrangler vectorize get escierto-afirmaciones >/dev/null 2>&1; then
  echo "Ya existe."
else
  wrangler vectorize create escierto-afirmaciones --dimensions 1024 --metric cosine
  wrangler vectorize create-metadata-index escierto-afirmaciones --property-name creado_en --type number
fi

echo "── Base de datos local (D1)"
wrangler d1 migrations apply escierto --local

echo
echo "Listo. Corre  pnpm dev  y abre http://localhost:8787/probar"
