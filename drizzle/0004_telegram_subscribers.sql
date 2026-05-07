-- Tabla de suscriptores de notificaciones Telegram. Cuando alguien manda
-- /start al bot lo insertamos como `pending`; el admin lo aprueba desde
-- /admin/ajustes y entra a la lista de receptores. Reemplaza la variable
-- TELEGRAM_CHAT_ID como fuente principal (la env queda como fallback si
-- la tabla está vacía, para no romper deployments existentes).

CREATE TYPE "public"."telegram_subscriber_status" AS ENUM (
  'pending',
  'approved',
  'rejected'
);--> statement-breakpoint

CREATE TABLE "telegram_subscribers" (
  "chat_id" text PRIMARY KEY NOT NULL,
  "username" text,
  "first_name" text,
  "last_name" text,
  "status" "telegram_subscriber_status" DEFAULT 'pending' NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "approved_at" timestamp with time zone,
  "rejected_at" timestamp with time zone
);--> statement-breakpoint

CREATE INDEX "telegram_subscribers_status_idx"
  ON "telegram_subscribers" ("status");--> statement-breakpoint

-- Seed: chat_ids ya aprobados (descubiertos antes de la feature).
-- ON CONFLICT permite que la migration sea idempotente — si por alguna
-- razón se vuelve a correr, no falla y mantiene el status aprobado.
INSERT INTO "telegram_subscribers" (
  "chat_id", "username", "first_name", "last_name", "status", "approved_at"
) VALUES
  ('5981406436', NULL, 'I', 'I', 'approved', now()),
  ('8293740411', 'wps2902', 'Wps', NULL, 'approved', now())
ON CONFLICT ("chat_id") DO UPDATE SET
  status = 'approved',
  approved_at = COALESCE("telegram_subscribers".approved_at, now());
