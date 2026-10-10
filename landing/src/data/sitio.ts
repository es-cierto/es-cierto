// Todo el texto y los datos de la landing. Sale de METODOLOGIA.md: nada de cifras, testimonios ni logos inventados.
//
// Reglas de redacción (ver AGENTS.md): primero lo literal y después la metáfora del hilo; una palabra para cada cosa
// (siempre "mencionar", "publicación", "el bot", "fuentes"); nada en clave ni en jerga técnica.

export const enlaces = {
  repo: 'https://github.com/es-cierto/es-cierto',
  metodologia: 'https://github.com/es-cierto/es-cierto/blob/main/METODOLOGIA.md',
  issues: 'https://github.com/es-cierto/es-cierto/issues/new',
};

// PENDIENTE: la cuenta del bot en Bluesky. `escierto.bsky.social` es de otra persona (creada en 2024, miles de
// publicaciones), así que no se enlaza. Mientras sea null, la página dice que el bot todavía no está activo.
export const cuentaBluesky: { handle: string; url: string } | null = null;

export const seo = {
  titulo: '¿Es Cierto? · Te decimos si un dato es cierto, con las fuentes a la vista',
  descripcion:
    'Bot de Bluesky que verifica datos. Lo mencionas en una publicación, busca de dónde sale el dato y te responde con las fuentes, o te avisa si no encontró ninguna. Abierto y no partidista.',
};

// El recorrido del hilo. Cada parada es una imagen quieta; entre una y otra, un clip que el scroll avanza.
// `foco` es la posición horizontal (%) del recorte en pantallas verticales: el hilo tiene que quedar a la vista.
export const recorrido = [
  { id: 'inicio', nombre: 'La publicación', foco: 35 },
  { id: 'mencion', nombre: 'La mención', foco: 45 },
  { id: 'busqueda', nombre: 'La búsqueda', foco: 40 },
  { id: 'respuesta', nombre: 'La respuesta', foco: 62 },
] as const;

// Ejemplo de respuesta. La fuente se comprobó a mano: la página del Ministerio del Trabajo dice que el ingreso mínimo
// sube a $529.000 "a partir del 1 de mayo de 2025".
export const ejemplo = {
  afirmacion: 'El sueldo mínimo subió a $529.000 en julio de 2025.',
  veredicto: 'Mayormente verdadero',
  icono: 'check',
  resumen: 'El monto es correcto, pero rige desde el 1 de mayo de 2025, no desde julio. La ley se publicó a fines de junio y se aplicó con efecto retroactivo.',
  fuente: {
    titulo: 'Ministerio del Trabajo · Ley 21.751',
    url: 'https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual',
  },
};

// La escala de METODOLOGIA.md, en palabras simples.
export const escala = [
  { icono: 'check-circle', nombre: 'Verdadero', texto: 'Las fuentes confirman la afirmación.' },
  { icono: 'check', nombre: 'Mayormente verdadero', texto: 'Lo principal es correcto, pero algún detalle no lo es, como una fecha.' },
  { icono: 'warning', nombre: 'Engañoso', texto: 'Los datos son reales, pero están fuera de contexto o desactualizados.' },
  { icono: 'x-circle', nombre: 'Falso', texto: 'Hay fuentes que contradicen la afirmación.' },
  { icono: 'question', nombre: 'No verificable', texto: 'No hay fuentes suficientes para confirmarla ni para desmentirla.' },
];

export const pasos = [
  {
    titulo: 'Mencionas al bot',
    texto: 'Respondes a la publicación donde viste el dato y escribes la cuenta del bot. No necesitas registrarte en ningún lado.',
  },
  {
    titulo: 'El bot investiga',
    texto: 'Separa el dato de las opiniones y lo busca en leyes, datos oficiales, estudios y verificaciones profesionales.',
  },
  {
    titulo: 'Te responde',
    texto: 'Contesta en la misma conversación con el veredicto y un enlace donde están todas las fuentes.',
  },
];

export const lema = ['Que mucha gente lo repita', 'no lo hace cierto.', 'Lo que cuenta es la evidencia.'];

export const preguntas = [
  {
    pregunta: '¿Qué verifica?',
    respuesta:
      'Datos que se pueden comprobar: cifras, fechas, citas y hechos. No verifica opiniones, predicciones ni chistes. Si le preguntas por una opinión, te dice que no encontró un dato que verificar.',
  },
  {
    pregunta: '¿Es neutral?',
    respuesta:
      'Revisa lo que se dice, nunca a quién lo dice: no evalúa personas ni partidos, y aplica la misma regla a todos. Su código y sus instrucciones son públicos para que cualquiera lo compruebe.',
  },
  {
    pregunta: '¿Puede equivocarse?',
    respuesta:
      'Sí. La investigación la hace una inteligencia artificial, que puede fallar. Por eso cada respuesta muestra sus fuentes, y el bot solo puede usar fuentes que de verdad encontró en la búsqueda.',
  },
  {
    pregunta: '¿Qué pasa si no encuentra nada?',
    respuesta:
      'Te responde «No verificable». No encontrar pruebas no significa que algo sea falso: para decir «Falso» necesita una fuente que lo contradiga.',
  },
  {
    pregunta: '¿Qué fuentes usa?',
    respuesta:
      'Primero, fuentes originales: datos oficiales, leyes, documentos y estudios. Después, verificaciones de organizaciones profesionales que firman el código de la IFCN, la red internacional de verificadores, y medios con política editorial pública. Una publicación en redes o un blog anónimo nunca bastan por sí solos.',
  },
  {
    pregunta: '¿Y si mil cuentas repiten lo mismo?',
    respuesta:
      'No cambia nada. La respuesta depende de las fuentes, no de cuántas veces se repite algo. Tampoco cambia si le insisten, lo insultan o lo presionan.',
  },
  {
    pregunta: '¿Puedo discutirle una respuesta?',
    respuesta:
      'Sí. Respóndele en la misma conversación y te explica de dónde sale cada dato. Si le muestras una fuente seria que lo contradice, lo reconoce y te pide reportarla para revisarla.',
  },
  {
    pregunta: '¿Cómo reporto un error?',
    respuesta:
      'Desde la página de cada investigación, o abriendo un reporte en GitHub. Si el error se confirma, se publica una investigación nueva que enlaza a la corregida.',
  },
  {
    pregunta: '¿Quién lo financia?',
    respuesta: 'Todavía no está definido. Se publicará quién financia el proyecto y con qué condiciones.',
    pendiente: true,
  },
];
