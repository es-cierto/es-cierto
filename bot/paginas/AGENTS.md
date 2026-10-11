# Páginas

Las páginas públicas. Puede leer de `verificacion/` y `redes/`, pero no tiene lógica de negocio.

## Invariantes

- **Se escapa todo** lo que viene de la base, con `escapar`.
- **Solo se enlazan URLs `http(s)`.**
- **Una corrección se ve antes que nada.** Si una investigación fue corregida, su página lo dice arriba de todo y enlaza a la versión nueva; la nueva muestra la nota de qué cambió (`investigacionPublica.test.ts`).
- **Un solo ClaimReview por página**, con el mismo veredicto que se ve en ella (formato de Google Fact Check Explorer). El JSON va escapado para que la afirmación no pueda cerrar el `<script>`.

## Archivos

- `api.ts`: `GET /api/investigaciones`, lo que el bot ha respondido, en JSON y paginado, para la landing. Solo investigaciones: nunca quién preguntó (`api.test.ts`). Sin filtros por tema ni sector.
- `html.ts`: el armazón de las páginas y el escape.
- `investigacionPublica.ts`: la página de una investigación (`/a/:id`): veredicto, fuentes, informe, aviso de corrección, marcado ClaimReview y enlace para reportar errores.
- `probar.ts`: el chat de prueba (`/probar`), solo con `PRUEBA_WEB=si`.
