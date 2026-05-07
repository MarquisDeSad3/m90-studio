import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders, orderEvents } from "@/lib/db/schema";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_VALUES = [
  "draft",
  "submitted",
  "confirmed",
  "in_production",
  "ready",
  "delivered",
  "cancelled",
] as const;

const Body = z.object({
  status: z.enum(STATUS_VALUES),
  note: z.string().max(500).optional(),
});

type Status = (typeof STATUS_VALUES)[number];

/** Restricciones de transición. Mantiene la coherencia operativa: no se puede
    saltar de "submitted" a "delivered" sin pasar por producción, etc. */
const ALLOWED: Record<Status, Status[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled"],
  in_production: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  delivered: [],
  cancelled: ["submitted"],
};

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

  const [current] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.code, code))
    .limit(1);

  if (!current) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const from = current.status as Status;
  const to = parsed.status;

  if (from === to) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  if (!ALLOWED[from].includes(to)) {
    return NextResponse.json(
      { error: `Transicion ${from} -> ${to} no permitida` },
      { status: 400 },
    );
  }

  const now = new Date();
  const update: Partial<typeof orders.$inferInsert> = {
    status: to,
    updatedAt: now,
  };
  if (to === "confirmed") update.confirmedAt = now;
  if (to === "delivered") update.deliveredAt = now;

  await db.transaction(async (tx) => {
    await tx.update(orders).set(update).where(eq(orders.id, current.id));
    await tx.insert(orderEvents).values({
      orderId: current.id,
      fromStatus: from,
      toStatus: to,
      note: parsed.note ?? null,
      actor: "admin",
    });
  });

  return NextResponse.json({ ok: true, status: to });
}
