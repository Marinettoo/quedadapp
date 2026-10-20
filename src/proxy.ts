import { NextResponse, type NextRequest } from "next/server";

const NOMBRE_COOKIE = "sesion";

export function proxy(request: NextRequest) {
  const tieneSesion = request.cookies.has(NOMBRE_COOKIE);

  if (!tieneSesion && request.nextUrl.pathname.startsWith("/panel")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!tieneSesion && request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/admin/:path*"],
};
