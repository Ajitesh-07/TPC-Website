"use client";

import { useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  AUDIT_LOGS,
  AUDIT_FILTERS,
  AUDIT_TYPE_TONE,
  AUDIT_TYPE_ICON,
  type AuditEntry,
  type AuditType,
} from "@/data/audit-log";
import { cn } from "@/lib/utils";

const TODAY = "2026-06-12";

// Distinct actor roles for the secondary filter (sorted, "all" prepended).
const ACTOR_ROLES = ["all", ...Array.from(new Set(AUDIT_LOGS.map((l) => l.actorRole))).sort()];

// Deterministic avatar tone per actor role, drawn from the design tokens.
const ROLE_AVATAR: Record<string, string> = {
  "Super Admin": "bg-primary-fixed text-primary",
  Admin: "bg-secondary-fixed text-on-secondary-fixed",
  Coordinator: "bg-tertiary-fixed text-on-tertiary-fixed",
};

const splitTimestamp = (ts: string) => {
  const [date, time] = ts.split(" ");
  return { date, time };
};

const COLUMNS: Column<AuditEntry>[] = [
  {
    header: "Timestamp",
    className: "py-3 px-4 whitespace-nowrap",
    render: (r) => {
      const { date, time } = splitTimestamp(r.timestamp);
      return (
        <>
          <div className="text-body-md font-body-md text-on-surface">{date}</div>
          <div className="text-label-sm font-label-sm text-text-secondary font-mono">{time}</div>
        </>
      );
    },
  },
  {
    header: "Actor",
    className: "py-3 px-4",
    render: (r) => (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-label-sm font-bold shrink-0",
            ROLE_AVATAR[r.actorRole] ?? "bg-surface-variant text-text-secondary"
          )}
        >
          {r.actorInitials}
        </div>
        <div className="min-w-0">
          <div className="text-body-md font-body-md text-on-surface truncate">{r.actorName}</div>
          <div className="text-label-sm font-label-sm text-text-secondary truncate">{r.actorRole}</div>
        </div>
      </div>
    ),
  },
  {
    header: "Action Type",
    className: "py-3 px-4 whitespace-nowrap",
    render: (r) => (
      <StatusBadge tone={AUDIT_TYPE_TONE[r.type]} icon={AUDIT_TYPE_ICON[r.type]}>
        {r.type}
      </StatusBadge>
    ),
  },
  {
    header: "Target",
    className: "py-3 px-4",
    render: (r) => <span className="text-body-md font-body-md text-on-surface">{r.target}</span>,
  },
  {
    header: "Details",
    className: "py-3 px-4 max-w-sm",
    render: (r) => <span className="text-label-md font-label-md text-text-secondary">{r.details}</span>,
  },
  {
    header: "Source",
    headerClassName: "text-right",
    className: "py-3 px-4 text-right whitespace-nowrap",
    render: (r) => (
      <span className="text-label-sm font-label-sm text-text-secondary font-mono">{r.source ?? "—"}</span>
    ),
  },
];

const AuditLogPage = () => {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<AuditType | "all">("all");
  const [activeRole, setActiveRole] = useState<string>("all");

  const visibleLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AUDIT_LOGS.filter((l) => (activeType === "all" ? true : l.type === activeType))
      .filter((l) => (activeRole === "all" ? true : l.actorRole === activeRole))
      .filter(
        (l) =>
          !q ||
          l.actorName.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q)
      );
  }, [query, activeType, activeRole]);

  // Summary stats (computed off the full log, not the filtered view).
  const stats = useMemo(() => {
    const total = AUDIT_LOGS.length;
    const exportsToday = AUDIT_LOGS.filter(
      (l) => l.type === "Export" && l.timestamp.startsWith(TODAY)
    ).length;
    const roleChanges = AUDIT_LOGS.filter((l) => l.type === "Role Change").length;
    const policyActions = AUDIT_LOGS.filter((l) => l.type === "Policy").length;
    return { total, exportsToday, roleChanges, policyActions };
  }, []);

  const summaryTiles: { label: string; value: number; icon: string; iconClassName: string }[] = [
    { label: "Total Events", value: stats.total, icon: "list_alt", iconClassName: "text-primary" },
    { label: "Exports Today", value: stats.exportsToday, icon: "download", iconClassName: "text-navy-vibrant" },
    { label: "Role Changes", value: stats.roleChanges, icon: "manage_accounts", iconClassName: "text-on-secondary-fixed" },
    { label: "Policy Actions", value: stats.policyActions, icon: "policy", iconClassName: "text-status-error" },
  ];

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/80 backdrop-blur-md px-gutter-mobile md:px-gutter-desktop py-4">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-headline-md font-headline-md text-text-primary">Audit Security Log</h2>
              <span className="inline-flex items-center gap-1 bg-surface-variant text-text-secondary px-2 py-0.5 rounded-full text-label-sm font-label-sm">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Read-only
              </span>
            </div>
            <p className="text-body-md font-body-md text-text-secondary mt-1">
              Read-only record of every data edit, export, and admin action.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              placeholder="Search by actor or target..."
              type="text"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 max-w-container-max mx-auto w-full animate-fadeIn">
        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryTiles.map((tile) => (
            <div
              key={tile.label}
              className="bg-surface-container-lowest border border-surface-border rounded-xl p-4 elevation-1 flex items-center gap-4 hover-lift"
            >
              <div className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <span className={cn("material-symbols-outlined", tile.iconClassName)}>{tile.icon}</span>
              </div>
              <div>
                <div className="text-headline-md font-headline-md text-text-primary leading-none">
                  {tile.value}
                </div>
                <div className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mt-1">
                  {tile.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          {/* Action type pills */}
          <div className="bg-surface-container-low p-1 rounded-xl inline-flex flex-wrap gap-1">
            {AUDIT_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveType(f.key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-label-md font-label-md transition-all",
                  activeType === f.key
                    ? "bg-surface shadow-sm text-primary"
                    : "text-text-secondary hover:text-on-surface"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Actor role select */}
          <div className="flex items-center gap-2 text-body-md font-body-md text-text-secondary w-full lg:w-auto justify-end">
            <span>Actor role:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="bg-surface-container-low border border-surface-border rounded-lg px-3 py-2 text-label-md font-label-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              {ACTOR_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role === "all" ? "All roles" : role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Log table */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
          {visibleLogs.length === 0 ? (
            <div className="text-center py-24 text-text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">search_off</span>
              <p className="text-title-md font-title-md">No log entries match your filters</p>
            </div>
          ) : (
            <DataTable
              columns={COLUMNS}
              rows={visibleLogs}
              wrapperClassName="custom-scrollbar"
              theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
              thClassName="py-3 px-4 font-semibold border-b border-surface-border text-left"
              rowClassName={() =>
                "border-b border-surface-border last:border-0 hover:bg-surface-container-low transition-colors align-top"
              }
            />
          )}
        </div>

        {/* Footer note */}
        <div className="mt-4 flex items-center gap-2 text-label-sm font-label-sm text-text-secondary">
          <span className="material-symbols-outlined text-[16px]">info</span>
          Showing {visibleLogs.length} of {AUDIT_LOGS.length} entries · newest first · entries are immutable.
        </div>
      </div>
    </>
  );
};

export default AuditLogPage;
