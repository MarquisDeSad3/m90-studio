# Migraciones de M90 Studio — LEER ANTES DE TOCAR LA DB

## ⚠️ El chain incremental `0000..0008` está ROTO para reconstruir desde cero

La base de producción **NO** se construyó corriendo estas migraciones en orden, y
**no se puede** reconstruir corriéndolas en orden. Problemas concretos:

1. `0000_green_kree.sql` crea la tabla `orders` con la forma **vieja**
   (`user_id`/`phone_model_id` NOT NULL, sin columnas de cliente). La migración
   que reescribió `orders` al modelo guest-checkout actual (`customer_phone`,
   `customer_name`, `phone_model_slug`, `phone_model_name`, `layout_name`,
   `width_mm`, `height_mm`, `corner_radius_mm`, `camera_box`, `user_id` nullable,
   sin `phone_model_id`) **nunca se commiteó al chain**.
2. `meta/_journal.json` solo registra hasta `0005`. Las migraciones
   `0006`/`0007`/`0008` no están en el journal → `drizzle-kit migrate` no las ve.
3. `0008_customers.sql` hace un backfill que lee `orders.customer_phone`, columna
   que el chain no crea hasta esa migración inexistente → falla a mitad.

Producción funciona porque las columnas se aplicaron **a mano con psql**
(`docker exec ... psql ...`), fuera del chain. No existe la tabla
`__drizzle_migrations`.

## ✅ Cómo reconstruir la DB (disaster recovery)

Usá el dump del esquema REAL de producción, no el chain:

```bash
# _recovery_full_schema.sql es un pg_dump --schema-only de la prod viva
# (tomado 2026-06-11). Es la fuente de verdad del esquema.
cat drizzle/_recovery_full_schema.sql | \
  docker exec -i <postgres_container> psql -U m90 -d <nueva_db> -v ON_ERROR_STOP=1
```

Después seedear datos que no son DDL (precios, modelos, admin owner) con las
migraciones de datos correspondientes (`0003_cover_pricing`, `0005_seed_admin_owner`,
seed de `phone_models` vía `/api/admin/phone-models/seed`).

## Flujo recomendado de ahora en adelante

- `src/lib/db/schema.ts` es la fuente de verdad del esquema.
- Para cambios de esquema en prod: escribir el `ALTER`/`CREATE` idempotente
  (`IF NOT EXISTS`) y aplicarlo a mano con psql (ver `memory/m90_infra.md`).
- Después de cualquier cambio de esquema, **regenerar este dump**:
  ```bash
  ssh -i <key> root@<vps> \
    "docker exec <pg> pg_dump -U m90 -d m90_studio --schema-only --no-owner --no-privileges" \
    > drizzle/_recovery_full_schema.sql
  ```
- No corras `drizzle-kit migrate`/`push` contra prod: el chain está desfasado y
  podría intentar cambios destructivos. Si querés volver al flujo nativo de
  drizzle, hay que regenerar un baseline limpio desde `schema.ts` y verificarlo
  contra `_recovery_full_schema.sql` en una DB de prueba antes de confiar en él.
