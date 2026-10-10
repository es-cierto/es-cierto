# Prompt del avatar (Nano Banana)

El avatar se ve casi siempre chico (32–48 px) y recortado en círculo: tiene que ser una silueta simple, con un objeto claro sobre fondo oscuro. Concepto actual (v4): **un globo de diálogo dibujado con el hilo de lino, cerrado por un nudo, con un "?" de hilo adentro**. Juega con el doble sentido de "hilo": la conversación en la red, donde el bot responde, y el hilo del que se tira en la landing.

Los bloques de estilo e hilo son los de `landing/PROMPTS.md`, copiados tal cual, para que sea el mismo hilo y la misma luz del video.

## Versiones

- **v1** (`avatar-candidato-1.png`): etiqueta lisa con un sello en relieve suave. A 96 px o menos el sello desaparece y la etiqueta se lee como **etiqueta de precio** (comercio), no como documento.
- **v2**: sello de **tinta sepia oscura**, grande y centrado, sin letras, con una estrella al centro. Descartado sin generar: una estrella de cinco puntas en un círculo se asocia en Chile a un partido político, y el proyecto no puede llevar un símbolo de ningún sector.
- **v3**: el mismo sello, con el **nudo de lazo** del proyecto al centro. No se generó: la idea de la etiqueta no convenció.
- **v4** (el prompt de abajo): **globo de diálogo hecho de hilo**, cerrado por un nudo, con un "?" de hilo cuyo punto es otro nudo. Un globo es de las formas más legibles en chico, no pertenece a ningún sector y dice "responde en la conversación" sin texto.

## Imágenes de referencia (adjuntar las dos)

1. `referencias/2-textura-del-hilo.jpg` (la principal): el hilo de cerca. Fija el grosor, la torsión y las fibras sueltas.
2. `referencias/1-nudo-y-ficha.jpg`: el nudo atado a la ficha, último cuadro del video. Fija cómo se ve un nudo apretado y la luz ámbar.

## Prompt

```
Square 1:1 profile picture for a fact-checking account. It will be cropped into a circle and seen very small (40 pixels), so it must be a simple, bold, centered shape with strong contrast and lots of empty space.

Subject: a speech bubble drawn in the air with one single thread, seen straight on, flat against a dark background. The thread forms the clean outline of a rounded speech bubble with a short pointed tail at the lower left, and its two ends meet at the top of the bubble, where they are tied together in one small, tight, clearly visible knot. Inside the bubble, a second short piece of the same thread is laid flat in the shape of a simple question mark; the dot of the question mark is a tiny tight knot. The bubble is centered and fills about 65% of the frame, entirely inside the central circle.

Cinematic macro photograph, shallow depth of field, warm amber tungsten light, deep warm shadows, 35mm film grain, muted palette of walnut wood, cream paper and sepia.

THREAD (identical in every shot): one single thin 2 mm twisted natural undyed linen thread, beige with fine loose fibers catching the light.

Background: plain, very dark warm brown-black, almost uniform, with a soft falloff and nothing in it. The thread is the brightest element in the image, lit softly from the upper left so its twist and fibers are visible; the lines stay crisp and in focus.

Match the thread and the lighting of the reference images exactly: same thickness, twist, color and loose fibers.

Avoid: any text, letters or numbers other than the single question mark, an inverted question mark, more than one speech bubble, a bubble made of rope, yarn, wool or cord thicker than the reference thread, a messy, tangled or broken outline, a filled or colored bubble, paper, tags, cards, other objects, people, hands, needles, sewing machines, stars, flags, shields, crests, eagles, laurels, check marks, hearts or any political, national or religious symbol, red, orange-red or pink tones, logos, watermarks, borders, frames, circular vignettes, busy or patterned background, the shape touching or cut by the frame edges, illustration, cartoon, emoji style, 3D render look, glossy plastic, oversaturated colors.
```

## Cómo revisarla antes de quedarse con una

1. Generar 3–4 variantes con relación 1:1 y la máxima resolución.
2. Mirar cada una **chica y en círculo**: si a 48 px no se reconoce un globo de diálogo, se descarta.
3. Revisar que el contorno sea limpio (sin enredos ni cortes), que el "?" se lea y que no aparezca texto inventado.
4. La elegida se guarda como `perfiles/avatar-fuente.png` (cuadrada, 1024 px o más) y se aplica con `node perfiles/imagenes.mjs` + `node scripts/perfiles.ts`.

## Si falla

| Problema                            | Ajuste                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| La etiqueta queda chica o se pierde | Subir a "fill about 65% of the frame"                                               |
| Aparece texto en la etiqueta        | Repetir "completely blank tag" al inicio del prompt                                 |
| El hilo sale grueso como cuerda     | Insistir con "thin 2 mm thread, like sewing thread" y adjuntar solo la referencia 2 |
| Fondo con objetos                   | "plain studio-like dark background, nothing else in the frame"                      |
