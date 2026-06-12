"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "@/data/navigation";
import { useRole } from "@/components/providers/RoleProvider";

// Role-specific primary CTA shown above the footer. Roles without an entry
// (e.g. students just browse) get no CTA.
const ROLE_CTA: Partial<Record<string, { label: string; href: string }>> = {
  company: { label: "New Announcement", href: "/jaf" },
  coordinator: { label: "Add Drive", href: "/jaf" },
};

interface SidebarProps {
  /** Whether the off-canvas drawer is open on mobile. */
  mobileOpen?: boolean;
  /** Called to close the mobile drawer (overlay tap / nav / close button). */
  onClose?: () => void;
}

const Sidebar = ({ mobileOpen = false, onClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { role } = useRole();

  // Only show nav items this role is meant to see.
  const items = SIDEBAR_ITEMS.filter((item) => item.roles.includes(role));
  const cta = ROLE_CTA[role];

  // `collapsed` is a desktop-only affordance. Its visual effects are gated
  // behind `md:` so the mobile drawer always shows the full, labelled sidebar
  // regardless of the desktop collapse state.
  const labelHidden = collapsed ? "md:hidden" : "";
  const itemPadding = collapsed ? "px-4 md:justify-center md:px-0" : "px-4";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <nav
        className={cn(
          "fixed left-0 top-0 h-full z-50 flex flex-col bg-surface-container-low text-on-surface p-4 border-r border-surface-border",
          "w-[260px] transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:transition-all md:duration-300",
          collapsed ? "md:w-[80px]" : "md:w-[260px]"
        )}
      >
        {/* Header / Logo */}
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden shrink-0">
            <span className="material-symbols-outlined text-navy-vibrant text-[24px]">
              school
            </span>
          </div>
          <div className={cn("logo-text overflow-hidden whitespace-nowrap", labelHidden)}>
            <h1 className="text-title-lg font-title-lg font-bold text-gold-leaf truncate">
              IIT Patna Portal
            </h1>
            <p className="text-label-sm font-label-sm text-on-primary-fixed-variant uppercase tracking-wider truncate">
              Centre for Career Development &amp; Counselling
            </p>
          </div>
          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="ml-auto p-1 text-on-surface-variant hover:text-primary md:hidden"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-2 overflow-x-hidden">
          {items.map((item) => {
            // A real route is active when it matches the current path (exactly
            // or as a parent segment). Placeholder "#" links are never active.
            const isActive =
              item.href !== "#" &&
              (pathname === item.href || pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "nav-link flex items-center gap-3 py-3 transition-all rounded-xl",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-variant group",
                  itemPadding
                )}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className={cn("text-label-md font-label-md nav-text", labelHidden)}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* CTA & footer tabs */}
        <div className="mt-4 pt-4 border-t border-on-primary-fixed-variant/30 space-y-2">
          {cta && (
            <Link
              href={cta.href}
              onClick={onClose}
              className={cn(
                "w-full btn-gradient text-on-primary rounded-xl py-3 px-4 mb-6 text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2",
                labelHidden
              )}
            >
              {cta.label}
            </Link>
          )}
          <div className="pt-2">
            <Link
              href="#"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 text-on-primary-fixed-variant py-2 hover:bg-primary-container transition-all duration-200 rounded-xl group",
                itemPadding
              )}
            >
              <span className="material-symbols-outlined text-[20px] group-hover:text-primary-fixed">
                help
              </span>
              <span className={cn("text-label-md font-label-md group-hover:text-primary-fixed", labelHidden)}>
                Support
              </span>
            </Link>
            <Link
              href="/"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 text-on-primary-fixed-variant py-2 hover:bg-primary-container transition-all duration-200 rounded-xl group",
                itemPadding
              )}
            >
              <span className="material-symbols-outlined text-[20px] group-hover:text-error-container">
                logout
              </span>
              <span className={cn("text-label-md font-label-md group-hover:text-error-container", labelHidden)}>
                Logout
              </span>
            </Link>
          </div>
        </div>

        {/* Desktop collapse toggle (collapse is a desktop-only affordance) */}
        <div className="mt-auto pt-4 hidden md:block">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-3 text-on-surface-variant p-3 hover:bg-surface-variant rounded-xl transition-all"
          >
            <span className="material-symbols-outlined">
              {collapsed ? "menu" : "menu_open"}
            </span>
            <span className={cn("text-label-md font-label-md nav-text", labelHidden)}>
              Collapse
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
