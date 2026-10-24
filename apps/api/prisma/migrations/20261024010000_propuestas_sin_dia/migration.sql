ALTER TABLE actividad ALTER COLUMN fecha DROP NOT NULL;
ALTER TABLE actividad ADD COLUMN fecha_cambiada_en TIMESTAMPTZ(3);
ALTER TABLE alojamiento ADD COLUMN noches INTEGER;
UPDATE alojamiento SET noches = fecha_hasta - fecha_desde;
ALTER TABLE alojamiento ALTER COLUMN noches SET NOT NULL;
ALTER TABLE alojamiento ALTER COLUMN noches SET DEFAULT 0;
ALTER TABLE alojamiento ALTER COLUMN fecha_desde DROP NOT NULL;
ALTER TABLE alojamiento ALTER COLUMN fecha_hasta DROP NOT NULL;
ALTER TABLE alojamiento ADD COLUMN fecha_cambiada_en TIMESTAMPTZ(3);
ALTER TABLE alojamiento ADD CONSTRAINT alojamiento_fechas_completas
  CHECK ((fecha_desde IS NULL) = (fecha_hasta IS NULL));
ALTER TABLE alojamiento ADD CONSTRAINT alojamiento_noches_validas
  CHECK (noches >= 0 AND (fecha_desde IS NULL OR noches = fecha_hasta - fecha_desde));
