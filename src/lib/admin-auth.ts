import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

/**
 * Auth admin con email + password contra la tabla `admin_users`.
 *
 * Cookie format: `<adminId>.<expiresAt>.<hmac>`
 *   - hmac firma `<adminId>.<expiresAt>` con ADMIN_SESSION_SECRET
 *   - Validar: recomputar hmac, comparar timing-safe, después verificar
 *     que el admin no esté soft-deleted
 *
 * Roles:
 *   - owner: full access (crear/editar/borrar otros admins)
 *   - manager / staff: acceso al dashboard pero NO a gestión de usuarios
 *
 * Compat legacy: si `ADMIN_PASSWORD` env var existe y no hay admin con ese
 * email en DB, dejamos que la session anterior siga válida hasta que el
 * usuario cambie a credenciales reales. NO se permite login con env var.
 */

const COOKIE_NAME = "m90s_admin";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET no configurado o demasiado corto (min 16 chars)",
    );
  }
  return s;
}

function signValue(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

/* ============================================================
   PASSWORD HASHING
   ============================================================ */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/* ============================================================
   LOGIN — verificar credenciales y devolver el admin
   ============================================================ */

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "staff";
};

/** Verifica email+password contra DB. Devuelve null si no hay match. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedAdmin | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      passwordHash: adminUsers.passwordHash,
      deletedAt: adminUsers.deletedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  if (!user || user.deletedAt) return null;
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "owner" | "manager" | "staff",
  };
}

/* ============================================================
   SESSION TOKEN — firmado con HMAC + verifica admin sigue vivo
   ============================================================ */

export function createSessionToken(adminId: string): {
  token: string;
  cookieName: string;
  maxAgeSec: number;
} {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${adminId}.${expiresAt}`;
  const sig = signValue(payload);
  return {
    token: `${payload}.${sig}`,
    cookieName: COOKIE_NAME,
    maxAgeSec: Math.floor(SESSION_DURATION_MS / 1000),
  };
}

/** Parse + verify HMAC. NO toca DB — solo cripto. */
function parseTokenSignature(
  token: string | undefined,
): { adminId: string; exp: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [adminId, expStr, sig] = parts;
  if (!adminId || !expStr || !sig) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = signValue(`${adminId}.${expStr}`);
  if (sig.length !== expected.length) return null;
  try {
    if (
      !timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return { adminId, exp };
}

/** Devuelve el admin actual si la cookie es válida + el admin existe + no
    está borrado. null si cualquier check falla. */
export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const parsed = parseTokenSignature(token);
  if (!parsed) return null;

  const [user] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
    })
    .from(adminUsers)
    .where(
      and(eq(adminUsers.id, parsed.adminId), isNull(adminUsers.deletedAt)),
    )
    .limit(1);

  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "owner" | "manager" | "staff",
  };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const admin = await getCurrentAdmin();
  return admin !== null;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
