export const enlaces = {
  bot: 'https://escierto.cierto.workers.dev',
  repo: 'https://github.com/es-cierto/es-cierto',
  metodologia: 'https://github.com/es-cierto/es-cierto/blob/main/METODOLOGIA.md',
  issues: 'https://github.com/es-cierto/es-cierto/issues/new',
  privacidad: '/privacidad',
};

export const cuentaBluesky: { handle: string; url: string } | null = {
  handle: 'es-cierto.bsky.social',
  url: 'https://bsky.app/profile/es-cierto.bsky.social',
};

export const seo = {
  titulo: '¿Es Cierto? · Te decimos si un dato es cierto, con las fuentes a la vista',
  descripcion:
    'Verificador de datos para redes sociales y la web. Lo mencionas en una publicación, busca de dónde sale el dato y te responde con las fuentes, o te avisa si no encontró ninguna. Parte en Bluesky. Abierto y no partidista.',
};

export const recorrido = [
  { id: 'inicio', nombre: 'La publicación', foco: 5 },
  { id: 'mencion', nombre: 'La mención', foco: 45 },
  { id: 'busqueda', nombre: 'La búsqueda', foco: 40 },
  { id: 'respuesta', nombre: 'La respuesta', foco: 62 },
] as const;

export const ejemplo = {
  afirmacion: 'El sueldo mínimo subió a $529.000 en julio de 2025.',
  veredicto: 'Mayormente verdadero',
  icono: 'check',
  resumen: 'El monto es correcto, pero rige desde mayo.',
  fuente: {
    titulo: 'Ministerio del Trabajo',
    url: 'https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual',
  },
};

export const escala = [
  { id: 'verdadero', icono: 'check-circle', nombre: 'Verdadero', texto: 'Las fuentes lo confirman.' },
  {
    id: 'mayormente_verdadero',
    icono: 'check',
    nombre: 'Mayormente verdadero',
    texto: 'Correcto, con un detalle errado.',
  },
  { id: 'enganoso', icono: 'warning', nombre: 'Engañoso', texto: 'Real, pero fuera de contexto.' },
  { id: 'falso', icono: 'x-circle', nombre: 'Falso', texto: 'Las fuentes lo desmienten.' },
  { id: 'no_verificable', icono: 'question', nombre: 'No verificable', texto: 'No hay fuentes suficientes.' },
] as const;

export const pasos = [
  {
    titulo: 'Mencionas al bot',
    texto:
      'Respondes a la publicación donde viste el dato y escribes la cuenta del bot. No necesitas registrarte en ningún lado.',
  },
  {
    titulo: 'El bot investiga',
    texto:
      'Separa el dato de las opiniones y lo busca en leyes, datos oficiales, estudios y verificaciones profesionales.',
  },
  {
    titulo: 'Te responde',
    texto: 'Contesta en la misma conversación con el veredicto y un enlace donde están todas las fuentes.',
  },
];

export const lema = ['Que muchos lo repitan', 'no lo hace cierto.'];

export const preguntas = [
  {
    pregunta: '¿Qué verifica?',
    respuesta: 'Datos que se pueden comprobar: cifras, fechas, citas y hechos. No opiniones ni chistes.',
  },
  {
    pregunta: '¿En qué redes funciona?',
    respuesta: 'Parte en Bluesky. La idea es sumar otras redes sociales y cualquier página web.',
  },
  { pregunta: '¿Es neutral?', respuesta: 'Revisa lo que se dice, nunca quién lo dice. La misma regla para todos.' },
  {
    pregunta: '¿Puede equivocarse?',
    respuesta: 'Sí, lo investiga una inteligencia artificial. Por eso siempre muestra sus fuentes.',
  },
  {
    pregunta: '¿Qué fuentes usa?',
    respuesta: 'Leyes, datos oficiales, estudios y verificadores profesionales. Una publicación en redes nunca basta.',
  },
  {
    pregunta: '¿Y si muchos lo repiten?',
    respuesta: 'No cambia nada. Cuentan las fuentes, no las veces que se repite algo.',
  },
  {
    pregunta: '¿Cómo reporto un error?',
    respuesta: 'Desde la página de cada investigación o en GitHub. La corrección se publica y el bot avisa en el hilo.',
  },
  {
    pregunta: '¿Sigue algún estándar?',
    respuesta:
      'Los cinco principios de la red internacional de verificadores (IFCN). Aún no es signatario: eso exige una organización constituida.',
  },
  {
    pregunta: '¿Quién lo financia?',
    respuesta:
      'Hoy nadie: funciona en planes gratuitos. Si llega dinero, se publica quién aporta y con qué condiciones.',
  },
];
