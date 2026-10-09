CREATE TABLE IF NOT EXISTS analisis (
  id TEXT PRIMARY KEY,
  afirmacion TEXT NOT NULL,
  veredicto TEXT NOT NULL,
  confianza TEXT NOT NULL,
  resumen TEXT NOT NULL,
  fuentes TEXT NOT NULL,
  anterior_id TEXT REFERENCES analisis(id),
  creado_en INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS menciones (
  uri TEXT PRIMARY KEY,
  autor TEXT NOT NULL,
  analisis_id TEXT REFERENCES analisis(id),
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS menciones_por_autor ON menciones (autor, creado_en);

CREATE TABLE IF NOT EXISTS sesion_bluesky (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  did TEXT NOT NULL,
  access_jwt TEXT NOT NULL,
  expira_en INTEGER NOT NULL
);
