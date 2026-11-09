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
    "Verificador de datos abierto y no partidista. Le reenvías un mensaje por WhatsApp o lo mencionas en Bluesky y te responde con fuentes.",
  sitio: PAGINA,
  repo: {
    nombre: "es-cierto/es-cierto",
    descripcion:
      "Verificador de datos abierto y no partidista: le reenvías un mensaje por WhatsApp o lo mencionas en Bluesky, y te responde con el veredicto y sus fuentes.",
    temas: [
      "fact-checking",
      "verificacion",
      "desinformacion",
      "bluesky",
      "whatsapp",
      "cloudflare-workers",
      "workers-ai",
      "espanol",
    ],
  },
};
