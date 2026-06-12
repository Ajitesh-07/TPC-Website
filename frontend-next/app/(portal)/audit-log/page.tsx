"use client";

import { useEffect, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { useAuditLog, useAuditSummary } from "@/lib/hooks";
import type { ApiRole, AuditActionApi, AuditEntry } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

// ---------- local mappers (API enums → display) ----------

/** Each API action mapped to a StatusBadge tone for colour-coding. */
const ACTION_TONE: Record<AuditActionApi, BadgeTone> = {
  data_edit: "warning",
  export: "info",
  role_change: "shortlisted",
  login: "neutral",
  logout: "neutral",
  policy: "error",
  approval: "success",
  credit_adjustment: "assessment",
  upload: "timeline",
  other: "applied",
};

/** Material Symbols icon per API action (used in the table chip). */
const ACTION_ICON: Record<AuditActionApi, string> = {
  data_edit: "edit_note",
  export: "download",
  role_change: "manage_accounts",
  login: "login",
  logout: "logout",
  policy: "policy",
  approval: "task_alt",
  credit_adjustment: "toll",
  upload: "upload",
  other: "more_horiz",
};

/** Human-readable label per API action. */
const ACTION_LABEL: Record<AuditActionApi, string> = {
  data_edit: "Data Edit",
  export: "Export",
  role_change: "Role Change",
  login: "Login",
  logout: "Logout",
  policy: "Policy",
  approval: "Approval",
  credit_adjustment: "Credit Adjustment",
  upload: "Upload",
  other: "Other",
};

// Action-type filter pills: UI labels → API action enum ("all" = no filter).
const ACTION_FILTERS: { key: AuditActionApi | "all"; label: string }[] = [
  { key: "all", label: "All Actions" },
  { key: "data_edit", label: "Data Edit" },
  { key: "export", label: "Export" },
  { key: "role_change", label: "Role Change" },
  { key: "login", label: "Login" },
  { key: "policy", label: "Policy" },
  { key: "approval", label: "Approval" },
  { key: "credit_adjustment", label: "Credit" },
];

const ROLE_LABEL: Record<ApiRole, string> = {
  student: "Student",
  company: "Company",
  coordinator: "Coordinator",
  admin: "Admin",
  super_admin: "Super Admin",
};

// Actor-role select options ("all" prepended).
const ROLE_FILTERS: { key: ApiRole | "all"; label: string }[] = [
  { key: "all", label: "All roles" },
  { key: "student", label: "Student" },
  { key: "company", label: "Company" },
  { key: "coordinator", label: "Coordinator" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super Admin" },
];

// Deterministic avatar tone per actor role, drawn from the design tokens.
const ROLE_AVATAR: Partial<Record<ApiRole, string>> = {
  super_admin: "bg-primary-fixed text-primary",
  admin: "bg-secondary-fixed text-on-secondary-fixed",
  coordinator: "bg-tertiary-fixed text-on-tertiary-fixed",
};

const roleLabel = (role: ApiRole | null): string =>
  role ? ROLE_LABEL[role] : "System";

/** Initials from an actor name, e.g. "Priya Nair" → "PN". */
const initials = (name: string | null): string => {
  if (!name) return "SY";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SY";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Split an ISO timestamp into a "Oct 15, 2024" date + a "14:32" time. */
const splitTimestamp = (iso: string): { date: string; time: string } => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
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
            (r.actorRole && ROLE_AVATAR[r.actorRole]) ?? "bg-surface-variant text-text-secondary"
          )}
        >
          {initials(r.actorName)}
        </div>
        <div className="min-w-0">
          <div className="text-body-md font-body-md text-on-surface truncate">{r.actorName ?? "System"}</div>
          <div className="text-label-sm font-label-sm text-text-secondary truncate">{roleLabel(r.actorRole)}</div>
        </div>
      </div>
    ),
  },
  {
    header: "Action Type",
    className: "py-3 px-4 whitespace-nowrap",
    render: (r) => (
      <StatusBadge tone={ACTION_TONE[r.action]} icon={ACTION_ICON[r.action]}>
        {ACTION_LABEL[r.action]}
      </StatusBadge>
    ),
  },
  {
    header: "Target",
    className: "py-3 px-4",
    render: (r) => <span className="text-body-md font-body-md text-on-surface">{r.targetLabel ?? "—"}</span>,
  },
  {
    header: "Details",
    className: "py-3 px-4 max-w-sm",
    render: (r) => <span className="text-label-md font-label-md text-text-secondary">{r.details ?? "—"}</span>,
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeType, setActiveType] = useState<AuditActionApi | "all">("all");
  const [activeRole, setActiveRole] = useState<ApiRole | "all">("all");
  const [page, setPage] = useState(1);

  // Debounce the search box → search param (and reset to page 1).
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  const summaryQuery = useAuditSummary();
  const logQuery = useAuditLog({
    type: activeType === "all" ? undefined : activeType,
    actorRole: activeRole === "all" ? undefined : activeRole,
    search: debouncedSearch || undefined,
    page,
  });

  const stats = summaryQuery.data;
  const summaryTiles: { label: string; value: number; icon: string; iconClassName: string }[] = [
    { label: "Total Events", value: stats?.total ?? 0, icon: "list_alt", iconClassName: "text-primary" },
    { label: "Exports Today", value: stats?.exportsToday ?? 0, icon: "download", iconClassName: "text-navy-vibrant" },
    { label: "Role Changes", value: stats?.roleChanges ?? 0, icon: "manage_accounts", iconClassName: "text-on-secondary-fixed" },
    { label: "Policy Actions", value: stats?.policyActions ?? 0, icon: "policy", iconClassName: "text-status-error" },
  ];

  const rows = logQuery.data?.items ?? [];
  const total = logQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectType = (key: AuditActionApi | "all") => {
    setActiveType(key);
    setPage(1);
  };
  const selectRole = (key: ApiRole | "all") => {
    setActiveRole(key);
    setPage(1);
  };

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                {summaryQuery.isPending ? (
                  <div className="h-8 w-12 rounded bg-surface-variant animate-pulse" />
                ) : (
                  <div className="text-headline-md font-headline-md text-text-primary leading-none">
                    {tile.value}
                  </div>
                )}
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
            {ACTION_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => selectType(f.key)}
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
              onChange={(e) => selectRole(e.target.value as ApiRole | "all")}
              className="bg-surface-container-low border border-surface-border rounded-lg px-3 py-2 text-label-md font-label-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              {ROLE_FILTERS.map((role) => (
                <option key={role.key} value={role.key}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Log table */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
          {logQuery.isPending ? (
            <div className="divide-y divide-surface-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 px-4">
                  <div className="h-9 w-9 rounded-full bg-surface-variant animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-surface-variant animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-surface-variant animate-pulse" />
                  </div>
                  <div className="h-6 w-20 rounded bg-surface-variant animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          ) : logQuery.isError ? (
            <div className="text-center py-24 px-4">
              <span className="material-symbols-outlined text-[48px] mb-2 text-status-error opacity-80">error</span>
              <p className="text-title-md font-title-md text-status-error">Couldn&apos;t load the audit log</p>
              <p className="text-body-md font-body-md text-text-secondary mt-1 mb-5">
                {logQuery.error instanceof Error ? logQuery.error.message : "Something went wrong."}
              </p>
              <button
                onClick={() => logQuery.refetch()}
                className="inline-flex items-center gap-2 bg-status-error/10 text-status-error px-4 py-2 rounded-lg text-label-md font-label-md hover:bg-status-error/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Retry
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-24 text-text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">search_off</span>
              <p className="text-title-md font-title-md">No log entries match your filters</p>
            </div>
          ) : (
            <DataTable
              columns={COLUMNS}
              rows={rows}
              wrapperClassName="custom-scrollbar"
              theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
              thClassName="py-3 px-4 font-semibold border-b border-surface-border text-left"
              rowClassName={() =>
                "border-b border-surface-border last:border-0 hover:bg-surface-container-low transition-colors align-top"
              }
            />
          )}
        </div>

        {/* Footer: count note + pagination */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-label-sm font-label-sm text-text-secondary">
            <span className="material-symbols-outlined text-[16px]">info</span>
            {logQuery.isPending
              ? "Loading entries…"
              : `Showing ${rows.length} of ${total} entries · newest first · entries are immutable.`}
          </div>

          {!logQuery.isError && total > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || logQuery.isFetching}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-surface-border text-label-md font-label-md text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Prev
              </button>
              <span className="text-label-md font-label-md text-text-secondary px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || logQuery.isFetching}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-surface-border text-label-md font-label-md text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuditLogPage;
