import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ROLE_COOKIE,
  SESSION_COOKIE,
  DEFAULT_ROLE,
  isRole,
  isPortalRoute,
  canAccess,
  DEFAULT_DASHBOARD,
} from "@/lib/roles";

// Next.js 16 renamed the `middleware` convention to `proxy` (Node.js runtime).
// Two gates on portal routes:
//   1. No session cookie  -> guest, redirect to the landing page to sign in.
//   2. Wrong role for the route -> bounce to that role's own dashboard.
// The API independently enforces real session validity + authz on every call;
// this is UX routing only.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. A portal route with no session = guest. Send them to sign in.
  if (isPortalRoute(pathname) && !request.cookies.get(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.hash = "portal-access";
    return NextResponse.redirect(url);
  }

  // 2. Role-based route guard (role hint from the readable cookie).
  const raw = request.cookies.get(ROLE_COOKIE)?.value;
  const role = isRole(raw) ? raw : DEFAULT_ROLE;
  if (!canAccess(role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_DASHBOARD[role];
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals and static assets.
  // Route-level access is decided in code via canAccess (unlisted routes pass).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
