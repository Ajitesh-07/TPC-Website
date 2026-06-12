"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { DEFAULT_ROLE, ROLE_COOKIE, type Role } from "@/lib/roles";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Persist the mock role so proxy.ts / the root layout can read it server-side
 *  on the next request. Swap this out for a real session write later. */
function writeRoleCookie(role: Role) {
  if (typeof document !== "undefined") {
    document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }
}

/**
 * Holds the current (mock) role for the whole app. `initialRole` comes from the
 * cookie read in the root layout, so the server and the first client render
 * agree — no hydration flash in the role-scoped sidebar.
 */
export function RoleProvider({
  initialRole,
  children,
}: {
  initialRole?: Role;
  children: ReactNode;
}) {
  const [role, setRoleState] = useState<Role>(initialRole ?? DEFAULT_ROLE);

  const setRole = (next: Role) => {
    writeRoleCookie(next);
    setRoleState(next);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
