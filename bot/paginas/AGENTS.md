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

## Por qué está así

- **ClaimReview:** la escala numérica va de 1 (falso) a 4 (verdadero); "no verificable" no es un punto de la escala y va solo con su nombre. El nombre del veredicto (`alternateName`) va sin el emoji que lleva en la página y en Bluesky. Dentro del `<script>`, un `</script>` en la afirmación cerraría la etiqueta: por eso se escapa el `<`.
- **Correcciones:** la versión corregida avisa arriba de todo y enlaza a la nueva; la nueva explica qué cambió y enlaza a la anterior (`avisosDeCorreccion`).
- **API de investigaciones:** cuenta las fuentes (el detalle está en la página de cada investigación). `?limite=` va de 1 a 50 (12 por defecto) y `?antes=` pide la página siguiente; lo inválido se ignora. Se pide una fila de más para saber si hay otra página. Son datos públicos de solo lectura: CORS abierto y caché de 60 segundos.
- **El chat de prueba** se recarga cada 5 segundos en vez de usar streaming: es solo para probar en local.
