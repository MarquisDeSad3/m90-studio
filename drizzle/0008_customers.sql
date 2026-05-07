-- Tabla customers: identidad natural por número de WhatsApp + tags/notas
-- internas para CRM. Backfill al final desde orders existentes.
CREATE TABLE IF NOT EXISTS "customers" (
  "id" text PRIMARY KEY NOT NULL,
  "phone" text NOT NULL,
  "name" text,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "customers_phone_uq" ON "customers" ("phone");

-- Backfill: un cliente por phone único en orders. Tomamos el nombre del
-- pedido más reciente. Idempotente — re-ejecutar no duplica.
INSERT INTO "customers" ("id", "phone", "name", "created_at", "updated_at")
SELECT
  'cust_' || substr(md5(random()::text || phone), 1, 24) AS id,
  phone,
  (
    SELECT customer_name
    FROM orders
    WHERE customer_phone = sub.phone
    ORDER BY created_at DESC
    LIMIT 1
  ) AS name,
  MIN(sub.created_at) AS created_at,
  now() AS updated_at
FROM (
  SELECT customer_phone AS phone, created_at
  FROM orders
  WHERE customer_phone IS NOT NULL
) sub
GROUP BY phone
ON CONFLICT (phone) DO NOTHING;
