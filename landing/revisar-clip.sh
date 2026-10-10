#!/usr/bin/env bash
# Uso: ./revisar-clip.sh clip.mp4 imagen-inicio.png imagen-fin.png
# Revisa un clip antes de aprobarlo y genera sus versiones web.
set -euo pipefail
clip="$1"; inicio="$2"; fin="$3"
nombre="$(basename "${clip%.*}")"
mkdir -p revision web

echo "== Datos"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,codec_name -show_entries format=duration -of compact=p=0 "$clip"

echo "== Cortes bruscos (cambio de escena > 0.35; idealmente ninguno)"
ffmpeg -hide_banner -i "$clip" -filter:v "select='gt(scene,0.35)',showinfo" -f null - 2>&1 | grep -o 'pts_time:[0-9.]*' || echo "ninguno"

echo "== Unión con las imágenes clave (SSIM: 1 = idéntico; sobre 0.6 la unión no se nota con el fotograma de respaldo)"
ffmpeg -hide_banner -v error -i "$clip" -vf "select=eq(n\,0)" -frames:v 1 -y "revision/$nombre-primero.png"
ffmpeg -hide_banner -v error -sseof -0.1 -i "$clip" -frames:v 1 -update 1 -y "revision/$nombre-ultimo.png"
for par in "primero:$inicio" "ultimo:$fin"; do
  cual="${par%%:*}"; ref="${par#*:}"
  ffmpeg -hide_banner -i "revision/$nombre-$cual.png" -i "$ref" -lavfi "[0]scale=1280:720[a];[1]scale=1280:720[b];[a][b]ssim" -f null - 2>&1 | grep -o 'All:[0-9.]*' | sed "s/^/$cual vs imagen clave: /"
done

echo "== Versiones web (sin audio, keyframe cada 8 cuadros, faststart)"
ffmpeg -hide_banner -v error -y -i "$clip" -an -vf "scale=1920:-2" -c:v libx264 -preset slow -crf 22 -g 8 -keyint_min 8 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart "web/$nombre-1080.mp4"
ffmpeg -hide_banner -v error -y -i "$clip" -an -vf "scale=1280:-2" -c:v libx264 -preset slow -crf 23 -g 4 -keyint_min 4 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart "web/$nombre-720.mp4"
ffmpeg -hide_banner -v error -y -i "$clip" -an -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 34 -b:v 0 -g 8 -row-mt 1 "web/$nombre-1080.webm"
ls -la web/"$nombre"* | awk '{print $5, $9}'
