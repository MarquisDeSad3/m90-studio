-- Extiende el enum phone_brand con 7 nuevas marcas: LG, Nokia, ZTE, Pixel,
-- OnePlus, Alcatel, BLU. Ampliar la cobertura del catalogo cubano (modelos
-- viejos LG/Nokia con base instalada, ZTE Blade muy popular, Pixel/OnePlus
-- nicho premium).
--
-- Postgres requiere cada ADD VALUE en su propio statement; IF NOT EXISTS
-- evita fallar si una migration anterior ya lo creo.
ALTER TYPE "public"."phone_brand" ADD VALUE IF NOT EXISTS 'lg';--> statement-breakpoint
ALTER TYPE "public"."phone_brand" ADD VALUE IF NOT EXISTS 'nokia';--> statement-breakpoint
ALTER TYPE "public"."phone_brand" ADD VALUE IF NOT EXISTS 'zte';--> statement-breakpoint
ALTER TYPE "public"."phone_brand" ADD VALUE IF NOT EXISTS 'pixel';--> statement-breakpoint
ALTER TYPE "public"."phone_brand" ADD VALUE IF NOT EXISTS 'oneplus';--> statement-breakpoint
ALTER TYPE "public"."phone_brand" ADD VALUE IF NOT EXISTS 'alcatel';--> statement-breakpoint
ALTER TYPE "public"."phone_brand" ADD VALUE IF NOT EXISTS 'blu';
