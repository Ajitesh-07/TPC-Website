import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ROLE_COOKIE,
  DEFAULT_ROLE,
  isRole,
  canAccess,
  DEFAULT_DASHBOARD,
} from "@/lib/roles";

// Next.js 16 renamed the `middleware` convention to `proxy` (Node.js runtime).
// Gate portal routes by the mock role cookie: a role visiting a page it isn't
// allowed to see is bounced to its own dashboard. Replace the cookie read with
// the authenticated session role once real auth exists.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
