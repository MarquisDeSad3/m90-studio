import "server-only";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { phoneModels } from "@/lib/db/schema";
import {
  PHONE_MODELS,
  type PhoneModelDef,
} from "@/lib/data/phone-models";

/**
 * Catálogo de modelos servido desde DB (B-completo).
 *
 * El cliente no consume estas funciones — los page server components
 * fetchean el catálogo y lo pasan como prop al editor / homepage. Así
 * evitamos latency en el flujo del editor (mobile cubano) y mantenemos
 * el bundle del cliente liviano.
 *
 * Cuando el admin edita un modelo desde `/admin/modelos`, el helper
 * cacheado se invalida y la próxima request lee los nuevos valores.
 */

/** Convierte una row de DB al shape `PhoneModelDef` que el resto del
    código espera (helpers + componentes existentes). */
function rowToModel(
  row: typeof phoneModels.$inferSelect,
): PhoneModelDef {
  const camera =
    row.cameraX != null &&
    row.cameraY != null &&
    row.cameraW != null &&
    row.cameraH != null
      ? ([row.cameraX, row.cameraY, row.cameraW, row.cameraH] as [
          number,
          number,
          number,
          number,
        ])
      : null;

  return {
    slug: row.slug,
    brand: row.brand,
    name: row.name,
    aliases: row.aliases,
    widthMm: row.widthMm,
    heightMm: row.heightMm,
    depthMm: row.depthMm,
    cornerRadiusMm: row.cornerRadiusMm,
    camera,
    popularity: row.popularity,
  };
}

/** Lee todos los modelos activos, ordenados por popularidad descendente
    y nombre. El editor cliente y el homepage los muestran en este
    orden por default.
    Fallback defensivo: si la tabla está vacía (post-deploy antes de
    seedear, o downtime de DB), usa el catálogo hardcoded del .ts. Así
    el editor cliente nunca queda sin modelos. */
export async function getActivePhoneModels(): Promise<PhoneModelDef[]> {
  const rows = await db
    .select()
    .from(phoneModels)
    .where(eq(phoneModels.active, true))
    .orderBy(desc(phoneModels.popularity), asc(phoneModels.name));
  if (rows.length === 0) return PHONE_MODELS;
  return rows.map(rowToModel);
}

/** Lee TODOS los modelos (incluyendo `active=false`) — para el panel
    admin que necesita ver el catálogo completo. */
export async function getAllPhoneModelsForAdmin(): Promise<
  Array<PhoneModelDef & { active: boolean }>
> {
  const rows = await db
    .select()
    .from(phoneModels)
    .orderBy(asc(phoneModels.brand), desc(phoneModels.popularity), asc(phoneModels.name));
  return rows.map((r) => ({
    ...rowToModel(r),
    active: r.active,
  }));
}

/** Busca un modelo por slug. Devuelve null si no existe o está inactivo
    (a menos que `includeInactive` sea true — útil para print/recompose
    de pedidos viejos cuyos modelos pueden haber sido desactivados).
    Fallback al catálogo hardcoded si DB está vacía. */
export async function getPhoneModelBySlug(
  slug: string,
  opts: { includeInactive?: boolean } = {},
): Promise<PhoneModelDef | null> {
  const [row] = await db
    .select()
    .from(phoneModels)
    .where(eq(phoneModels.slug, slug))
    .limit(1);
  if (!row) {
    return PHONE_MODELS.find((m) => m.slug === slug) ?? null;
  }
  if (!opts.includeInactive && !row.active) return null;
  return rowToModel(row);
}
