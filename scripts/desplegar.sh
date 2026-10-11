#!/usr/bin/env bash
# Despliega a producción, en la cuenta de Cloudflare del proyecto (escierto.dev@gmail.com). Lo corre el CI al mergear
# a main (.github/workflows/desplegar.yml). Exige CLOUDFLARE_ACCOUNT_ID con la cuenta del proyecto: los wrangler.jsonc
# no la fijan (para que cada persona use la suya en local), así que sin esta guarda se podría desplegar en otra.
#
# Uso:  CLOUDFLARE_ACCOUNT_ID=<cuenta del proyecto> ./scripts/desplegar.sh [bot|landing|todo]
set -euo pipefail
cd "$(dirname "$0")/.."

PROYECTO="a59ff336f9e5b7f9bd3182963ba65269" # el ID de una cuenta no es secreto
que="${1:-todo}"

if [[ "${CLOUDFLARE_ACCOUNT_ID:-}" != "$PROYECTO" ]]; then
  echo "Producción se despliega solo en la cuenta del proyecto, y normalmente lo hace el CI al mergear a main."
  echo "Para desplegar a mano (solo mantenedores): CLOUDFLARE_ACCOUNT_ID=$PROYECTO $0 $que"
  exit 1
fi

if [[ "$que" == "bot" || "$que" == "todo" ]]; then
  echo "── Migraciones de D1"
  pnpm exec wrangler d1 migrations apply escierto --remote
  echo "── Bot"
  pnpm exec wrangler deploy
fi

if [[ "$que" == "landing" || "$que" == "todo" ]]; then
  echo "── Landing"
  (cd landing && pnpm exec astro build && pnpm exec wrangler deploy)
fi
