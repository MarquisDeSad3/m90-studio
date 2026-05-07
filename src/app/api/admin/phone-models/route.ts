import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { phoneModels } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9](-?[a-z0-9])*$/;

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

const Body = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(SLUG_RE, "slug solo letras minúsculas, números y guiones"),
  brand: z.enum(PHONE_BRANDS),
  name: z.string().min(2).max(80),
  aliases: z.array(z.string().min(1).max(60)).default([]),
  widthMm: z.number().int().min(40).max(120),
  heightMm: z.number().int().min(80).max(220),
  depthMm: z.number().int().min(0).max(30),
  cornerRadiusMm: z.number().int().min(0).max(30).default(8),
  camera: z
    .tuple([z.number().int(), z.number().int(), z.number().int(), z.number().int()])
    .nullable()
    .default(null),
  popularity: z.number().int().min(0).max(100).default(0),
  active: z.boolean().default(true),
});

/** Crea un modelo nuevo. Falla con 409 si el slug ya existe. */
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof z.ZodError
            ? err.issues.map((i) => i.message).join("; ")
            : "Body invalido",
      },
      { status: 400 },
    );
  }

  try {
    const [created] = await db
      .insert(phoneModels)
      .values({
        slug: parsed.slug,
        brand: parsed.brand,
        name: parsed.name,
        aliases: parsed.aliases,
        widthMm: parsed.widthMm,
        heightMm: parsed.heightMm,
        depthMm: parsed.depthMm,
        cornerRadiusMm: parsed.cornerRadiusMm,
        cameraX: parsed.camera ? parsed.camera[0] : null,
        cameraY: parsed.camera ? parsed.camera[1] : null,
        cameraW: parsed.camera ? parsed.camera[2] : null,
        cameraH: parsed.camera ? parsed.camera[3] : null,
        popularity: parsed.popularity,
        active: parsed.active,
      })
      .returning();
    return NextResponse.json({ ok: true, model: created }, { status: 201 });
  } catch (err) {
    // Postgres unique violation
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: `Ya existe un modelo con slug "${parsed.slug}"` },
        { status: 409 },
      );
    }
    console.error("[phone-models] POST failed:", err);
    return NextResponse.json({ error: "Error creando modelo" }, { status: 500 });
  }
}
