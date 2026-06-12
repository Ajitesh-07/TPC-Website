"use client";

import { useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  EXPORT_STUDENTS,
  PENDING_CORRECTIONS,
  BRANCHES,
  PLACEMENT_STATUSES,
  EXPORT_FORMATS,
  EXPORT_DATASETS,
  type ExportStudent,
  type CorrectionRequest,
} from "@/data/global-export";

// Placement status -> badge tone (blocked rows override to error elsewhere).
const statusTone = (status: string): BadgeTone => {
  if (status === "Placed") return "success";
  if (status === "Higher Studies") return "info";
  return "warning"; // Unplaced
};

const GlobalExportPage = () => {
  // --- Student directory state ---
  const [students, setStudents] = useState<ExportStudent[]>(EXPORT_STUDENTS);
  const [query, setQuery] = useState("");
  const [dirBranch, setDirBranch] = useState<string>("All");

  // --- Export panel state ---
  const [dataset, setDataset] = useState<string>("Students");
  const [exportBranch, setExportBranch] = useState<string>("All");
  const [exportStatus, setExportStatus] = useState<string>("All");
  const [format, setFormat] = useState<string>("CSV");

  // --- Correction requests state ---
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(PENDING_CORRECTIONS);

  // Rows visible in the directory table (search + branch filter).
  const visibleStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => dirBranch === "All" || s.branch === dirBranch)
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.roll.toLowerCase().includes(q)
      );
  }, [students, query, dirBranch]);

  // Rows targeted by the export panel filters.
  const exportRows = useMemo(
    () =>
      students
        .filter((s) => exportBranch === "All" || s.branch === exportBranch)
        .filter((s) => exportStatus === "All" || s.placementStatus === exportStatus),
    [students, exportBranch, exportStatus]
  );

  const toggleBlocked = (id: string) =>
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, blocked: !s.blocked } : s))
    );

  const resolveCorrection = (id: string) => {
    setCorrections((prev) => prev.filter((c) => c.id !== id));
  };

  // Basic client-side CSV download of the currently-filtered student rows.
  const handleExport = () => {
    const headers = ["Roll No", "Name", "Branch", "CPI", "Placement Status", "Blocked"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = exportRows.map((s) =>
      [s.roll, s.name, s.branch, s.cpi, s.placementStatus, s.blocked ? "Yes" : "No"]
        .map(escape)
        .join(",")
    );
    const csv = [headers.map(escape).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${dataset.toLowerCase()}-export.${format.toLowerCase()}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  // Directory table columns.
  const columns: Column<ExportStudent>[] = useMemo(
    () => [
      {
        header: "Roll No",
        className: "py-3 px-4 align-middle",
        render: (s) => (
          <span
            className={cn(
              "font-mono text-label-md font-label-md",
              s.blocked ? "text-text-secondary" : "text-on-surface"
            )}
          >
            {s.roll}
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
                s.blocked
                  ? "bg-surface-variant text-text-secondary"
                  : "bg-primary-fixed text-primary"
              )}
            >
              {s.initials}
            </div>
            <span
              className={cn(
                "text-body-md font-body-md",
                s.blocked ? "text-text-secondary line-through" : "text-text-primary"
              )}
            >
              {s.name}
            </span>
          </div>
        ),
      },
      {
        header: "Branch",
        className: "py-3 px-4 align-middle text-text-secondary text-body-md",
        render: (s) => s.branch,
      },
      {
        header: "CPI",
        className: "py-3 px-4 align-middle font-mono text-label-md",
        render: (s) => (
          <span className={s.blocked ? "text-text-secondary" : "text-on-surface"}>
            {s.cpi}
          </span>
        ),
      },
      {
        header: "Placement Status",
        className: "py-3 px-4 align-middle",
        render: (s) =>
          s.blocked ? (
            <StatusBadge tone="error" icon="block">
              Blocked
            </StatusBadge>
          ) : (
            <StatusBadge tone={statusTone(s.placementStatus)}>
              {s.placementStatus}
            </StatusBadge>
          ),
      },
      {
        header: "Action",
        headerClassName: "text-right",
        className: "py-3 px-4 align-middle text-right",
        render: (s) => (
          <div className="inline-flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-surface-border text-label-sm font-label-sm text-text-secondary hover:bg-surface-variant transition-colors"
              aria-label={`Edit ${s.name}`}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit
            </button>
            <button
              onClick={() => toggleBlocked(s.id)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-label-sm font-label-sm transition-colors",
                s.blocked
                  ? "bg-status-success/10 text-status-success hover:bg-status-success/20"
                  : "bg-error-container text-on-error-container hover:opacity-90"
              )}
            >
              <span className="material-symbols-outlined text-[16px]">
                {s.blocked ? "lock_open" : "block"}
              </span>
              {s.blocked ? "Unblock" : "Block"}
            </button>
          </div>
        ),
      },
    ],
    []
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
                className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b === "All" ? "All Branches" : b}
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
                className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              >
                {PLACEMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Statuses" : s}
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
              {dataset === "Companies" ? (
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Company dataset export coming soon — showing student counts.
                </span>
              ) : (
                <>
                  <span className="text-on-surface font-medium">{exportRows.length}</span>{" "}
                  student record{exportRows.length === 1 ? "" : "s"} match the current filters.
                </>
              )}
            </p>
            <button
              onClick={handleExport}
              disabled={dataset === "Companies" || exportRows.length === 0}
              className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-on-primary text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export {format}
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
            {corrections.length === 0 ? (
              <div className="text-center py-10 text-text-secondary">
                <span className="material-symbols-outlined text-[40px] mb-2 opacity-50 block">
                  task_alt
                </span>
                <p className="text-title-md font-title-md">All caught up</p>
                <p className="text-body-md font-body-md">No pending correction requests.</p>
              </div>
            ) : (
              corrections.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border border-surface-border bg-surface-container-low"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-body-md font-body-md text-text-primary font-medium">
                        {c.student}
                      </span>
                      <span className="font-mono text-label-sm text-text-secondary">
                        {c.roll}
                      </span>
                      <StatusBadge tone="info">{c.field}</StatusBadge>
                    </div>
                    <p className="text-label-md font-label-md text-text-secondary">
                      {c.change}
                    </p>
                    <p className="text-label-sm font-label-sm text-text-secondary mt-1">
                      Submitted {c.submitted}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => resolveCorrection(c.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-success/10 text-status-success text-label-md font-label-md hover:bg-status-success/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      Approve
                    </button>
                    <button
                      onClick={() => resolveCorrection(c.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-label-md font-label-md hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      Reject
                    </button>
                  </div>
                </div>
              ))
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
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                  placeholder="Search name or roll no..."
                  type="text"
                />
              </div>
              <select
                value={dirBranch}
                onChange={(e) => setDirBranch(e.target.value)}
                className="px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-body-md font-body-md text-text-secondary focus:outline-none focus:border-primary transition-all"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b === "All" ? "All Branches" : b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visibleStudents.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <span className="material-symbols-outlined text-[40px] mb-2 opacity-50 block">
                search_off
              </span>
              <p className="text-title-md font-title-md">No students match your filters</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={visibleStudents}
              theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
              thClassName="py-3 px-4 font-semibold border-b border-surface-border"
              rowClassName={(s) =>
                cn(
                  "border-b border-surface-border hover:bg-surface-container-low transition-colors",
                  s.blocked && "opacity-60 bg-error-container/20"
                )
              }
            />
          )}

          <div className="px-5 py-3 bg-surface-bright border-t border-surface-border flex justify-between items-center text-label-sm font-label-sm text-text-secondary">
            <span>
              Showing {visibleStudents.length} of {students.length} students
            </span>
            <span>
              {students.filter((s) => s.blocked).length} blocked
            </span>
          </div>
        </section>
      </div>
    </>
  );
};

export default GlobalExportPage;
