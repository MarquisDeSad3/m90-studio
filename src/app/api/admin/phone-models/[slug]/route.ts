import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { phoneModels } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PHONE_BRANDS = [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "motorola",
  "lg",
  "nokia",
  "zte",
  "pixel",
  "oneplus",
  "alcatel",
  "blu",
  "other",
] as const;

/** Body de PATCH: todos los campos opcionales — sólo se actualizan los
    presentes. El slug NO es editable (es el id semántico, los pedidos
    lo usan como FK). Si querés "renombrar" un modelo, creás uno nuevo
    y desactivás el viejo. */
const Body = z.object({
  brand: z.enum(PHONE_BRANDS).optional(),
  name: z.string().min(2).max(80).optional(),
  aliases: z.array(z.string().min(1).max(60)).optional(),
  widthMm: z.number().int().min(40).max(120).optional(),
  heightMm: z.number().int().min(80).max(220).optional(),
  depthMm: z.number().int().min(0).max(30).optional(),
  cornerRadiusMm: z.number().int().min(0).max(30).optional(),
  camera: z
    .tuple([z.number().int(), z.number().int(), z.number().int(), z.number().int()])
    .nullable()
    .optional(),
  popularity: z.number().int().min(0).max(100).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { slug } = await ctx.params;

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof z.ZodError
            ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
            : "Body invalido",
      },
      { status: 400 },
    );
  }

  const update: Partial<typeof phoneModels.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.brand !== undefined) update.brand = parsed.brand;
  if (parsed.name !== undefined) update.name = parsed.name;
  if (parsed.aliases !== undefined) update.aliases = parsed.aliases;
  if (parsed.widthMm !== undefined) update.widthMm = parsed.widthMm;
  if (parsed.heightMm !== undefined) update.heightMm = parsed.heightMm;
  if (parsed.depthMm !== undefined) update.depthMm = parsed.depthMm;
  if (parsed.cornerRadiusMm !== undefined)
    update.cornerRadiusMm = parsed.cornerRadiusMm;
  if (parsed.popularity !== undefined) update.popularity = parsed.popularity;
  if (parsed.active !== undefined) update.active = parsed.active;
  if (parsed.camera !== undefined) {
    if (parsed.camera === null) {
      update.cameraX = null;
      update.cameraY = null;
      update.cameraW = null;
      update.cameraH = null;
    } else {
      update.cameraX = parsed.camera[0];
      update.cameraY = parsed.camera[1];
      update.cameraW = parsed.camera[2];
      update.cameraH = parsed.camera[3];
    }
  }

  const [updated] = await db
    .update(phoneModels)
    .set(update)
    .where(eq(phoneModels.slug, slug))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: `Modelo "${slug}" no encontrado` },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, model: updated });
}
