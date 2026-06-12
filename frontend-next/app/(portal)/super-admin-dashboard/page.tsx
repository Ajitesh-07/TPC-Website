"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MetricCard from "@/components/ui/MetricCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useAdminDashboard, useStudents } from "@/lib/hooks";
import type { DirectoryStudentRow } from "@/lib/api-types";
import { cn } from "@/lib/utils";

/* ---------- local display helpers (API → view) ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Aarav Sharma" → "AS". */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";

/** ISO datetime → "Oct 15, 2024". */
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/** ISO datetime → "2h ago" / "1d ago" / absolute date when old. */
const relativeTime = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
};

/** "not_placed" → "Not Placed". */
const humanize = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Debounce a changing value (for search-as-you-type). */
function useDebounced<T>(value: T, ms = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Card art for the four global stats, in API order. */
const STAT_STYLES = [
  {
    label: "Total Placements",
    icon: "school",
    iconClassName: "text-primary-fixed-dim",
    blobClassName:
      "-right-4 -top-4 w-16 h-16 bg-primary-container/5 rounded-full group-hover:scale-150 transition-transform duration-500",
  },
  {
    label: "Active Companies",
    icon: "domain",
    iconClassName: "text-secondary-fixed-dim",
    blobClassName:
      "-right-4 -top-4 w-16 h-16 bg-secondary-container/10 rounded-full group-hover:scale-150 transition-transform duration-500",
  },
  {
    label: "Registered Students",
    icon: "groups",
    iconClassName: "text-tertiary-container",
    blobClassName:
      "-right-4 -top-4 w-16 h-16 bg-tertiary-fixed-dim/20 rounded-full group-hover:scale-150 transition-transform duration-500",
  },
  {
    label: "Pending Approvals",
    icon: "pending_actions",
    iconClassName: "text-status-error",
    blobClassName:
      "-right-4 -top-4 w-16 h-16 bg-error-container/20 rounded-full group-hover:scale-150 transition-transform duration-500",
  },
] as const;

/** Avatar tints cycled across the role-change list. */
const AVATAR_STYLES = [
  "bg-tertiary-container text-on-tertiary-container",
  "bg-secondary-container text-on-secondary-fixed-variant",
  "bg-surface-variant text-text-secondary",
] as const;

/** Badge tints cycled across directory rows (blocked rows go red). */
const BADGE_STYLES = [
  "bg-primary-fixed text-on-primary-fixed",
  "bg-secondary-fixed text-on-secondary-fixed",
  "bg-tertiary-fixed text-on-tertiary-fixed",
] as const;

const badgeOf = (r: DirectoryStudentRow) => {
  const year = r.batchYear ? String(r.batchYear).slice(-2) : "";
  return `${year}${r.branch?.code ?? ""}` || "—";
};

const statusOf = (r: DirectoryStudentRow): { label: string; className: string } => {
  if (r.isBlocked) {
    return {
      label: "Blocked",
      className: "bg-error-container text-on-error-container border border-error/20",
    };
  }
  if (r.placementStatus === "placed") {
    return {
      label: "Placed",
      className: "bg-status-success/10 text-status-success border border-status-success/20",
    };
  }
  return {
    label: humanize(r.placementStatus),
    className: "bg-status-warning/10 text-status-warning border border-status-warning/20",
  };
};

const DIRECTORY_COLUMNS: Column<DirectoryStudentRow>[] = [
  {
    headerClassName: "w-12",
    className: "py-2 px-4",
    render: (r, i) => (
      <div
        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
          r.isBlocked
            ? "bg-error-container text-on-error-container"
            : BADGE_STYLES[i % BADGE_STYLES.length]
        }`}
      >
        {badgeOf(r)}
      </div>
    ),
  },
  {
    header: "Roll No / Name",
    className: "py-2 px-4",
    render: (r) => (
      <>
        <div className="font-medium text-primary">{r.rollNo}</div>
        <div className="text-label-sm text-text-secondary">{r.fullName}</div>
      </>
    ),
  },
  {
    header: "Department",
    className: "py-2 px-4 text-text-secondary",
    render: (r) => r.branch?.name ?? "—",
  },
  {
    header: "Credits",
    className: "py-2 px-4 font-mono text-sm",
    render: (r) => (
      <span className={r.creditBalance < 0 ? "text-status-error font-medium" : undefined}>
        {r.creditBalance.toLocaleString("en-IN")}
      </span>
    ),
  },
  {
    header: "Status",
    className: "py-2 px-4",
    render: (r) => {
      const status = statusOf(r);
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      );
    },
  },
  {
    header: "Actions",
    headerClassName: "text-right",
    className: "py-2 px-4 text-right",
    render: () => (
      <>
        <button className="text-text-secondary hover:text-primary p-1">
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button className="text-text-secondary hover:text-primary p-1">
          <span className="material-symbols-outlined text-[18px]">more_vert</span>
        </button>
      </>
    ),
  },
];

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-surface-variant rounded-lg", className)} />
);

const ErrorPanel = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
    <span className="text-body-md font-body-md text-status-error flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">error</span>
      {message}
    </span>
    <button
      onClick={onRetry}
      className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
    >
      Retry
    </button>
  </div>
);

const DIRECTORY_PAGE_SIZE = 5;

const SuperAdminDashboard = () => {
  const dashboard = useAdminDashboard();

  // Directory: search + pagination.
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput);
  const [page, setPage] = useState(1);

  const studentsQ = useStudents({
    search: search || undefined,
    page,
    pageSize: DIRECTORY_PAGE_SIZE,
  });

  const students = studentsQ.data?.items ?? [];
  const total = studentsQ.data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * DIRECTORY_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * DIRECTORY_PAGE_SIZE, total);

  const statValues = dashboard.data
    ? [
        dashboard.data.stats.totalPlacements,
        dashboard.data.stats.activeCompanies,
        dashboard.data.stats.registeredStudents,
        dashboard.data.stats.pendingApprovals,
      ]
    : [];

  return (
    <div className="flex-1 p-gutter-mobile md:p-gutter-desktop space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary">
            Global Dashboard
          </h2>
          <p className="text-body-md font-body-md text-text-secondary mt-1">
            Admin &amp; Credit Management Overview
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative grow md:grow-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">
              search
            </span>
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2 rounded-lg border border-surface-border bg-surface-container-lowest text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-64"
              placeholder="Search directory..."
              type="text"
            />
          </div>
          <button className="bg-surface-container-lowest border border-surface-border p-2 rounded-lg text-text-secondary hover:text-primary transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Quick stats */}
        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboard.isLoading ? (
            STAT_STYLES.map((s) => <Skeleton key={s.label} className="h-32 rounded-xl" />)
          ) : dashboard.isError ? (
            <div className="col-span-2 md:col-span-4">
              <ErrorPanel
                message={dashboard.error?.message ?? "Failed to load stats."}
                onRetry={() => dashboard.refetch()}
              />
            </div>
          ) : (
            STAT_STYLES.map((stat, i) => (
              <MetricCard
                key={stat.label}
                {...stat}
                value={(statValues[i] ?? 0).toLocaleString("en-IN")}
                delta={
                  stat.label === "Pending Approvals"
                    ? { text: "Requires review", tone: "neutral" }
                    : undefined
                }
                className="h-32 flex flex-col justify-between"
                valueClassName="text-headline-md font-headline-md text-primary"
              />
            ))
          )}
        </div>

        {/* Credit management widget */}
        <div className="md:col-span-4 bg-primary text-on-primary rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h3 className="text-title-md font-title-md font-semibold">
              Credit Management
            </h3>
            <button className="text-on-primary/70 hover:text-white transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/5 mb-4">
              <label className="text-label-sm font-label-sm text-on-primary/70 block mb-1">
                Student Credit Console
              </label>
              <p className="text-body-md font-body-md text-white/85 mt-1">
                Search, audit and adjust student credit balances with a full
                ledger trail.
              </p>
              <Link
                href="/credit-management"
                className="w-full mt-3 bg-gold-leaf text-on-secondary-fixed-variant py-2 rounded font-title-md text-sm hover:bg-secondary-container transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Manage credits
              </Link>
            </div>
            <Link
              className="text-label-sm font-label-sm text-gold-leaf hover:underline flex items-center gap-1 self-start mt-auto"
              href="/credit-management"
            >
              View Full Audit Log{" "}
              <span className="material-symbols-outlined text-[14px]">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* Placement trajectory chart (static mock — stats endpoint is phase 2) */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-md font-title-md text-primary">
              Placement Trajectory
            </h3>
            <select className="text-label-md font-label-md bg-surface border border-surface-border rounded px-2 py-1 text-text-secondary outline-none focus:border-primary">
              <option>2023-2024</option>
              <option>2022-2023</option>
            </select>
          </div>
          <div className="flex-1 bg-surface-container-low rounded-lg border border-dashed border-outline-variant flex items-center justify-center min-h-[250px] relative">
            <div className="absolute bottom-0 left-0 w-full h-[80%] flex items-end justify-between px-4 pb-4 gap-2 opacity-40">
              {[40, 55, 45, 70, 60, 85, 75, 95].map((h, i) => (
                <div
                  key={i}
                  className="w-1/12 bg-primary-fixed-dim rounded-t"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
            <span className="text-text-secondary text-body-md z-10 flex items-center gap-2">
              <span className="material-symbols-outlined">insights</span>
              Sample data — live trends arrive in phase 2
            </span>
          </div>
        </div>

        {/* Recent role changes */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-bright">
            <h3 className="text-title-md font-title-md text-primary">
              Recent Role Changes
            </h3>
            <button className="text-primary hover:bg-surface-container rounded-full p-1 transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {dashboard.isLoading ? (
              <div className="p-2 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : dashboard.isError ? (
              <p className="p-4 text-label-md font-label-md text-status-error flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                Couldn&apos;t load role changes.
              </p>
            ) : (dashboard.data?.recentRoleChanges.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <span className="material-symbols-outlined text-[36px] opacity-50">
                  manage_accounts
                </span>
                <p className="text-label-md font-label-md mt-2">
                  No recent role changes
                </p>
              </div>
            ) : (
              dashboard.data?.recentRoleChanges.map((change, i) => {
                const name = change.targetLabel ?? "Unknown user";
                return (
                  <div
                    key={`${change.createdAt}-${i}`}
                    className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold ${AVATAR_STYLES[i % AVATAR_STYLES.length]}`}
                    >
                      {initialsOf(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-body-md text-primary truncate">
                        {name}
                      </p>
                      <p className="text-label-sm font-label-sm text-text-secondary truncate">
                        {change.details ??
                          (change.actorRole
                            ? `Role updated by ${humanize(change.actorRole)}`
                            : "Role updated")}
                      </p>
                    </div>
                    <span className="text-label-sm text-text-secondary">
                      {relativeTime(change.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-3 border-t border-surface-border text-center bg-surface-bright">
            <Link
              className="text-label-sm font-label-sm text-primary hover:underline"
              href="/user-management"
            >
              View All Roles
            </Link>
          </div>
        </div>

        {/* Student directory */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden mt-4">
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
            <div>
              <h3 className="text-title-md font-title-md text-primary">
                Student Directory
              </h3>
              <p className="text-label-md font-label-md text-text-secondary">
                Manage and view student placement statuses.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-1 text-label-md font-label-md px-3 py-1.5 border border-surface-border rounded bg-white hover:bg-surface-container-low transition-colors text-text-secondary">
                <span className="material-symbols-outlined text-[16px]">
                  download
                </span>{" "}
                Export
              </button>
            </div>
          </div>
          {studentsQ.isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: DIRECTORY_PAGE_SIZE }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-lg" />
              ))}
            </div>
          ) : studentsQ.isError ? (
            <div className="p-5">
              <ErrorPanel
                message={studentsQ.error?.message ?? "Failed to load the directory."}
                onRetry={() => studentsQ.refetch()}
              />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-14 text-text-secondary">
              <span className="material-symbols-outlined text-[40px] opacity-50">
                person_search
              </span>
              <p className="text-title-md font-title-md mt-2">
                {search ? "No students match your search" : "No students yet"}
              </p>
            </div>
          ) : (
            <DataTable
              columns={DIRECTORY_COLUMNS}
              rows={students}
              theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
              thClassName="py-3 px-4 font-semibold border-b border-surface-border"
              rowClassName={(_, i) =>
                `border-b border-surface-border hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface ${
                  i % 2 === 1 ? "bg-neutral-50/50" : ""
                }`
              }
            />
          )}
          <div className="p-3 bg-surface-bright flex justify-between items-center text-label-sm text-text-secondary">
            <span>
              Showing {rangeStart}-{rangeEnd} of {total} students
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                disabled={page <= 1 || studentsQ.isLoading}
                aria-label="Previous page"
              >
                <span className="material-symbols-outlined text-[16px]">
                  chevron_left
                </span>
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                disabled={page * DIRECTORY_PAGE_SIZE >= total || studentsQ.isLoading}
                aria-label="Next page"
              >
                <span className="material-symbols-outlined text-[16px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
