"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole } from "@/components/providers/RoleProvider";
import { ROLES, ROLE_META, DEFAULT_DASHBOARD, type Role } from "@/lib/roles";

/**
 * DEV-ONLY mock login. Stands in for real authentication: flipping the role
 * rewrites the cookie and drops you on that role's dashboard so the scoped
 * sidebar + route guards can be demoed. Remove once real auth lands.
 */
const RoleSwitcher = () => {
  const { role, setRole } = useRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const choose = (next: Role) => {
    setRole(next);
    setOpen(false);
    router.push(DEFAULT_DASHBOARD[next]);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col items-start gap-2">
      {open && (
        <div className="w-60 glass-panel rounded-xl p-2 elevation-2 animate-fadeIn">
          <p className="px-3 pt-1 pb-2 text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
            View portal as
          </p>
          <div className="space-y-1">
            {ROLES.map((r) => {
              const active = r === role;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => choose(r)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant hover:bg-surface-variant"
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {ROLE_META[r].icon}
                  </span>
                  <span className="text-label-md font-label-md">
                    {ROLE_META[r].label}
                  </span>
                  {active && (
                    <span className="material-symbols-outlined ml-auto text-[18px]">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch role (dev)"
        className="flex items-center gap-2 btn-gradient text-on-primary rounded-full pl-4 pr-5 py-3 shadow-lg hover-lift"
      >
        <span className="material-symbols-outlined text-[20px]">
          {ROLE_META[role].icon}
        </span>
        <span className="text-label-md font-label-md hidden sm:inline">
          {ROLE_META[role].label}
        </span>
        <span className="material-symbols-outlined text-[18px]">
          unfold_more
        </span>
      </button>
    </div>
  );
};

export default RoleSwitcher;
