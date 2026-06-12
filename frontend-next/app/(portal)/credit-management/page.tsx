"use client";

import { useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import {
  CREDIT_STUDENTS,
  CREDIT_REASONS,
  type CreditStudent,
  type CreditEntry,
} from "@/data/credit";
import { cn } from "@/lib/utils";

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

const CreditManagement = () => {
  const [query, setQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("All reasons");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Working copy so mock adjustments persist for the session.
  const [students, setStudents] = useState<CreditStudent[]>(CREDIT_STUDENTS);

  // Adjust form state.
  const [amount, setAmount] = useState(5);
  const [adjustReason, setAdjustReason] = useState(CREDIT_REASONS[0]);
  const [note, setNote] = useState("");

  const selected = useMemo(
    () => students.find((s) => s.id === selectedId) ?? null,
    [students, selectedId]
  );

  const visibleStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q))
      .filter((s) =>
        reasonFilter === "All reasons"
          ? true
          : s.history.some((h) => h.reason === reasonFilter)
      )
      .filter((s) =>
        statusFilter === "All" ? true : creditLabel(s.credits) === statusFilter
      );
  }, [students, query, reasonFilter, statusFilter]);

  const openStudent = (student: CreditStudent) => {
    setSelectedId(student.id);
    setAmount(5);
    setAdjustReason(CREDIT_REASONS[0]);
    setNote("");
  };

  const applyAdjustment = () => {
    if (!selected || amount === 0 || !adjustReason) return;
    const entry: CreditEntry = {
      date: new Date().toISOString().slice(0, 10),
      delta: amount,
      reason: adjustReason,
      by: "You (Admin)",
    };
    setStudents((prev) =>
      prev.map((s) =>
        s.id === selected.id
          ? {
              ...s,
              credits: Math.max(0, s.credits + amount),
              history: [entry, ...s.history],
            }
          : s
      )
    );
    setNote("");
  };

  const columns: Column<CreditStudent>[] = [
    {
      header: "Roll No",
      className: "py-3 px-4 font-mono text-label-md text-text-secondary",
      render: (s) => s.roll,
    },
    {
      header: "Name",
      className: "py-3 px-4",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-label-md font-bold shrink-0">
            {s.initials}
          </div>
          <span className="font-medium text-text-primary">{s.name}</span>
        </div>
      ),
    },
    {
      header: "Branch",
      className: "py-3 px-4 text-text-secondary",
      render: (s) => s.branch,
    },
    {
      header: "Current Credits",
      className: "py-3 px-4",
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-title-md text-on-surface">{s.credits}</span>
          <StatusBadge tone={creditTone(s.credits)} bordered>
            {creditLabel(s.credits)}
          </StatusBadge>
        </div>
      ),
    },
    {
      header: "Last Change",
      className: "py-3 px-4",
      render: (s) => {
        const last = s.history[0];
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
              onChange={(e) => setQuery(e.target.value)}
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
              onChange={(e) => setReasonFilter(e.target.value)}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Healthy">Healthy</option>
              <option value="Low">Low</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <span className="sm:ml-auto text-label-md font-label-md text-text-secondary">
            {visibleStudents.length} student{visibleStudents.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Students table */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
          {visibleStudents.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                search_off
              </span>
              <p className="text-title-md font-title-md">No students match your filters</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={visibleStudents}
              theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
              thClassName="py-3 px-4 font-semibold border-b border-surface-border text-left"
              rowClassName={() =>
                "border-b border-surface-border last:border-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface"
              }
            />
          )}
        </div>
      </div>

      {/* Selected-student panel (modal) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          ></div>
          <div className="relative z-10 bg-surface-container-lowest rounded-xl border border-surface-border w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar elevation-2">
            {/* Header */}
            <div className="sticky top-0 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-surface-border px-6 py-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-title-md font-bold shrink-0">
                  {selected.initials}
                </div>
                <div>
                  <h3 className="text-title-lg font-title-lg text-text-primary">{selected.name}</h3>
                  <p className="text-label-md font-label-md text-text-secondary">
                    {selected.roll} · {selected.branch}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
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
                    {selected.credits}
                  </span>
                </div>
                <StatusBadge
                  tone={creditTone(selected.credits)}
                  bordered
                  className="px-3 py-1 text-label-md font-label-md"
                >
                  {creditLabel(selected.credits)}
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

                  <button
                    onClick={applyAdjustment}
                    disabled={amount === 0 || !adjustReason}
                    className="w-full btn-gradient text-on-primary py-2.5 rounded-lg text-title-md font-title-md shadow-sm hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Apply Adjustment
                  </button>
                </div>
              </div>

              {/* History timeline */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-3">
                  Credit History
                </h4>
                <Timeline spacing="space-y-5">
                  {selected.history.map((h, i) => (
                    <TimelineItem
                      key={`${h.date}-${i}`}
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
                        <span>{h.by}</span>
                        <span>{h.date}</span>
                      </div>
                    </TimelineItem>
                  ))}
                </Timeline>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditManagement;
