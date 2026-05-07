import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { getCurrentAdmin, hashPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateBody = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
  role: z.enum(["owner", "manager", "staff"]).default("staff"),
});

/** GET — lista todos los admin users (sin password_hash). Solo owner. */
export async function GET() {
  const me = await getCurrentAdmin();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (me.role !== "owner") {
    return NextResponse.json(
      { error: "Solo los owners pueden ver la lista de usuarios" },
      { status: 403 },
    );
  }

  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      lastLoginAt: adminUsers.lastLoginAt,
      deletedAt: adminUsers.deletedAt,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));

  return NextResponse.json({ rows });
}

/** POST — crear nuevo admin. Solo owner. */
export async function POST(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (me.role !== "owner") {
    return NextResponse.json(
      { error: "Solo los owners pueden crear usuarios" },
      { status: 403 },
    );
  }

  let parsed: z.infer<typeof CreateBody>;
  try {
    parsed = CreateBody.parse(await req.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? "invalido"
        : "invalido";
    return NextResponse.json(
      { error: `Datos inválidos: ${msg}` },
      { status: 400 },
    );
  }

  const email = parsed.email.trim().toLowerCase();

  // ¿Ya existe (incluyendo soft-deleted)?
  const [existing] = await db
    .select({ id: adminUsers.id, deletedAt: adminUsers.deletedAt })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  const passwordHash = await hashPassword(parsed.password);

  if (existing) {
    if (!existing.deletedAt) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 },
      );
    }
    // Reactivar soft-deleted con nuevos datos
    await db
      .update(adminUsers)
      .set({
        name: parsed.name,
        passwordHash,
        role: parsed.role,
        deletedAt: null,
      })
      .where(eq(adminUsers.id, existing.id));
    return NextResponse.json({ ok: true, reactivated: true });
  }

  await db.insert(adminUsers).values({
    email,
    name: parsed.name,
    passwordHash,
    role: parsed.role,
  });

  return NextResponse.json({ ok: true });
}
