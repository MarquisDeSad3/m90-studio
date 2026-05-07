-- Override del wrap en mm para regenerar el print-ready de un pedido
-- con dimensiones distintas si el cover real no quedó bien con el
-- default (depthMm + 3mm).
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "custom_wrap_mm" integer;
