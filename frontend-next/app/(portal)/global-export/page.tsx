"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  exportDataset,
  useBlockStudent,
  useCorrections,
  useMeta,
  useReviewCorrection,
  useStudents,
} from "@/lib/hooks";
import type { CorrectionRequest, DirectoryStudentRow } from "@/lib/api-types";

/* ---------- local display helpers (API → view) ---------- */

const PAGE_SIZE = 10;

/** Export format choices (CSV download only for now). */
const EXPORT_FORMATS = ["CSV"] as const;

/** Dataset choices for the export panel (matches the export endpoints). */
const EXPORT_DATASETS = ["Students", "Companies"] as const;

/**
 * Placement-status enum (backend) → display label + badge tone.
 * The directory/export APIs speak the raw enum; the UI shows friendly labels.
 */
const PLACEMENT_LABELS: Record<string, string> = {
  unplaced: "Unplaced",
  placed: "Placed",
  higher_studies: "Higher Studies",
  opted_out: "Opted Out",
  debarred: "Debarred",
};

const placementLabel = (status: string) =>
  PLACEMENT_LABELS[status] ?? status.replace(/_/g, " ");

const placementTone = (status: string): BadgeTone => {
  if (status === "placed") return "success";
  if (status === "higher_studies") return "info";
  if (status === "debarred" || status === "opted_out") return "error";
  return "warning"; // unplaced
};

/** Placement-status filter options ("" sentinel = all). */
const PLACEMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "placed", label: "Placed" },
  { value: "unplaced", label: "Unplaced" },
  { value: "higher_studies", label: "Higher Studies" },
  { value: "opted_out", label: "Opted Out" },
  { value: "debarred", label: "Debarred" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO datetime → "Oct 15, 2024". */
const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/** "Aarav Sharma" → "AS". */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";

/** Debounce a changing value (for search-as-you-type). */
function useDebounced<T>(value: T, ms = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

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

/** Short human description of a correction request ("old → new"). */
const correctionChange = (c: CorrectionRequest) => {
  const next = c.requestedValue ?? "—";
  if (c.currentValue != null && c.currentValue !== "") {
    return `${c.currentValue} → ${next}`;
  }
  return next;
};

const GlobalExportPage = () => {
  // --- Reference data (branch options) ---
  const metaQ = useMeta();
  const branchOptions = useMemo(() => metaQ.data?.branches ?? [], [metaQ.data]);

  // --- Export panel state ---
  const [dataset, setDataset] = useState<(typeof EXPORT_DATASETS)[number]>("Students");
  const [exportBranch, setExportBranch] = useState<string>(""); // branch code, "" = all
  const [exportStatus, setExportStatus] = useState<string>(""); // enum, "" = all
  const [format, setFormat] = useState<string>("CSV");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      if (dataset === "Students") {
        await exportDataset("students", {
          branch: exportBranch || undefined,
          placementStatus: exportStatus || undefined,
        });
      } else {
        await exportDataset("companies", {});
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  // --- Correction requests ---
  const correctionsQ = useCorrections({ status: "pending", page: 1 });
  const corrections = useMemo(() => correctionsQ.data?.items ?? [], [correctionsQ.data]);
  const reviewCorrection = useReviewCorrection();
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null);

  const reviewOne = (id: string, approve: boolean) => {
    if (reviewCorrection.isPending) return;
    setPendingReviewId(id);
    reviewCorrection.mutate(
      { id, approve },
      { onSettled: () => setPendingReviewId(null) }
    );
  };

  // --- Student directory ---
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [dirBranch, setDirBranch] = useState<string>(""); // branch code, "" = all
  const [page, setPage] = useState(1);

  const studentsQ = useStudents({
    search: search || undefined,
    branch: dirBranch || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const students = useMemo(() => studentsQ.data?.items ?? [], [studentsQ.data]);
  const total = studentsQ.data?.total ?? 0;
  const pageSize = studentsQ.data?.pageSize ?? PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const blockedCount = useMemo(() => students.filter((s) => s.isBlocked).length, [students]);

  const blockStudent = useBlockStudent();
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);

  const toggleBlocked = (s: DirectoryStudentRow) => {
    if (blockStudent.isPending) return;
    setPendingBlockId(s.id);
    blockStudent.mutate(
      {
        id: s.id,
        blocked: !s.isBlocked,
        reason: !s.isBlocked ? "Blocked via global directory" : undefined,
      },
      { onSettled: () => setPendingBlockId(null) }
    );
  };

  // Directory table columns.
  const columns: Column<DirectoryStudentRow>[] = useMemo(
    () => [
      {
        header: "Roll No",
        className: "py-3 px-4 align-middle",
        render: (s) => (
          <span
            className={cn(
              "font-mono text-label-md font-label-md",
              s.isBlocked ? "text-text-secondary" : "text-on-surface"
            )}
          >
            {s.rollNo}
          </span>
        ),
      },
      {
        header: "Name",
        className: "py-3 px-4 align-middle",
        render: (s) => (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-bold shrink-0",
                s.isBlocked
                  ? "bg-surface-variant text-text-secondary"
                  : "bg-primary-fixed text-primary"
              )}
            >
              {initialsOf(s.fullName)}
            </div>
            <span
              className={cn(
                "text-body-md font-body-md",
                s.isBlocked ? "text-text-secondary line-through" : "text-text-primary"
              )}
            >
              {s.fullName}
            </span>
          </div>
        ),
      },
      {
        header: "Branch",
        className: "py-3 px-4 align-middle text-text-secondary text-body-md",
        render: (s) => s.branch?.code ?? "—",
      },
      {
        header: "CPI",
        className: "py-3 px-4 align-middle font-mono text-label-md",
        render: (s) => (
          <span className={s.isBlocked ? "text-text-secondary" : "text-on-surface"}>
            {s.cpi != null ? s.cpi.toFixed(2) : "—"}
          </span>
        ),
      },
      {
        header: "Placement Status",
        className: "py-3 px-4 align-middle",
        render: (s) =>
          s.isBlocked ? (
            <StatusBadge tone="error" icon="block">
              Blocked
            </StatusBadge>
          ) : (
            <StatusBadge tone={placementTone(s.placementStatus)}>
              {placementLabel(s.placementStatus)}
            </StatusBadge>
          ),
      },
      {
        header: "Action",
        headerClassName: "text-right",
        className: "py-3 px-4 align-middle text-right",
        render: (s) => {
          const busy = blockStudent.isPending && pendingBlockId === s.id;
          return (
            <div className="inline-flex items-center gap-2">
              <button
                onClick={() => toggleBlocked(s)}
                disabled={busy}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-label-sm font-label-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  s.isBlocked
                    ? "bg-status-success/10 text-status-success hover:bg-status-success/20"
                    : "bg-error-container text-on-error-container hover:opacity-90"
                )}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {busy ? "progress_activity" : s.isBlocked ? "lock_open" : "block"}
                </span>
                {busy ? "Saving…" : s.isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blockStudent.isPending, pendingBlockId]
  );

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/80 backdrop-blur-md px-gutter-mobile md:px-gutter-desktop py-4">
        <div className="max-w-container-max mx-auto">
          <h2 className="text-headline-md font-headline-md text-text-primary">
            Global Database &amp; Export
          </h2>
          <p className="text-body-md font-body-md text-text-secondary mt-1">
            Export, audit, and administer all student &amp; company records.
          </p>
        </div>
      </header>

      {/* Centered content container */}
      <div className="px-gutter-mobile md:px-gutter-desktop py-8 max-w-container-max mx-auto w-full space-y-8 animate-fadeIn">
        {/* 1. Export panel */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border bg-surface-bright flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">database</span>
            <div>
              <h3 className="text-title-md font-title-md text-primary">Export Data</h3>
              <p className="text-label-md font-label-md text-text-secondary">
                Generate a download of the selected dataset and filters.
              </p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Dataset */}
            <div className="lg:col-span-1">
              <label className="block text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
                Dataset
              </label>
              <div className="flex gap-2">
                {EXPORT_DATASETS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDataset(d)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-label-md font-label-md transition-colors border",
                      dataset === d
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-low border-surface-border text-text-secondary hover:bg-surface-variant"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch filter */}
            <div>
              <label className="block text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
                Branch
              </label>
              <select
                value={exportBranch}
                onChange={(e) => setExportBranch(e.target.value)}
                disabled={dataset === "Companies"}
                className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Branches</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Placement status filter */}
            <div>
              <label className="block text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
                Placement Status
              </label>
              <select
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
                disabled={dataset === "Companies"}
                className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {PLACEMENT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="block text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              >
                {EXPORT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="px-5 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-label-md font-label-md text-text-secondary">
              {exportError ? (
                <span className="inline-flex items-center gap-1 text-status-error">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {exportError}
                </span>
              ) : dataset === "Companies" ? (
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Exports the full company directory.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Exports all matching student records for the selected filters.
                </span>
              )}
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-on-primary text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {exporting ? "progress_activity" : "download"}
              </span>
              {exporting ? "Exporting…" : `Export ${format}`}
            </button>
          </div>
        </section>

        {/* 2. Pending data correction requests */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border bg-surface-bright flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">rule</span>
              <div>
                <h3 className="text-title-md font-title-md text-primary">
                  Pending Data Correction Requests
                </h3>
                <p className="text-label-md font-label-md text-text-secondary">
                  Review and resolve student profile change requests.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-primary-fixed text-primary text-label-sm font-bold">
              {corrections.length}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {correctionsQ.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))
            ) : correctionsQ.isError ? (
              <ErrorPanel
                message={correctionsQ.error?.message ?? "Failed to load correction requests."}
                onRetry={() => correctionsQ.refetch()}
              />
            ) : corrections.length === 0 ? (
              <div className="text-center py-10 text-text-secondary">
                <span className="material-symbols-outlined text-[40px] mb-2 opacity-50 block">
                  task_alt
                </span>
                <p className="text-title-md font-title-md">All caught up</p>
                <p className="text-body-md font-body-md">No pending correction requests.</p>
              </div>
            ) : (
              corrections.map((c) => {
                const busy = reviewCorrection.isPending && pendingReviewId === c.id;
                return (
                  <div
                    key={c.id}
                    className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border border-surface-border bg-surface-container-low"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-body-md font-body-md text-text-primary font-medium">
                          {c.student?.fullName ?? "Unknown student"}
                        </span>
                        <span className="font-mono text-label-sm text-text-secondary">
                          {c.student?.rollNo ?? ""}
                        </span>
                        <StatusBadge tone="info">{c.fieldName}</StatusBadge>
                      </div>
                      <p className="text-label-md font-label-md text-text-secondary">
                        {correctionChange(c)}
                      </p>
                      <p className="text-label-sm font-label-sm text-text-secondary mt-1">
                        Submitted {formatDate(c.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => reviewOne(c.id, true)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-success/10 text-status-success text-label-md font-label-md hover:bg-status-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {busy ? "progress_activity" : "check"}
                        </span>
                        Approve
                      </button>
                      <button
                        onClick={() => reviewOne(c.id, false)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-label-md font-label-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {reviewCorrection.isError && (
              <p className="text-label-sm font-label-sm text-status-error flex items-center gap-1 px-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {reviewCorrection.error.message}
              </p>
            )}
          </div>
        </section>

        {/* 3. Full student directory */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border bg-surface-bright flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-title-md font-title-md text-primary">
                Full Student Directory
              </h3>
              <p className="text-label-md font-label-md text-text-secondary">
                Administer profiles, block access, and review placement status.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                  placeholder="Search name or roll no..."
                  type="text"
                />
              </div>
              <select
                value={dirBranch}
                onChange={(e) => {
                  setDirBranch(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-body-md font-body-md text-text-secondary focus:outline-none focus:border-primary transition-all"
              >
                <option value="">All Branches</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {studentsQ.isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : studentsQ.isError ? (
            <div className="p-5">
              <ErrorPanel
                message={studentsQ.error?.message ?? "Failed to load the student directory."}
                onRetry={() => studentsQ.refetch()}
              />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <span className="material-symbols-outlined text-[40px] mb-2 opacity-50 block">
                search_off
              </span>
              <p className="text-title-md font-title-md">No students match your filters</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={students}
              theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
              thClassName="py-3 px-4 font-semibold border-b border-surface-border"
              rowClassName={(s) =>
                cn(
                  "border-b border-surface-border hover:bg-surface-container-low transition-colors",
                  s.isBlocked && "opacity-60 bg-error-container/20"
                )
              }
            />
          )}

          <div className="px-5 py-3 bg-surface-bright border-t border-surface-border flex justify-between items-center text-label-sm font-label-sm text-text-secondary">
            <span>
              {total === 0
                ? "No students"
                : `Showing ${rangeStart}-${rangeEnd} of ${total} students`}
              {blockedCount > 0 && ` · ${blockedCount} blocked on this page`}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 hover:bg-surface-variant rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="p-1 hover:bg-surface-variant rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page * pageSize >= total}
                aria-label="Next page"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default GlobalExportPage;
