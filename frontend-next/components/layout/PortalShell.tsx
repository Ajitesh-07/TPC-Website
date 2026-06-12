"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import RoleSwitcher from "@/components/layout/RoleSwitcher";
import { useRole } from "@/components/providers/RoleProvider";
import { canAccess, DEFAULT_DASHBOARD } from "@/lib/roles";

/**
 * Portal chrome: the fixed Sidebar plus a mobile top bar that opens it as an
 * off-canvas drawer. Holds the drawer open/close state so the layout file can
 * stay a thin server component and pages render inside `<main>`.
 */
export default function PortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, sessionStatus } = useRole();
  const pathname = usePathname();
  const router = useRouter();

  // Client-side backstop to proxy.ts. The portal requires a real session in all
  // environments: a guest (no/invalid session — e.g. an expired cookie that
  // passed proxy.ts but failed /api/me) is sent to the landing page to sign in.
  // An authenticated user on a page their role can't see is bounced to their
  // own dashboard.
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "guest") {
      router.replace("/#portal-access");
      return;
    }
    if (!canAccess(role, pathname)) {
      router.replace(DEFAULT_DASHBOARD[role]);
    }
  }, [role, pathname, router, sessionStatus]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 md:ml-[260px] h-full">
        {/* Mobile top bar (the only way to reach the sidebar on small screens) */}
        <header className="md:hidden flex items-center gap-3 h-14 px-gutter-mobile border-b border-surface-border bg-surface shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            className="p-2 -ml-2 text-text-primary"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-navy-vibrant text-[22px]">
              school
            </span>
            <span className="text-title-md font-title-md font-bold text-navy-vibrant">
              IIT Patna Portal
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Dev-only mock login / role switcher. */}
      <RoleSwitcher />
    </div>
  );
}
