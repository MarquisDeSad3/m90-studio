-- Catalogo de modelos de teléfono pasa a estar gestionado desde DB.
-- Antes vivia hardcoded en src/lib/data/phone-models.ts.
--
-- Le agregamos depth_mm (grosor) que es el campo nuevo del feature de
-- print con wrap. Las demas columnas ya existian de una migration vieja
-- pero la tabla estaba vacia (count = 0).
ALTER TABLE "phone_models" ADD COLUMN IF NOT EXISTS "depth_mm" integer NOT NULL DEFAULT 0;
