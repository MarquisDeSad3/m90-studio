-- Tipo de funda y tabla de precios runtime (admin editable).
-- Defaults: normal $7 USD / 2100 CUP, recubrimiento (coated) $15 USD / 4500 CUP.
-- El ratio CUP/USD asumido es 300 (2026-05). Ajustar desde admin si cambia.

CREATE TYPE "public"."cover_type" AS ENUM ('normal', 'coated');--> statement-breakpoint

CREATE TABLE "cover_pricing" (
  "type" "cover_type" PRIMARY KEY NOT NULL,
  "price_usd_cents" integer NOT NULL,
  "price_cup" integer NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

INSERT INTO "cover_pricing" ("type", "price_usd_cents", "price_cup") VALUES
  ('normal', 700, 2100),
  ('coated', 1500, 4500);--> statement-breakpoint

-- Pedidos viejos (pre-feature) se asumen 'normal' por defecto. Los precios
-- snapshoteados ya viven en orders.price_cup, así que solo hace falta
-- marcar el tipo. price_usd_cents pre-existente queda en 700 (default)
-- para que ningún pedido viejo aparezca con $0.
ALTER TABLE "orders" ADD COLUMN "cover_type" "cover_type" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "price_usd_cents" integer DEFAULT 700 NOT NULL;
