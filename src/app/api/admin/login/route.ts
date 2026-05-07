import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  verifyCredentials,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Email o contraseña inválidos" },
      { status: 400 },
    );
  }

  const admin = await verifyCredentials(parsed.email, parsed.password);
  if (!admin) {
    console.warn(
      "[admin] login failed for",
      parsed.email,
      "from",
      req.headers.get("x-forwarded-for") ?? "?",
    );
    return NextResponse.json(
      { error: "Email o contraseña incorrectos" },
      { status: 401 },
    );
  }

  // Update last_login_at (best effort)
  db.update(adminUsers)
    .set({ lastLoginAt: sql`now()` })
    .where(eq(adminUsers.id, admin.id))
    .catch((err) => console.warn("[admin] lastLoginAt update failed:", err));

  const { token, maxAgeSec } = createSessionToken(admin.id);
  const res = NextResponse.json({
    ok: true,
    admin: { name: admin.name, role: admin.role, email: admin.email },
  });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
  return res;
}
