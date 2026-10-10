# Perfiles

Los perfiles públicos del proyecto: la cuenta del bot en Bluesky (`@es-cierto.bsky.social`) y la organización `es-cierto` en GitHub. Lo publicado se genera desde aquí; no se edita a mano en cada red.

## Invariantes

Los que tienen mecanismo están en `perfiles.test.ts`.

- **Los textos caben en los límites de cada red** (Bluesky: nombre 64 y biografía 256 grafemas; GitHub: descripción de la organización 160 caracteres).
- **El bot dice lo que es.** La biografía declara que responde de forma automática con IA y que las imágenes son generadas con IA.
- **Mismo vocabulario que la landing:** _mencionar_ (no etiquetar), _publicación_ (no post).
- **Sin rojo ni símbolos de un sector.** El avatar no tiene píxeles rojos, y su prompt no pide estrellas, banderas, escudos ni nada asociable a un partido o al Estado: el motivo es el nudo del hilo.
- **Imágenes que las redes aceptan:** avatar cuadrado, portada 3:1, cada una bajo 1 MB.

## Archivos

- `datos.ts`: los textos de cada perfil. Un cambio de texto va aquí.
- `avatar-prompt.md`: el prompt del avatar (Nano Banana), sus versiones y por qué se descartó cada una. `referencias/` tiene las imágenes que se adjuntan.
- `avatar-fuente.png`: la imagen elegida (v4, un globo de diálogo hecho con el hilo). `avatar-candidato-1.png` queda como registro de la v1.
- `imagenes.mjs`: genera `avatar.jpg` (desde `avatar-fuente.png`, con un poco más de brillo para tamaños chicos) y `portada.jpg` (un cuadro real del video de la landing). Correr con `node perfiles/imagenes.mjs` después de cambiar alguna fuente.
- `perfiles.test.ts`: las reglas de arriba.

## Aplicar

```bash
node scripts/perfiles.ts            # Bluesky y GitHub
node scripts/perfiles.ts bluesky    # solo uno
```

Bluesky usa `BSKY_APP_PASSWORD` de `.dev.vars`. GitHub usa la sesión de `gh` y necesita permisos de admin en la organización. El avatar de la organización de GitHub se sube a mano (la API no lo permite).
