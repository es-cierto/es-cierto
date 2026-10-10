# Páginas

Las páginas públicas. Puede leer de `verificacion/` y `redes/`, pero no tiene lógica de negocio.

## Invariantes

- **Se escapa todo** lo que viene de la base, con `escapar`.
- **Solo se enlazan URLs `http(s)`.**

## Archivos

- `html.ts`: el armazón de las páginas y el escape.
- `investigacionPublica.ts`: la página de una investigación (`/a/:id`): veredicto, fuentes, informe y enlace para reportar errores.
- `probar.ts`: el chat de prueba (`/probar`), solo con `PRUEBA_WEB=si`.
