import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coverPricing } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PutBody = z.object({
  type: z.enum(["normal", "coated"]),
  priceUsdCents: z.number().int().min(0).max(1_000_000),
  priceCup: z.number().int().min(0).max(10_000_000),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const rows = await db
    .select({
      type: coverPricing.type,
      priceUsdCents: coverPricing.priceUsdCents,
      priceCup: coverPricing.priceCup,
      updatedAt: coverPricing.updatedAt,
    })
    .from(coverPricing);
  return NextResponse.json({ rows });
}

export async function PUT(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let parsed: z.infer<typeof PutBody>;
  try {
    parsed = PutBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  // Upsert: si la fila existe la actualizamos; si no, la creamos. La tabla
  // viene seedada con ambos tipos pero el upsert es defensivo.
  await db
    .insert(coverPricing)
    .values({
      type: parsed.type,
      priceUsdCents: parsed.priceUsdCents,
      priceCup: parsed.priceCup,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: coverPricing.type,
      set: {
        priceUsdCents: parsed.priceUsdCents,
        priceCup: parsed.priceCup,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}
