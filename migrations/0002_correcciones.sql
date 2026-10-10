-- Principio 5 de la IFCN: quien vio una verificación equivocada tiene que ver la corrección.
-- Para responder en el hilo de cada mención hace falta la mención completa (red, cid, raíz), no solo su URI.
ALTER TABLE menciones ADD COLUMN datos TEXT;

-- La investigación corregida apunta a la que la reemplaza; la nueva explica qué cambió.
ALTER TABLE investigaciones ADD COLUMN corregida_por TEXT REFERENCES investigaciones(id);
ALTER TABLE investigaciones ADD COLUMN nota_correccion TEXT;
