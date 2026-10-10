// Todo el texto y los datos de la landing. Sale de METODOLOGIA.md: nada de cifras, testimonios ni logos inventados.

export const enlaces = {
  repo: 'https://github.com/es-cierto/es-cierto',
  metodologia: 'https://github.com/es-cierto/es-cierto/blob/main/METODOLOGIA.md',
  issues: 'https://github.com/es-cierto/es-cierto/issues/new',
};

// PENDIENTE: la cuenta del bot en Bluesky. `escierto.bsky.social` es de otra persona (creada en 2024, miles de
// publicaciones), así que no se enlaza. Mientras sea null, la página dice que el bot está en preparación.
export const cuentaBluesky: { handle: string; url: string } | null = null;

export const seo = {
  titulo: '¿Es Cierto? · Tiramos del hilo de lo que circula en redes',
  descripcion:
    'Verificador de datos abierto y no partidista. Lo etiquetas en una publicación, sigue el dato hasta su fuente y te responde con evidencia, o te dice que no la hay.',
};

// El recorrido del hilo. Cada parada es una imagen quieta; entre una y otra, un clip que el scroll avanza.
// `foco` es la posición horizontal (%) del recorte en pantallas verticales: el hilo tiene que quedar a la vista.
export const recorrido = [
  { id: 'inicio', etiqueta: 'El post', foco: 35 },
  { id: 'tirar', etiqueta: 'Tirar del hilo', foco: 45 },
  { id: 'fuentes', etiqueta: 'Las fuentes', foco: 40 },
  { id: 'algo-atado', etiqueta: 'Algo atado', foco: 62 },
] as const;

// Ejemplo de veredicto. La fuente se comprobó a mano: la página del Ministerio del Trabajo dice que el ingreso mínimo
// sube a $529.000 "a partir del 1 de mayo de 2025".
export const ejemplo = {
  afirmacion: 'El sueldo mínimo subió a $529.000 en julio de 2025.',
  veredicto: 'Mayormente verdadero',
  icono: 'check',
  resumen: 'El monto es correcto, pero rige desde el 1 de mayo de 2025. La ley se publicó a fines de junio con efecto retroactivo.',
  fuente: {
    titulo: 'Ministerio del Trabajo · Ley 21.751',
    url: 'https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual',
  },
};

// Qué hay al otro extremo del hilo. Es la escala de METODOLOGIA.md contada con la metáfora.
export const escala = [
  { icono: 'check-circle', nombre: 'Verdadero', hilo: 'Sale una fuente que lo confirma.' },
  { icono: 'check', nombre: 'Mayormente verdadero', hilo: 'Sale una fuente que lo confirma en lo esencial, con detalles distintos.' },
  { icono: 'warning', nombre: 'Engañoso', hilo: 'Sale una fuente, pero el dato venía sacado de contexto o desactualizado.' },
  { icono: 'x-circle', nombre: 'Falso', hilo: 'Sale una fuente que lo contradice.' },
  { icono: 'question', nombre: 'No verificable', hilo: 'No sale nada. No encontrar evidencia no lo vuelve falso: queda sin sustento.' },
];

export const pasos = [
  { titulo: 'Lo etiquetas', texto: 'Respondes a la publicación con el dato y mencionas al bot. No hace falta nada más.' },
  {
    titulo: 'Tira del hilo',
    texto: 'Separa el dato de la opinión y busca en la web por rondas: leyes, datos oficiales y verificadores profesionales.',
  },
  {
    titulo: 'Te responde con fuentes',
    texto: 'Contesta en el mismo hilo con el veredicto y un enlace a la investigación completa, con cada fuente a la vista.',
  },
];

export const lema = ['El volumen no cambia el veredicto.', 'La evidencia, sí.'];

export const preguntas = [
  {
    pregunta: '¿Qué verifica?',
    respuesta:
      'Solo afirmaciones de hecho: cifras, fechas, citas, eventos, datos comprobables. No verifica opiniones, predicciones ni chistes; en esos casos responde que no encontró un hecho verificable.',
  },
  {
    pregunta: '¿Es neutral?',
    respuesta:
      'Verifica afirmaciones, no personas ni partidos, y aplica la misma regla a todos. El código y los prompts son públicos para que cualquiera lo compruebe.',
  },
  {
    pregunta: '¿Puede equivocarse?',
    respuesta:
      'Sí. La investigación la hace un modelo de IA abierto que puede fallar. Por eso cada veredicto muestra sus fuentes y el código solo acepta fuentes que de verdad aparecieron en la búsqueda.',
  },
  {
    pregunta: '¿Qué pasa si no encuentra nada?',
    respuesta:
      'El veredicto es No verificable. No encontrar evidencia de algo no lo vuelve falso: Falso exige una fuente que lo contradiga.',
  },
  {
    pregunta: '¿Qué fuentes usa?',
    respuesta:
      'Primero fuentes primarias: datos oficiales, leyes, documentos y estudios. Después, verificaciones de organizaciones firmantes de la IFCN y medios con política editorial pública. Las redes sociales y los blogs anónimos no cuentan como fuente única.',
  },
  {
    pregunta: '¿Y si mil cuentas repiten lo mismo?',
    respuesta:
      'No cambia nada. El veredicto depende de la evidencia, no de cuántas veces se repite algo. Tampoco cambia por insistencia, insultos o presión en el hilo.',
  },
  {
    pregunta: '¿Puedo discutirle un veredicto?',
    respuesta:
      'Sí, respondiéndole en el hilo. Te dice de dónde sale cada dato. Si aportas una fuente sólida que lo contradice, lo reconoce y te pide reportarlo para revisarlo.',
  },
  {
    pregunta: '¿Cómo reporto un error?',
    respuesta:
      'Desde la página de cada investigación o abriendo un issue en el repositorio. Cuando se confirma, se publica una investigación nueva que enlaza a la corregida.',
  },
  {
    pregunta: '¿Quién lo financia?',
    respuesta: 'Pendiente de definir. Se publicará quién financia la operación y con qué condiciones.',
    pendiente: true,
  },
];
