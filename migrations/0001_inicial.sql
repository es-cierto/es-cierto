CREATE TABLE investigaciones (
  id TEXT PRIMARY KEY,
  afirmacion TEXT NOT NULL,
  veredicto TEXT NOT NULL,
  confianza TEXT NOT NULL,
  resumen TEXT NOT NULL,
  fuentes TEXT NOT NULL,
  informe TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anterior_id TEXT REFERENCES investigaciones(id),
  creado_en INTEGER NOT NULL
);

CREATE TABLE menciones (
  uri TEXT PRIMARY KEY,
  autor TEXT NOT NULL,
  investigacion_id TEXT REFERENCES investigaciones(id),
  creado_en INTEGER NOT NULL
);
CREATE INDEX menciones_por_autor ON menciones (autor, creado_en);

CREATE TABLE sesion_bluesky (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  did TEXT NOT NULL,
  access_jwt TEXT NOT NULL,
  expira_en INTEGER NOT NULL
);

-- Solo para la red de prueba (PRUEBA_WEB=si).
CREATE TABLE turnos_web (
  hilo TEXT NOT NULL,
  n INTEGER NOT NULL,
  de_bot INTEGER NOT NULL,
  texto TEXT NOT NULL,
  PRIMARY KEY (hilo, n)
);
