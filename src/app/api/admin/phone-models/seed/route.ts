import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { phoneModels } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { PHONE_MODELS } from "@/lib/data/phone-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sincroniza el catálogo de modelos hardcoded en `phone-models.ts` con la
 * tabla `phone_models` en DB. Idempotente: corre `INSERT ... ON CONFLICT
 * DO UPDATE`. Útil al hacer el corte de migración (B-completo) y para
 * re-aplicar si más adelante se agrega un modelo nuevo al .ts.
 *
 * NO toca `active` ni `popularity` en el UPDATE — eso lo gestiona el
 * admin desde la UI. Si pifeás el .ts y tirás de nuevo el seed, los
 * cambios manuales del admin siguen ahí (excepto specs físicas).
 */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let processed = 0;
  for (const m of PHONE_MODELS) {
    const camera = m.camera;
    const values = {
      slug: m.slug,
      brand: m.brand,
      name: m.name,
      aliases: m.aliases,
      widthMm: Math.round(m.widthMm),
      heightMm: Math.round(m.heightMm),
      depthMm: Math.round(m.depthMm),
      cornerRadiusMm: Math.round(m.cornerRadiusMm),
      cameraX: camera ? Math.round(camera[0]) : null,
      cameraY: camera ? Math.round(camera[1]) : null,
      cameraW: camera ? Math.round(camera[2]) : null,
      cameraH: camera ? Math.round(camera[3]) : null,
      popularity: m.popularity,
      active: true,
    };

    await db
      .insert(phoneModels)
      .values(values)
      .onConflictDoUpdate({
        target: phoneModels.slug,
        set: {
          brand: values.brand,
          name: values.name,
          aliases: values.aliases,
          widthMm: values.widthMm,
          heightMm: values.heightMm,
          depthMm: values.depthMm,
          cornerRadiusMm: values.cornerRadiusMm,
          cameraX: values.cameraX,
          cameraY: values.cameraY,
          cameraW: values.cameraW,
          cameraH: values.cameraH,
          updatedAt: new Date(),
        },
      });
    processed += 1;
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(phoneModels);

  return NextResponse.json({
    ok: true,
    processed,
    totalInDb: row?.count ?? 0,
  });
}
