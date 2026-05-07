-- Sembramos el primer admin OWNER. Email + password hasheada con bcrypt
-- (cost factor 10). Default credentials:
--   email:    m90studio@owner.com
--   password: EASeas29#
--
-- El usuario debe cambiar la pass desde /admin/usuarios después del primer
-- login. ON CONFLICT idempotente.
--
-- Nota: las tablas admin_users + admin_sessions ya están creadas desde el
-- schema inicial 0000. Esto es solo el seed.

INSERT INTO "admin_users" (
  "id", "email", "password_hash", "name", "role"
) VALUES (
  'adm_seed_owner_m90studio',
  'm90studio@owner.com',
  '$2b$10$rg73OASUmjosiriow6o7KOyzQ0eoGHoMh3XgDK3V461kgjpBanc7C',
  'M90 Studio Owner',
  'owner'
)
ON CONFLICT ("email") DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'owner',
  deleted_at = NULL;
