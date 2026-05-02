import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";

/**
 * Protege todas las rutas /admin/* salvo /admin/login. Si la cookie de
 * sesion es invalida o no existe, redirige a /admin/login con `next` query
 * para volver al destino original despues del login.
 *
 * NO ejecuta sobre /api/admin/login (ese setea la cookie). Si fuera, dejas
 * al usuario sin forma de autenticarse.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip login page itself
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (verifySessionToken(token)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
