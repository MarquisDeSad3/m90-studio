import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  checkPassword,
  createSessionToken,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }
  const password = String(body.password ?? "");
  if (!checkPassword(password)) {
    // Log attempts for auditing — sin exponer si la cuenta existe.
    console.warn(
      "[admin] login failed from",
      req.headers.get("x-forwarded-for") ?? "?",
    );
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 },
    );
  }

  const { token, maxAgeSec } = createSessionToken();
  const res = NextResponse.json({ ok: true });
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
