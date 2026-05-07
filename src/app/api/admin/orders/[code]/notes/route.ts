import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  adminNotes: z.string().max(2000),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = await ctx.params;

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const value = parsed.adminNotes.trim();

  const result = await db
    .update(orders)
    .set({
      adminNotes: value.length === 0 ? null : value,
      updatedAt: new Date(),
    })
    .where(eq(orders.code, code))
    .returning({ id: orders.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
