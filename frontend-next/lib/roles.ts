// Central role model for the portal.
//
// MOCK-ONLY for now: the current role is held in a cookie (`tpc-role`) that the
// RoleProvider writes and the dev RoleSwitcher flips. proxy.ts and the root
// layout read the same cookie so the role is known server-side on first paint.
//
// When real auth lands, replace the cookie read with the authenticated user's
// role — ROUTE_ACCESS, DEFAULT_DASHBOARD and the sidebar role tags stay as-is.

export const ROLES = [
  "student",
  "company",
  "coordinator",
  "admin",
  "super-admin",
] as const;

export type Role = (typeof ROLES)[number];

/** Cookie the RoleProvider writes and proxy.ts / the root layout read. */
export const ROLE_COOKIE = "tpc-role";

/** Role assumed when no cookie is present (first visit / logged-out). */
export const DEFAULT_ROLE: Role = "student";

export function isRole(value: string | undefined | null): value is Role {
  return !!value && (ROLES as readonly string[]).includes(value);
}

export interface RoleMeta {
  label: string;
  /** Material Symbols icon name. */
  icon: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  student: { label: "Student", icon: "school" },
  company: { label: "Recruiter", icon: "business_center" },
  coordinator: { label: "Coordinator", icon: "badge" },
  admin: { label: "Admin", icon: "admin_panel_settings" },
  "super-admin": { label: "Super Admin", icon: "shield_person" },
};

/** Where each role lands after login / a role switch. */
export const DEFAULT_DASHBOARD: Record<Role, string> = {
  student: "/student-dashboard",
  company: "/company-dashboard",
  coordinator: "/coordinator-dashboard",
  admin: "/admin-dashboard",
  "super-admin": "/super-admin-dashboard",
};

const ALL_ROLES: readonly Role[] = ROLES;

interface RouteRule {
  /** Path prefix; matches the exact path or any sub-path. */
  prefix: string;
  roles: readonly Role[];
}

/** Which roles may view each portal route. First matching rule wins, so list
 *  more-specific prefixes before their parents if any ever nest. */
const STAFF: readonly Role[] = ["coordinator", "admin", "super-admin"];
const ADMINS: readonly Role[] = ["admin", "super-admin"];

export const ROUTE_ACCESS: RouteRule[] = [
  // Student
  { prefix: "/student-dashboard", roles: ["student"] },
  { prefix: "/my-profile", roles: ["student"] },
  { prefix: "/drive-catalogue", roles: ["student", "coordinator", "admin", "super-admin"] },

  // Company
  { prefix: "/company-dashboard", roles: ["company"] },
  { prefix: "/jaf", roles: ["company", "coordinator", "admin", "super-admin"] },
  { prefix: "/logistics", roles: ["company"] },

  // Coordinator
  { prefix: "/coordinator-dashboard", roles: STAFF },
  { prefix: "/add-drive", roles: STAFF },
  { prefix: "/drive-workspace", roles: STAFF },
  { prefix: "/student-profiles", roles: STAFF },

  // Admin
  { prefix: "/admin-dashboard", roles: ADMINS },
  { prefix: "/credit-management", roles: ADMINS },
  { prefix: "/manage-companies", roles: ADMINS },
  { prefix: "/company-contacts", roles: ADMINS },

  // Super admin
  { prefix: "/super-admin-dashboard", roles: ADMINS },
  { prefix: "/user-management", roles: ["super-admin"] },
  { prefix: "/audit-log", roles: ["super-admin"] },
  { prefix: "/global-export", roles: ["super-admin"] },

  // Shared
  { prefix: "/calendar", roles: ALL_ROLES },
  { prefix: "/notifications", roles: ALL_ROLES },
];

/** True when `role` may view `pathname`. Unlisted routes are open (fail-open)
 *  so newly-scaffolded pages aren't accidentally blocked before they get a
 *  rule — add a ROUTE_ACCESS entry as each new portal page lands. */
export function canAccess(role: Role, pathname: string): boolean {
  const rule = ROUTE_ACCESS.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  return rule ? rule.roles.includes(role) : true;
}
