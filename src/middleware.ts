import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege /admin/* con cookie firmada HMAC. Middleware corre en Edge Runtime
 * (sin node:crypto), asi que usamos Web Crypto SubtleCrypto. La auth para
 * API routes (que generan la cookie) usa node:crypto en lib/admin-auth.ts.
 */

const COOKIE_NAME = "m90s_admin";

const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) return new Uint8Array(0);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Token format: `<adminId>.<expiresAt>.<sig>` donde sig firma
 *  `<adminId>.<expiresAt>` con ADMIN_SESSION_SECRET. Validamos solo la
 *  firma; la verificación de que el admin sigue vivo (no soft-deleted)
 *  ocurre en el server component / API route, ya que el middleware
 *  corre en Edge sin acceso a DB. */
async function verifyToken(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [adminId, expStr, sig] = parts;
  if (!adminId || !expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  try {
    const key = await importKey(secret);
    const sigBytes = hexToBytes(sig);
    if (sigBytes.length === 0) return false;
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as BufferSource,
      encoder.encode(`${adminId}.${expStr}`),
    );
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login se ve sin auth
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = await verifyToken(token, secret);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
