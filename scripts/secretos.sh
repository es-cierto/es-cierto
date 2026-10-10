#!/usr/bin/env bash
# Sube los secretos del bot a la cuenta de Cloudflare del proyecto (la fija `account_id` en wrangler.jsonc).
# Los nombres salen de `secrets.required` de wrangler.jsonc, así que este script no se desactualiza.
# Cada valor se escribe oculto y va directo a Cloudflare: no queda en el historial ni en ningún archivo.
#
# Uso, en una terminal propia (no con `!` de Claude Code, que no deja escribir oculto):
#   ./scripts/secretos.sh            # todos
#   ./scripts/secretos.sh TAVILY_API_KEY   # solo algunos
set -euo pipefail
cd "$(dirname "$0")/.."

# Un token de otra cuenta en el entorno (por ejemplo el de un trabajo) le gana al login de wrangler.
wrangler() { env -u CLOUDFLARE_API_TOKEN npx --yes wrangler "$@"; }

echo "Cuenta de Cloudflare con la que vas a subir los secretos:"
wrangler whoami 2>/dev/null | grep -E "associated with the email|│ .* │ [0-9a-f]{32} │" || true
read -rp "¿Es la cuenta del proyecto? [s/N] " ok
[[ "$ok" =~ ^[sS]$ ]] || { echo "Inicia sesión con la cuenta del proyecto: env -u CLOUDFLARE_API_TOKEN npx wrangler login"; exit 1; }

if [[ $# -gt 0 ]]; then
  nombres=("$@")
else
  read -ra nombres <<<"$(node -e '
    const t = require("fs").readFileSync("wrangler.jsonc", "utf8");
    console.log((t.match(/"required":\s*\[([^\]]*)\]/)?.[1] ?? "").match(/\w+/g).join(" "));
  ')"
fi

ayuda() {
  case "$1" in
    BSKY_APP_PASSWORD) echo "Contraseña de aplicación de la cuenta del bot en Bluesky (Ajustes → Privacidad y seguridad → Contraseñas de aplicación). Nunca la principal." ;;
    TAVILY_API_KEY) echo "Clave de Tavily (tavily.com → API Keys). Usa una nueva, no una que se haya compartido." ;;
    GOOGLE_FACTCHECK_KEY) echo "Clave de Google Fact Check Tools. Opcional: si no tienes, deja vacío y el bot se salta ese paso." ;;
    *) echo "" ;;
  esac
}

for nombre in "${nombres[@]}"; do
  echo
  echo "── $nombre"
  if [[ "$nombre" == "CORRECCIONES_TOKEN" ]]; then
    valor=$(openssl rand -hex 32)
    printf %s "$valor" | pbcopy
    echo "Generé un token al azar y lo copié a tu portapapeles."
    echo "Guárdalo AHORA en tu gestor de contraseñas: sirve para POST /correcciones y Cloudflare no lo vuelve a mostrar."
    read -rp "Enter cuando lo hayas guardado… " _
  else
    texto=$(ayuda "$nombre")
    [[ -n "$texto" ]] && echo "$texto"
    read -rsp "Valor (no se ve mientras escribes): " valor
    echo
    if [[ -z "$valor" ]]; then
      if [[ "$nombre" == "GOOGLE_FACTCHECK_KEY" ]]; then
        valor="ninguna" # bot/verificacion/verificacionesPublicadas.ts lo entiende como "sin clave"
      else
        echo "Vacío: me salto $nombre. Vuelve a correr ./scripts/secretos.sh $nombre cuando lo tengas."
        continue
      fi
    fi
  fi
  printf %s "$valor" | wrangler secret put "$nombre"
  unset valor
done

echo
echo "Secretos en el Worker (solo los nombres):"
wrangler secret list
