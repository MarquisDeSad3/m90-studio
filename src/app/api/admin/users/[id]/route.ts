import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, isNull, ne, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCurrentAdmin, hashPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.enum(["owner", "manager", "staff"]).optional(),
  password: z.string().min(8).max(200).optional(),
});

/** Cuenta cuántos owners hay activos (no soft-deleted). Para evitar dejar
    el sistema sin ningún owner. */
async function countActiveOwners(excludeId?: string): Promise<number> {
  const conditions = [
    eq(adminUsers.role, "owner"),
    isNull(adminUsers.deletedAt),
  ];
  if (excludeId) conditions.push(ne(adminUsers.id, excludeId));
  const [r] = await db
    .select({ n: count() })
    .from(adminUsers)
    .where(and(...conditions));
  return r?.n ?? 0;
}

/** PATCH — editar admin. Solo owner. */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentAdmin();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (me.role !== "owner") {
    return NextResponse.json(
      { error: "Solo los owners pueden editar usuarios" },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;

  let parsed: z.infer<typeof PatchBody>;
  try {
    parsed = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const [target] = await db
    .select({
      id: adminUsers.id,
      role: adminUsers.role,
      deletedAt: adminUsers.deletedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Si está bajando role del último owner activo, abortar
  if (
    parsed.role &&
    parsed.role !== "owner" &&
    target.role === "owner"
  ) {
    const otherOwners = await countActiveOwners(target.id);
    if (otherOwners === 0) {
      return NextResponse.json(
        { error: "No podés quitarle el rol al último owner" },
        { status: 400 },
      );
    }
  }

  const update: Partial<typeof adminUsers.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.name !== undefined) update.name = parsed.name;
  if (parsed.role !== undefined) update.role = parsed.role;
  if (parsed.password !== undefined) {
    update.passwordHash = await hashPassword(parsed.password);
  }

  await db.update(adminUsers).set(update).where(eq(adminUsers.id, id));
  return NextResponse.json({ ok: true });
}

/** DELETE — soft delete. Solo owner. No podés borrarte a vos mismo ni al
    último owner. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentAdmin();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (me.role !== "owner") {
    return NextResponse.json(
      { error: "Solo los owners pueden borrar usuarios" },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;

  if (id === me.id) {
    return NextResponse.json(
      { error: "No podés borrarte a vos mismo" },
      { status: 400 },
    );
  }

  const [target] = await db
    .select({
      id: adminUsers.id,
      role: adminUsers.role,
      deletedAt: adminUsers.deletedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (target.role === "owner") {
    const otherOwners = await countActiveOwners(target.id);
    if (otherOwners === 0) {
      return NextResponse.json(
        { error: "No podés borrar al último owner" },
        { status: 400 },
      );
    }
  }

  await db
    .update(adminUsers)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(adminUsers.id, id));
  return NextResponse.json({ ok: true });
}
