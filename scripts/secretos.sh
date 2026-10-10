#!/usr/bin/env bash
# Sube los secretos del bot desde un archivo .env a la cuenta de Cloudflare del proyecto (la fija `account_id` en
# wrangler.jsonc). Solo toma las claves de `secrets.required`; el resto del archivo se ignora.
#
# Uso:  ./scripts/secretos.sh            # lee .env
#       ./scripts/secretos.sh otro.env
#
# Si falta CORRECCIONES_TOKEN, genera uno al azar y lo agrega al archivo, para que quede guardado.
# Si GOOGLE_FACTCHECK_KEY está vacía, sube "ninguna" (el bot se salta esa búsqueda).
set -euo pipefail
cd "$(dirname "$0")/.."

archivo="${1:-.env}"
[[ -f "$archivo" ]] || { echo "No existe $archivo"; exit 1; }
git check-ignore -q "$archivo" || { echo "$archivo no está en .gitignore: no subo secretos desde un archivo que se podría commitear."; exit 1; }

if ! grep -qE '^CORRECCIONES_TOKEN=.+' "$archivo"; then
  printf '\nCORRECCIONES_TOKEN=%s\n' "$(openssl rand -hex 32)" >>"$archivo"
  echo "Generé CORRECCIONES_TOKEN y lo agregué a $archivo."
fi

# Arma un JSON temporal (solo legible por ti) con las claves requeridas y lo borra al terminar.
temporal=$(mktemp)
chmod 600 "$temporal"
trap 'rm -f "$temporal"' EXIT

node - "$archivo" "$temporal" <<'NODE'
const fs = require("fs");
const [archivo, salida] = process.argv.slice(2);
const wrangler = fs.readFileSync("wrangler.jsonc", "utf8");
const requeridos = (wrangler.match(/"required":\s*\[([^\]]*)\]/)?.[1] ?? "").match(/\w+/g) ?? [];
const valores = {};
for (const linea of fs.readFileSync(archivo, "utf8").split("\n")) {
  const m = linea.match(/^\s*(?:export\s+)?(\w+)\s*=\s*(.*)\s*$/);
  if (m) valores[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
}
const secretos = {};
const faltan = [];
for (const nombre of requeridos) {
  const valor = valores[nombre] ?? "";
  if (valor) secretos[nombre] = valor;
  else if (nombre === "GOOGLE_FACTCHECK_KEY") secretos[nombre] = "ninguna";
  else faltan.push(nombre);
}
if (faltan.length) {
  console.error(`Faltan en ${archivo}: ${faltan.join(", ")}. Agrégalos (NOMBRE=valor) y vuelve a correr.`);
  process.exit(1);
}
fs.writeFileSync(salida, JSON.stringify(secretos));
console.log(`Subo: ${Object.keys(secretos).join(", ")}`);
NODE

# Un token de otra cuenta en el entorno (por ejemplo el de un trabajo) le gana al login de wrangler.
env -u CLOUDFLARE_API_TOKEN npx --yes wrangler secret bulk "$temporal"
echo
env -u CLOUDFLARE_API_TOKEN npx --yes wrangler secret list
