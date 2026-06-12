"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import { CREDIT_REASONS } from "@/data/credit";
import { useAdjustCredits, useCreditHistory, useCredits } from "@/lib/hooks";
import type { CreditRow } from "@/lib/api-types";
import { cn } from "@/lib/utils";

/* ---------- local display helpers (API → view) ---------- */

// Credit balance -> tone. Low credits read as warning/error.
const creditTone = (credits: number): BadgeTone => {
  if (credits <= 15) return "error";
  if (credits <= 40) return "warning";
  return "success";
};

const creditLabel = (credits: number) => {
  if (credits <= 15) return "Critical";
  if (credits <= 40) return "Low";
  return "Healthy";
};

const deltaTone = (delta: number) =>
  delta > 0 ? "text-status-success" : delta < 0 ? "text-status-error" : "text-text-secondary";

const formatDelta = (delta: number) => (delta > 0 ? `+${delta}` : `${delta}`);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO datetime → "Oct 15, 2024". */
const formatDate = (iso: string) => {
  const d = new Date(iso);
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

const CreditManagement = () => {
  const [query, setQuery] = useState("");
  const search = useDebounced(query);
  const [reasonFilter, setReasonFilter] = useState("All reasons");
  const [bandFilter, setBandFilter] = useState("All");
  const [page, setPage] = useState(1);

  const creditsQ = useCredits({
    search: search || undefined,
    reason: reasonFilter === "All reasons" ? undefined : reasonFilter,
    band: bandFilter === "All" ? undefined : bandFilter,
    page,
  });

  const rows = useMemo(() => creditsQ.data?.items ?? [], [creditsQ.data]);
  const total = creditsQ.data?.total ?? 0;
  const pageSize = creditsQ.data?.pageSize ?? 20;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  // Selected student: snapshot keeps the modal alive even if a filter change /
  // refetch drops the row out of the current page; live row wins when present.
  const [snapshot, setSnapshot] = useState<CreditRow | null>(null);
  const selected = useMemo(() => {
    if (!snapshot) return null;
    return rows.find((r) => r.studentId === snapshot.studentId) ?? snapshot;
  }, [rows, snapshot]);

  const historyQ = useCreditHistory(snapshot?.studentId ?? null);
  const adjust = useAdjustCredits();

  // Adjust form state.
  const [amount, setAmount] = useState(5);
  const [adjustReason, setAdjustReason] = useState(CREDIT_REASONS[0]);
  const [note, setNote] = useState("");

  const openStudent = (student: CreditRow) => {
    setSnapshot(student);
    setAmount(5);
    setAdjustReason(CREDIT_REASONS[0]);
    setNote("");
    adjust.reset();
  };

  const closeModal = () => setSnapshot(null);

  const applyAdjustment = () => {
    if (!selected || amount === 0 || !adjustReason || adjust.isPending) return;
    adjust.mutate(
      {
        studentId: selected.studentId,
        delta: amount,
        reason: adjustReason,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNote("");
          setAmount(5);
        },
      }
    );
  };

  const columns: Column<CreditRow>[] = [
    {
      header: "Roll No",
      className: "py-3 px-4 font-mono text-label-md text-text-secondary",
      render: (s) => s.rollNo,
    },
    {
      header: "Name",
      className: "py-3 px-4",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-label-md font-bold shrink-0">
            {initialsOf(s.fullName)}
          </div>
          <span className="font-medium text-text-primary">{s.fullName}</span>
        </div>
      ),
    },
    {
      header: "Branch",
      className: "py-3 px-4 text-text-secondary",
      render: (s) => s.branchCode ?? "—",
    },
    {
      header: "Current Credits",
      className: "py-3 px-4",
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-title-md text-on-surface">{s.creditBalance}</span>
          <StatusBadge tone={creditTone(s.creditBalance)} bordered>
            {creditLabel(s.creditBalance)}
          </StatusBadge>
        </div>
      ),
    },
    {
      header: "Last Change",
      className: "py-3 px-4",
      render: (s) => {
        const last = s.lastTransaction;
        if (!last) return <span className="text-text-secondary">—</span>;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("font-mono font-medium shrink-0", deltaTone(last.delta))}>
              {formatDelta(last.delta)}
            </span>
            <span className="text-label-md text-text-secondary truncate">{last.reason}</span>
          </div>
        );
      },
    },
    {
      header: "Action",
      headerClassName: "text-right",
      className: "py-3 px-4 text-right",
      render: (s) => (
        <button
          onClick={() => openStudent(s)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-container-lowest text-label-md font-label-md text-primary hover:bg-surface-container-low hover:border-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Adjust
        </button>
      ),
    },
  ];

  return (
    <>
      {/* Sticky header */}
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-surface-border px-gutter-mobile md:px-gutter-desktop py-4">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-headline-md font-headline-md text-text-primary">
              Credit Management
            </h2>
            <p className="text-body-md font-body-md text-text-secondary mt-1">
              Adjust and audit student placement credits.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface input-glow focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              placeholder="Search by name or roll no…"
              type="text"
            />
          </div>
        </div>
      </header>

      {/* Centered content */}
      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 max-w-container-max mx-auto w-full animate-fadeIn">
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="material-symbols-outlined text-text-secondary text-[20px] shrink-0">
              filter_list
            </span>
            <label className="text-label-md font-label-md text-text-secondary shrink-0">Reason</label>
            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              <option>All reasons</option>
              {CREDIT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-label-md font-label-md text-text-secondary shrink-0">Credit status</label>
            <select
              value={bandFilter}
              onChange={(e) => {
                setBandFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="All">All</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <span className="sm:ml-auto text-label-md font-label-md text-text-secondary">
            {total} student{total === 1 ? "" : "s"}
          </span>
        </div>

        {/* Students table */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
          {creditsQ.isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : creditsQ.isError ? (
            <div className="p-5">
              <ErrorPanel
                message={creditsQ.error?.message ?? "Failed to load credit balances."}
                onRetry={() => creditsQ.refetch()}
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                search_off
              </span>
              <p className="text-title-md font-title-md">No students match your filters</p>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                thClassName="py-3 px-4 font-semibold border-b border-surface-border text-left"
                rowClassName={() =>
                  "border-b border-surface-border last:border-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface"
                }
              />
              {total > pageSize && (
                <div className="p-3 border-t border-surface-border bg-surface-bright flex justify-between items-center text-label-sm text-text-secondary">
                  <span>
                    Showing {rangeStart}-{rangeEnd} of {total} students
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                      disabled={page <= 1}
                      aria-label="Previous page"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                      disabled={page * pageSize >= total}
                      aria-label="Next page"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Selected-student panel (modal) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative z-10 bg-surface-container-lowest rounded-xl border border-surface-border w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar elevation-2">
            {/* Header */}
            <div className="sticky top-0 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-surface-border px-6 py-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-title-md font-bold shrink-0">
                  {initialsOf(selected.fullName)}
                </div>
                <div>
                  <h3 className="text-title-lg font-title-lg text-text-primary">{selected.fullName}</h3>
                  <p className="text-label-md font-label-md text-text-secondary">
                    {selected.rollNo} · {selected.branchCode ?? "—"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-full hover:bg-surface-variant flex items-center justify-center text-text-secondary transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current balance */}
              <div className="flex items-center justify-between bg-surface-container-low rounded-lg p-4">
                <div>
                  <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                    Current Balance
                  </span>
                  <span className="text-headline-md font-headline-md font-mono text-on-surface">
                    {selected.creditBalance}
                  </span>
                </div>
                <StatusBadge
                  tone={creditTone(selected.creditBalance)}
                  bordered
                  className="px-3 py-1 text-label-md font-label-md"
                >
                  {creditLabel(selected.creditBalance)}
                </StatusBadge>
              </div>

              {/* Adjust form */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-3">
                  Adjust Credits
                </h4>
                <div className="bg-surface-container-low rounded-lg border border-surface-border p-4 space-y-4">
                  {/* Amount stepper */}
                  <div className="flex items-center gap-3">
                    <span className="text-body-md font-body-md text-text-primary">Amount</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => setAmount((a) => a - 5)}
                        className="w-9 h-9 rounded-lg border border-surface-border bg-surface-container-lowest flex items-center justify-center text-text-secondary hover:text-status-error hover:border-status-error transition-colors"
                        aria-label="Decrease"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value) || 0)}
                        className={cn(
                          "w-20 text-center bg-surface-container-lowest border border-surface-border rounded-lg px-2 py-2 text-title-md font-mono focus:outline-none focus:border-primary",
                          deltaTone(amount)
                        )}
                      />
                      <button
                        onClick={() => setAmount((a) => a + 5)}
                        className="w-9 h-9 rounded-lg border border-surface-border bg-surface-container-lowest flex items-center justify-center text-text-secondary hover:text-status-success hover:border-status-success transition-colors"
                        aria-label="Increase"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>

                  {/* Reason (required) */}
                  <div>
                    <label className="block text-label-md font-label-md text-text-primary mb-1">
                      Reason <span className="text-status-error">*</span>
                    </label>
                    <select
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                    >
                      {CREDIT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional note */}
                  <div>
                    <label className="block text-label-md font-label-md text-text-primary mb-1">
                      Note (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Add context for this adjustment…"
                      className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface placeholder:text-text-secondary focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  {adjust.isError && (
                    <p className="text-label-sm font-label-sm text-status-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {adjust.error.message}
                    </p>
                  )}

                  <button
                    onClick={applyAdjustment}
                    disabled={amount === 0 || !adjustReason || adjust.isPending}
                    className="w-full btn-gradient text-on-primary py-2.5 rounded-lg text-title-md font-title-md shadow-sm hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    {adjust.isPending ? "Applying…" : "Apply Adjustment"}
                  </button>
                </div>
              </div>

              {/* History timeline */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-3">
                  Credit History
                </h4>
                {historyQ.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 rounded-lg" />
                    ))}
                  </div>
                ) : historyQ.isError ? (
                  <ErrorPanel
                    message={historyQ.error?.message ?? "Failed to load credit history."}
                    onRetry={() => historyQ.refetch()}
                  />
                ) : (historyQ.data?.length ?? 0) === 0 ? (
                  <p className="text-body-md font-body-md text-text-secondary">
                    No credit activity yet.
                  </p>
                ) : (
                  <Timeline spacing="space-y-5">
                    {historyQ.data?.map((h) => (
                      <TimelineItem
                        key={h.id}
                        dotClassName={cn(
                          "left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full",
                          h.delta > 0
                            ? "bg-status-success"
                            : h.delta < 0
                              ? "bg-status-error"
                              : "bg-surface-variant"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-body-md font-body-md text-text-primary">
                            {h.reason}
                          </span>
                          <span className={cn("font-mono font-medium shrink-0", deltaTone(h.delta))}>
                            {formatDelta(h.delta)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-label-sm font-label-sm text-text-secondary mt-0.5">
                          <span>{h.createdByName ?? "System"}</span>
                          <span>
                            {formatDate(h.createdAt)}
                            {h.balanceAfter != null && ` · bal ${h.balanceAfter}`}
                          </span>
                        </div>
                      </TimelineItem>
                    ))}
                  </Timeline>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditManagement;
