#!/usr/bin/env bash
# Deja listo el entorno para probar el bot de punta a punta, con la cuenta gratis de Cloudflare de cada persona.
# Un solo comando: pide lo que falte (iniciar sesión, la clave de Tavily) y al final ofrece arrancar `pnpm dev`.
# Workers AI y Vectorize no tienen simulación local: corren remotos aun en `pnpm dev`, en la cuenta con que se inició
# sesión en wrangler. Nadie necesita las claves ni la cuenta del proyecto.
#
# Uso:  pnpm entorno     (se puede correr las veces que haga falta: no repite lo que ya está)
set -euo pipefail
cd "$(dirname "$0")/.."

wrangler() { pnpm exec wrangler "$@"; }
# Solo se pregunta si hay una persona en la terminal; en un script o en el CI se avisa y se sigue.
interactivo() { [[ -t 0 && -t 1 ]]; }

# CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN en la terminal (por ejemplo, los de un trabajo) le ganan a la sesión
# de wrangler, aquí y en `pnpm dev`. No se quitan en silencio: se avisa.
if [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "⚠ Tienes CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN en tu terminal: wrangler va a usar esa cuenta, no la de tu sesión."
  echo "  Si no es la que quieres, corre esto así:  env -u CLOUDFLARE_ACCOUNT_ID -u CLOUDFLARE_API_TOKEN pnpm entorno"
  echo
fi

echo "── 1/5 Sesión de Cloudflare"
sesion() { wrangler whoami 2>/dev/null | grep -m1 "associated with the email"; }
if ! cuenta=$(sesion); then
  if interactivo; then
    echo "No has iniciado sesión. Se va a abrir el navegador: entra con TU cuenta de Cloudflare (gratis en dash.cloudflare.com/sign-up)."
    read -rp "Enter para continuar… " _
    wrangler login
    cuenta=$(sesion) || { echo "No se pudo iniciar sesión."; exit 1; }
  else
    echo "No hay sesión. Corre  pnpm exec wrangler login  y vuelve a correr pnpm entorno."
    exit 1
  fi
fi
echo "$cuenta"

echo "── 2/5 .dev.vars"
if [[ ! -f .dev.vars ]]; then
  cp .dev.vars.example .dev.vars
  printf '\n# Chat de prueba en http://localhost:8787/probar, sin Bluesky.\nPRUEBA_WEB=si\n' >>.dev.vars
  echo "Creado, con PRUEBA_WEB=si (el chat de prueba, sin Bluesky)."
else
  echo "Ya existe."
fi

echo "── 3/5 Clave de Tavily (la búsqueda web)"
if grep -qE '^TAVILY_API_KEY=.+' .dev.vars; then
  echo "Ya está en .dev.vars."
elif interactivo; then
  echo "Crea una gratis en https://app.tavily.com (API Keys) y pégala aquí. No se ve mientras escribes."
  read -rsp "TAVILY_API_KEY (Enter para saltar): " clave
  echo
  if [[ -n "$clave" ]]; then
    # Se escribe con node y no con sed: una clave puede traer caracteres que sed interpretaría.
    CLAVE="$clave" node -e '
      const fs = require("fs");
      const lineas = fs.readFileSync(".dev.vars", "utf8").split("\n");
      const i = lineas.findIndex((l) => l.startsWith("TAVILY_API_KEY="));
      if (i >= 0) lineas[i] = `TAVILY_API_KEY=${process.env.CLAVE}`;
      else lineas.push(`TAVILY_API_KEY=${process.env.CLAVE}`);
      fs.writeFileSync(".dev.vars", lineas.join("\n"));'
    unset clave
    echo "Guardada en .dev.vars (ese archivo nunca se commitea)."
  else
    echo "⚠ Sin clave de Tavily el bot no puede buscar. Vuelve a correr pnpm entorno cuando la tengas."
  fi
else
  echo "⚠ Falta TAVILY_API_KEY en .dev.vars (gratis en https://app.tavily.com): sin ella el bot no puede buscar."
fi

echo "── 4/5 Índice de Vectorize en tu cuenta"
if wrangler vectorize get escierto-afirmaciones >/dev/null 2>&1; then
  echo "Ya existe."
else
  wrangler vectorize create escierto-afirmaciones --dimensions 1024 --metric cosine
  wrangler vectorize create-metadata-index escierto-afirmaciones --property-name creado_en --type number
fi

echo "── 5/5 Base de datos local (D1)"
wrangler d1 migrations apply escierto --local >/dev/null && echo "Migraciones aplicadas."

echo
echo "Listo. El chat de prueba queda en http://localhost:8787/probar"
if interactivo; then
  read -rp "¿Arranco pnpm dev ahora? [S/n] " arrancar
  # "n", "no", "No"…: cualquier respuesta que empiece con n es no. Enter o cualquier otra cosa, sí.
  if [[ "$arrancar" =~ ^[[:space:]]*[nN] ]]; then
    echo "Cuando quieras:  pnpm dev"
  else
    exec pnpm dev
  fi
else
  echo "Corre  pnpm dev  para arrancarlo."
fi
