import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Auth admin minimo para el MVP: una sola password compartida
 * (ADMIN_PASSWORD env var) y una cookie firmada con HMAC para mantener
 * la sesion. Sin DB de admins ni multi-tenant — si M90 necesita varios
 * usuarios admin, migramos a la tabla adminUsers/adminSessions del schema.
 *
 * Cookie format: `<expiresAt>.<hmac>` donde hmac firma `<expiresAt>` con
 * ADMIN_SESSION_SECRET. Validar = recomputar hmac y comparar timing-safe.
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

export function getAdminPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) {
    throw new Error("ADMIN_PASSWORD no configurado");
  }
  return p;
}

export function checkPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (input.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
  } catch {
    return false;
  }
}

function signValue(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(): {
  token: string;
  cookieName: string;
  maxAgeSec: number;
} {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const sig = signValue(String(expiresAt));
  return {
    token: `${expiresAt}.${sig}`,
    cookieName: COOKIE_NAME,
    maxAgeSec: Math.floor(SESSION_DURATION_MS / 1000),
  };
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = signValue(expStr);
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
