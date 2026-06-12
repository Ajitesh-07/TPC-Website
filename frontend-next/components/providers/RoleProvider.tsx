"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_ROLE, ROLE_COOKIE, isRole, type Role } from "@/lib/roles";
import { apiFetch, ApiError } from "@/lib/api";
import type { ApiRole, MeResponse } from "@/lib/api-types";

export type SessionStatus = "loading" | "authed" | "guest";

interface RoleContextValue {
  role: Role;
  /** Dev-only mock switcher; ignored once a real session exists. */
  setRole: (role: Role) => void;
  /** Real session info (null until /api/me resolves). */
  user: MeResponse["user"] | null;
  profile: MeResponse["profile"];
  sessionStatus: SessionStatus;
  signOut: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** API role slug (super_admin) → frontend slug (super-admin). */
const fromApiRole = (role: ApiRole): Role => role.replace(/_/g, "-") as Role;

function writeRoleCookie(role: Role) {
  if (typeof document !== "undefined") {
    document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }
}

/**
 * Single source of truth for "who is using the portal".
 * On mount it asks the backend (/api/me): a real session wins and the role
 * cookie is synced so the Next route guard (proxy.ts) agrees. Without a session
 * (guest) the mock cookie role keeps working so the portal stays demoable in
 * dev; `initialRole` comes from that cookie via the root layout.
 */
export function RoleProvider({
  initialRole,
  children,
}: {
  initialRole?: Role;
  children: ReactNode;
}) {
  const [role, setRoleState] = useState<Role>(initialRole ?? DEFAULT_ROLE);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [profile, setProfile] = useState<MeResponse["profile"]>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    apiFetch<MeResponse>("/api/me")
      .then((me) => {
        if (cancelled) return;
        const mapped = fromApiRole(me.user.role);
        setUser(me.user);
        setProfile(me.profile);
        setSessionStatus("authed");
        if (isRole(mapped)) {
          setRoleState(mapped);
          writeRoleCookie(mapped);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSessionStatus("guest");
        if (!(err instanceof ApiError && err.status === 401)) {
          // API unreachable — stay in guest/mock mode silently (dev).
          console.warn("[auth] /api/me unavailable; using mock role");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setRole = (next: Role) => {
    // Mock switcher only — a real session's role always wins.
    if (sessionStatus === "authed") return;
    writeRoleCookie(next);
    setRoleState(next);
  };

  const signOut = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Even if the API call fails, fall through to clearing local state.
    }
    setUser(null);
    setProfile(null);
    setSessionStatus("guest");
    setRoleState(DEFAULT_ROLE);
    writeRoleCookie(DEFAULT_ROLE);
  };

  return (
    <RoleContext.Provider
      value={{ role, setRole, user, profile, sessionStatus, signOut }}
    >
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
