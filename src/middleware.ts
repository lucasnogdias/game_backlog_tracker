import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/auth/accounts",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/setup",
]);

export function middleware(request: NextRequest) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname) || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
