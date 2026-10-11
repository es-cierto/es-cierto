export const PAGINA = "https://es.cierto.workers.dev";

export const bluesky = {
  handle: "es-cierto.bsky.social",
  nombre: "¿Es Cierto?",
  biografia: [
    "Verifico datos de redes sociales.",
    "Mencióname en una publicación y busco las fuentes; si no las hay, te lo digo.",
    "Respuestas automáticas con IA. Abierto y no partidista. Imágenes generadas con IA.",
    "es.cierto.workers.dev",
  ].join("\n"),
  avatar: "perfiles/avatar.jpg",
  portada: "perfiles/portada.jpg",
};

export const github = {
  organizacion: "es-cierto",
  nombre: "¿Es Cierto?",
  descripcion:
    "Verificador de datos abierto y no partidista para redes sociales. Mencionas al bot y te responde con fuentes.",
  sitio: PAGINA,
  repo: {
    nombre: "es-cierto/es-cierto",
    descripcion:
      "Bot que verifica datos en redes sociales: lo mencionas en una publicación y te responde con el veredicto y sus fuentes.",
    temas: [
      "fact-checking",
      "verificacion",
      "desinformacion",
      "bluesky",
      "cloudflare-workers",
      "workers-ai",
      "espanol",
    ],
  },
};
