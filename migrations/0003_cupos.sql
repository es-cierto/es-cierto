-- Investigaciones reservadas por día (UTC), para no pasarse de las neuronas gratis de Workers AI, que se reinician a las
-- 00:00 UTC. Cada investigación nueva reserva un cupo antes de empezar; sin cupo, el Workflow espera al día siguiente.
CREATE TABLE cupos (
  dia TEXT PRIMARY KEY,
  usados INTEGER NOT NULL
);
