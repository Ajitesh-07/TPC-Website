"use client";

import { useEffect, useState } from "react";
import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useStudents } from "@/lib/hooks";
import type { DirectoryStudentRow } from "@/lib/api-types";

const PAGE_SIZE = 20;

// ---------- local mappers (API → display) ----------

/** "Aarav Sharma" → "AS". */
function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : parts[0].charAt(1);
  return (first + (last ?? "")).toUpperCase();
}

/** "higher_studies" → "Higher Studies". */
function titleCase(value: string): string {
  return value
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Composite directory status: blocked wins; otherwise placementStatus. */
function studentStatus(s: DirectoryStudentRow): { label: string; tone: BadgeTone } {
  if (s.isBlocked) return { label: "Restricted", tone: "error" };
  switch (s.placementStatus) {
    case "placed":
      return { label: "Placed", tone: "success" };
    case "unplaced":
      return { label: "Unplaced", tone: "neutral" };
    case "higher_studies":
      return { label: "Higher Studies", tone: "info" };
    default:
      return { label: titleCase(s.placementStatus), tone: "neutral" };
  }
}

const COLUMNS: Column<DirectoryStudentRow>[] = [
  {
    header: "Student",
    className: "px-4 py-3",
    render: (s) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-label-md font-label-md font-bold shrink-0">
          {initials(s.fullName)}
        </div>
        <div className="min-w-0">
          <div className="text-body-md font-body-md font-semibold text-text-primary truncate">
            {s.fullName}
          </div>
          <div className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
            {s.rollNo}
          </div>
        </div>
      </div>
    ),
  },
  {
    header: "Branch",
    className: "px-4 py-3 text-text-secondary",
    render: (s) => s.branch?.code ?? "—",
  },
  {
    header: "CGPA",
    className: "px-4 py-3 text-text-secondary",
    render: (s) => (s.cpi != null ? s.cpi.toFixed(2) : "—"),
  },
  {
    header: "Email",
    className: "px-4 py-3 text-text-secondary hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
    render: (s) => s.email,
  },
  {
    header: "Status",
    className: "px-4 py-3",
    render: (s) => {
      const status = studentStatus(s);
      return (
        <StatusBadge tone={status.tone} className="px-2 py-1 rounded">
          {status.label}
        </StatusBadge>
      );
    },
  },
  {
    header: "Action",
    headerClassName: "text-right",
    className: "px-4 py-3 text-right",
    render: () => (
      <button
        type="button"
        className="inline-flex items-center gap-1 text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors"
      >
        View
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    ),
  },
];

const StudentProfiles = () => {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search box → server-side `search` param.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, error, refetch, isFetching } = useStudents({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const students = data?.items ?? [];
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <PortalHeader
        title="Student Profiles"
        subtitle="Directory of all registered students — for coordinators and admins."
        className="bg-surface/90 px-gutter-mobile md:px-gutter-desktop"
        innerClassName="max-w-container-max mx-auto"
        actions={
          <label className="input-glow flex items-center gap-2 rounded-lg border border-surface-border bg-surface-container-lowest px-3 py-2 w-full sm:w-72">
            <span className="material-symbols-outlined text-[18px] text-text-secondary">
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or roll number"
              className="bg-transparent text-body-md text-text-primary placeholder:text-text-secondary focus:outline-none w-full"
            />
          </label>
        }
      />

      <div className="p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="bg-surface-container-lowest border border-surface-border rounded-xl soft-shadow overflow-hidden">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-bright">
            <h2 className="text-title-md font-title-md text-text-primary">
              All Students
              <span className="ml-2 text-label-sm font-label-sm text-text-secondary">
                {isLoading ? "…" : `${total} total`}
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-surface-variant" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-5 flex items-center gap-3">
              <span className="material-symbols-outlined text-status-error text-[20px]">
                error
              </span>
              <p className="flex-1 text-body-md font-body-md text-status-error">
                Couldn&rsquo;t load the student directory.
                {error instanceof Error ? ` ${error.message}` : ""}
              </p>
              <button
                onClick={() => refetch()}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                person_search
              </span>
              <p className="text-title-md font-title-md">
                {search
                  ? "No students match your search"
                  : "No students registered yet"}
              </p>
            </div>
          ) : (
            <>
              <DataTable
                columns={COLUMNS}
                rows={students}
                className="min-w-[640px]"
                theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                thClassName="px-4 py-3 font-semibold"
                rowClassName={() =>
                  "border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md"
                }
              />
              <div className="p-4 border-t border-surface-border flex items-center justify-between bg-surface-bright">
                <span className="text-label-sm font-label-sm text-text-secondary">
                  Showing {from}&ndash;{to} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                    className="px-3 py-1.5 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={to >= total || isFetching}
                    className="px-3 py-1.5 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentProfiles;
