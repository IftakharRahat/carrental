import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";

/** Routes that do not require authentication */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  // If user is already authenticated and tries to visit /login, redirect to dashboard
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If path is protected and user has no valid session
  if (!isPublicPath(pathname) && !session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-next-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
