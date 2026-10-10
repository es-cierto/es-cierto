# Prompt del avatar (Nano Banana)

El avatar se ve casi siempre chico (32–48 px) y recortado en círculo: tiene que ser una silueta simple, con un objeto claro sobre fondo oscuro. Concepto: **una etiqueta de papel atada con el hilo de lino**, el final de la historia de la landing ("atado a una fuente").

Los bloques de estilo e hilo son los de `landing/PROMPTS.md`, copiados tal cual, para que sea el mismo hilo y la misma luz del video.

## Versiones

- **v1** (`avatar-candidato-1.png`): etiqueta lisa con un sello en relieve suave. A 96 px o menos el sello desaparece y la etiqueta se lee como **etiqueta de precio** (comercio), no como documento.
- **v2**: sello de **tinta sepia oscura**, grande y centrado, sin letras, con una estrella al centro. Descartado sin generar: una estrella de cinco puntas en un círculo se asocia en Chile a un partido político, y el proyecto no puede llevar un símbolo de ningún sector.
- **v3** (el prompt de abajo): el mismo sello, con el **nudo de lazo** del proyecto al centro. Es nuestro, cuenta la historia ("atado a una fuente") y no pertenece a nadie. Sigue siendo un círculo oscuro a 48 px.

## Imágenes de referencia (adjuntar las dos)

1. `referencias/1-nudo-y-ficha.jpg`: el nudo atado a la ficha sellada, último cuadro del video. Fija la forma del nudo, el papel crema y la luz ámbar.
2. `referencias/2-textura-del-hilo.jpg`: el hilo de cerca. Fija el grosor, la torsión y las fibras sueltas.

## Prompt

```
Square 1:1 profile picture for a fact-checking account. It will be cropped into a circle and seen very small (40 pixels), so it must be a simple, bold, centered silhouette with strong contrast.

Subject: one small cream paper archive tag (no writing on it), rectangular with rounded corners and a reinforced punched hole at the top, hanging slightly tilted. The thread passes through the hole and is tied in one small, tight, clearly visible knot right at the hole; from the knot the thread rises straight up and leaves the top of the frame. The tag and the knot are centered and fill about 55% of the frame, entirely inside the central circle, with generous empty space around them.

Cinematic macro photograph, shallow depth of field, warm amber tungsten light, deep warm shadows, 35mm film grain, muted palette of walnut wood, cream paper and sepia.

THREAD (identical in every shot): one single thin 2 mm twisted natural undyed linen thread, beige with fine loose fibers catching the light.

Background: plain, very dark warm brown-black, almost uniform, with a soft falloff and nothing in it. The cream tag is the brightest element in the image, lit softly from the upper left, with a thin rim light along the thread.

Match the thread, the paper texture and the lighting of the reference images exactly. In the center of the tag there is one large round official seal, about 60% of the tag's width: a dark sepia-brown ink stamp, like the dark stamp on the document in reference image 1, made only of two concentric rings with one small simple bow knot drawn in the middle (a single loop of thread tied in a knot), slightly uneven and worn like a real rubber stamp. No letters, words or numbers anywhere, not even inside the seal.

Avoid: any text, letters, numbers or pseudo-writing on the tag or inside the seal, logos, watermarks, red, orange or pink ink, red, orange-red or pink tones, a small or faint seal, stars, flags, shields, crests, eagles, laurels, check marks, hearts or any political, national or religious symbol, people, hands, more than one thread, a rope or cord thicker than the reference thread, more than one tag, other objects, busy or patterned background, the tag touching or cut by the frame edges, borders, frames, circular vignettes, illustration, cartoon, 3D render look, glossy plastic, oversaturated colors.
```

## Cómo revisarla antes de quedarse con una

1. Generar 3–4 variantes con relación 1:1 y la máxima resolución.
2. Mirar cada una **chica y en círculo**: si a 48 px no se reconoce una etiqueta clara atada a un hilo, se descarta.
3. Revisar que no haya texto inventado en la etiqueta ni un segundo hilo.
4. La elegida se guarda como `perfiles/avatar-fuente.png` (cuadrada, 1024 px o más) y se aplica con `node perfiles/imagenes.mjs` + `node scripts/perfiles.ts`.

## Si falla

| Problema                            | Ajuste                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| La etiqueta queda chica o se pierde | Subir a "fill about 65% of the frame"                                               |
| Aparece texto en la etiqueta        | Repetir "completely blank tag" al inicio del prompt                                 |
| El hilo sale grueso como cuerda     | Insistir con "thin 2 mm thread, like sewing thread" y adjuntar solo la referencia 2 |
| Fondo con objetos                   | "plain studio-like dark background, nothing else in the frame"                      |
