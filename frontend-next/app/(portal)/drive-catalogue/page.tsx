"use client";

import { useEffect, useMemo, useState } from "react";
import { fileUrl, useApply, useDrive, useDrives } from "@/lib/hooks";
import type {
  DriveCard,
  DriveDetail,
  DriveStage,
  ProcessTypeApi,
  StageTypeApi,
} from "@/lib/api-types";

// ---------- local display mappers (API → mock-shaped strings) ----------

type TabKey = "upcoming" | "ongoing" | "closed";
type SortKey = "deadline" | "ctc" | "company";

const TABS: { key: TabKey; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "closed", label: "Closed" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "deadline", label: "Deadline (Soonest)" },
  { key: "ctc", label: "CTC (Highest)" },
  { key: "company", label: "Company (A–Z)" },
];

const PROCESS_LABELS: Record<ProcessTypeApi, string> = {
  internship: "Internship",
  six_month_fte: "6M + FTE",
  six_month_ppo: "6M + PPO",
  fte: "FTE",
};

const STAGE_LABELS: Record<StageTypeApi, string> = {
  registration: "Registration",
  ppt: "Pre-Placement Talk",
  online_assessment: "Online Assessment",
  group_discussion: "Group Discussion",
  shortlisting: "Shortlisting",
  interview: "Interviews",
  offer: "Offer",
};

const REASON_LABELS: Record<string, string> = {
  "below-min-cpi": "CPI below minimum",
  "active-backlog": "Active backlog",
  "branch-not-eligible": "Branch not eligible",
  "program-not-eligible": "Programme not eligible",
  blocked: "Account restricted",
  "already-placed": "Already placed",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad2 = (n: number) => String(n).padStart(2, "0");

const titleCase = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const humaniseReasons = (reasons: string[]) =>
  reasons.map((r) => REASON_LABELS[r] ?? titleCase(r)).join("; ");

/** ISO → "Oct 24". */
function shortDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${pad2(d.getDate())}`;
}

/** ISO → "Oct 24, 11:59 PM" (date only when the time is midnight). */
function formatDeadline(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = `${MONTHS[d.getMonth()]} ${pad2(d.getDate())}`;
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return date;
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${date}, ${hour}:${pad2(m)} ${h >= 12 ? "PM" : "AM"}`;
}

/** Days until an ISO deadline (ceil; negative once passed; Infinity when unset). */
function daysUntil(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** "Texas Instruments" → "TI". */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

/** ctcLpa → "₹32.5 LPA"; stipend → "₹1.2L / month". */
function compensation(drive: Pick<DriveCard, "ctcLpa" | "stipendPerMonth">): string {
  if (drive.ctcLpa != null) return `₹${drive.ctcLpa} LPA`;
  if (drive.stipendPerMonth != null) {
    return drive.stipendPerMonth >= 100_000
      ? `₹${(drive.stipendPerMonth / 100_000).toFixed(1)}L / month`
      : `₹${Math.round(drive.stipendPerMonth / 1_000)}K / month`;
  }
  return "—";
}

/**
 * UI tab ← API status mapping. The API takes a single `status` param, so:
 * - the Upcoming & Ongoing tabs share one `status=open` query and are split
 *   client-side on whether a stage is currently `ongoing`;
 * - the Closed tab queries `status=closed` (the only terminal status the
 *   student scope serves); the client-side filter additionally accepts
 *   `completed` / `cancelled` should the backend ever include them.
 */
function tabOf(d: DriveCard): TabKey {
  if (d.status === "closed" || d.status === "completed" || d.status === "cancelled") return "closed";
  if (d.currentStage?.status === "ongoing") return "ongoing";
  return "upcoming";
}

/** Eligibility is student-scope only — default to eligible for other roles. */
const isEligible = (d: DriveCard) => d.eligibility?.isEligible ?? true;

const ineligibleReason = (d: DriveCard) =>
  d.eligibility && d.eligibility.reasons.length > 0 ? humaniseReasons(d.eligibility.reasons) : null;

function deadlineText(d: DriveCard, tab: TabKey): string {
  if (tab === "closed") return d.applicationDeadline ? `Closed ${shortDate(d.applicationDeadline)}` : "Closed";
  if (tab === "ongoing") return "Closed — In Process";
  return formatDeadline(d.applicationDeadline);
}

/** Eligibility bullet list for the detail modal. */
function eligibilityCriteria(d: DriveDetail): string[] {
  const items: string[] = [];
  if (d.minCpi != null) items.push(`CPI ≥ ${d.minCpi}`);
  if (d.eligibleBranches.length > 0) items.push(`Branches: ${d.eligibleBranches.join(" / ")}`);
  if (d.eligiblePrograms.length > 0) items.push(`Programs: ${d.eligiblePrograms.join(" / ")}`);
  items.push(d.allowBacklog ? "Active backlogs allowed" : "No active backlogs");
  if (d.customRules) items.push(d.customRules);
  return items;
}

function stageDateText(s: DriveStage): string {
  const base = s.scheduledAt ? shortDate(s.scheduledAt) : "TBD";
  if (s.status === "completed") return `${base} ✓`;
  if (s.status === "ongoing") return `${base} (ongoing)`;
  return base;
}

// Closing-soon deadline highlight.
const deadlineTone = (daysLeft: number) => {
  if (daysLeft <= 0) return "text-text-secondary";
  if (daysLeft <= 3) return "text-status-error";
  if (daysLeft <= 7) return "text-status-warning";
  return "text-on-surface";
};

const DriveCatalogue = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("deadline");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<DriveCard | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [docError, setDocError] = useState<string | null>(null);

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const drivesQuery = useDrives({
    status: activeTab === "closed" ? "closed" : "open",
    search: search || undefined,
    sort: sortBy,
  });
  const detailQuery = useDrive(selected?.id ?? null);
  const apply = useApply();

  // Server handles search + sort; the client splits open drives into tabs
  // and applies the eligible-only toggle.
  const visibleDrives = useMemo(() => {
    const items = drivesQuery.data?.items ?? [];
    return items
      .filter((d) => tabOf(d) === activeTab)
      .filter((d) => (eligibleOnly ? isEligible(d) : true));
  }, [drivesQuery.data, activeTab, eligibleOnly]);

  const hasApplied = (d: DriveCard) => d.hasApplied === true || appliedIds.has(d.id);

  const handleApply = (id: string) => {
    apply.mutate(id, {
      onSuccess: () => setAppliedIds((prev) => new Set(prev).add(id)),
    });
  };

  const openDocument = async (key: string) => {
    setDocError(null);
    try {
      const url = await fileUrl(key);
      window.open(url, "_blank", "noopener");
    } catch {
      setDocError("Could not open the document — please try again.");
    }
  };

  /** Footer / card action button — identical states in the grid and the modal. */
  const renderAction = (drive: DriveCard, dense: boolean) => {
    const tab = tabOf(drive);
    const px = dense ? "px-4" : "px-5";
    if (tab === "closed") {
      return (
        <span className="bg-surface-container-highest text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md">
          {dense ? "Closed" : "Drive Closed"}
        </span>
      );
    }
    if (!isEligible(drive)) {
      return (
        <button
          disabled
          className="bg-surface-container-highest text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md cursor-not-allowed"
        >
          Apply Locked
        </button>
      );
    }
    if (hasApplied(drive) || tab === "ongoing") {
      return (
        <span className="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-2 rounded-lg text-label-md font-label-md">
          In Process
        </span>
      );
    }
    const applying = apply.isPending && apply.variables === drive.id;
    return (
      <button
        onClick={() => handleApply(drive.id)}
        disabled={applying}
        className={`bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary ${px} py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60`}
      >
        {applying ? "Applying…" : "Apply Now"}
      </button>
    );
  };

  const applyErrorFor = (driveId: string): string | null =>
    apply.isError && apply.variables === driveId
      ? apply.error?.message || "Could not apply — please try again."
      : null;

  const detail = detailQuery.data;

  return (
    <>
      {/* Header */}
      <header className="bg-surface sticky top-0 z-30 border-b border-surface-border px-gutter-desktop py-6">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-headline-md font-headline-md text-text-primary">Drive Catalogue</h2>
            <p className="text-body-md font-body-md text-text-secondary mt-1">
              Explore and apply for upcoming placement and internship opportunities.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                placeholder="Search companies or roles..."
                type="text"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`p-2 border rounded-xl transition-colors flex items-center justify-center ${
                  eligibleOnly || showFilter
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-surface-border text-on-surface-variant hover:bg-surface-variant"
                }`}
                aria-label="Filter"
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-surface-border rounded-xl elevation-2 p-4 z-40">
                  <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-3">
                    Filters
                  </p>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-body-md font-body-md text-text-primary">Eligible only</span>
                    <input
                      type="checkbox"
                      checked={eligibleOnly}
                      onChange={(e) => setEligibleOnly(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="flex-1 px-gutter-desktop py-8 max-w-container-max mx-auto w-full">
        {/* Controls (Tabs & Sort) */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="bg-surface-container-low p-1 rounded-xl inline-flex w-full sm:w-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-title-md font-title-md transition-all ${
                  activeTab === tab.key
                    ? "bg-surface shadow-sm text-primary"
                    : "text-text-secondary hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-body-md font-body-md text-text-secondary w-full sm:w-auto justify-end">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-transparent border-none text-primary font-medium focus:ring-0 cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drives Grid */}
        {drivesQuery.isPending ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-xl bg-surface-variant animate-pulse"></div>
            ))}
          </div>
        ) : drivesQuery.isError ? (
          <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-error">error</span>
              <div>
                <p className="text-title-md font-title-md text-text-primary">Couldn&apos;t load drives</p>
                <p className="text-body-md font-body-md text-text-secondary">
                  {drivesQuery.error.message || "Something went wrong while fetching drives."}
                </p>
              </div>
            </div>
            <button
              onClick={() => void drivesQuery.refetch()}
              className="shrink-0 px-4 py-2 rounded-lg border border-status-error/20 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : visibleDrives.length === 0 ? (
          <div className="text-center py-24 text-text-secondary">
            <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">search_off</span>
            <p className="text-title-md font-title-md">No drives match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleDrives.map((drive) => {
              const tab = tabOf(drive);
              const eligible = isEligible(drive);
              const reason = ineligibleReason(drive);
              const days = daysUntil(drive.applicationDeadline);
              const applyError = applyErrorFor(drive.id);
              return (
                <article
                  key={drive.id}
                  className={`bg-surface rounded-xl border border-surface-border soft-shadow p-6 flex flex-col relative overflow-hidden ${
                    eligible ? "hover-lift hover:border-navy-vibrant" : "opacity-90"
                  }`}
                >
                  {eligible && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed-dim opacity-10 rounded-bl-full -z-10"></div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                        {initialsOf(drive.company.name)}
                      </div>
                      <div>
                        <h3 className="text-title-lg font-title-lg text-text-primary">{drive.company.name}</h3>
                        <p className="text-label-md font-label-md text-text-secondary">{drive.title}</p>
                      </div>
                    </div>
                    {eligible ? (
                      <span className="inline-flex items-center gap-1 bg-status-success/10 text-status-success px-2 py-1 rounded-md text-label-sm font-label-sm shrink-0">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-status-error/10 text-status-error px-2 py-1 rounded-md text-label-sm font-label-sm shrink-0">
                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                        Ineligible
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container-low p-3 rounded-lg">
                      <span className="block text-label-sm font-label-sm text-text-secondary mb-1">CTC / Stipend</span>
                      <span className="text-title-md font-title-md text-on-surface">{compensation(drive)}</span>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-lg">
                      <span className="block text-label-sm font-label-sm text-text-secondary mb-1">Deadline</span>
                      <span
                        className={`text-title-md font-title-md ${deadlineTone(
                          tab === "upcoming" && Number.isFinite(days) ? days : 0
                        )}`}
                      >
                        {deadlineText(drive, tab)}
                      </span>
                    </div>
                  </div>

                  {/* Process type + tags + deadline highlight */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded-md text-label-sm font-label-sm">
                      {PROCESS_LABELS[drive.processType]}
                    </span>
                    {drive.skills.map((tag) => (
                      <span
                        key={tag}
                        className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-label-sm font-label-sm"
                      >
                        {tag}
                      </span>
                    ))}
                    {tab === "upcoming" && Number.isFinite(days) && days > 0 && days <= 3 && (
                      <span className="ml-auto inline-flex items-center gap-1 bg-status-error/10 text-status-error px-2 py-1 rounded-md text-label-sm font-label-sm font-bold">
                        <span className="material-symbols-outlined text-[14px]">timer</span>
                        Closes in {days}d
                      </span>
                    )}
                  </div>

                  {/* Ineligibility note */}
                  {!eligible && reason && (
                    <div className="bg-error-container text-on-error-container p-2 rounded-lg text-label-md font-label-md mb-4 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                      <span>{reason}</span>
                    </div>
                  )}

                  {/* Apply failure (inline) */}
                  {applyError && (
                    <div className="bg-error-container text-on-error-container p-2 rounded-lg text-label-md font-label-md mb-4 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
                      <span>{applyError}</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-surface-border">
                    <button
                      onClick={() => setSelected(drive)}
                      className="text-label-md font-label-md text-primary hover:text-navy-vibrant flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      View Details
                    </button>
                    {renderAction(drive, true)}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}></div>
          <div className="relative z-10 bg-surface-container-lowest rounded-xl border border-surface-border w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar elevation-2">
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-surface-border px-6 py-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                  {initialsOf(selected.company.name)}
                </div>
                <div>
                  <h3 className="text-title-lg font-title-lg text-text-primary">{selected.company.name}</h3>
                  <p className="text-label-md font-label-md text-text-secondary">{selected.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-full hover:bg-surface-variant flex items-center justify-center text-text-secondary transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Process", value: PROCESS_LABELS[selected.processType] },
                  { label: "CTC / Stipend", value: compensation(selected) },
                  { label: "Location", value: selected.location ?? "—" },
                  {
                    label: "Deadline",
                    value: deadlineText(selected, tabOf(selected)),
                    tone: deadlineTone(
                      tabOf(selected) === "upcoming" && Number.isFinite(daysUntil(selected.applicationDeadline))
                        ? daysUntil(selected.applicationDeadline)
                        : 0
                    ),
                  },
                ].map((fact) => (
                  <div key={fact.label} className="bg-surface-container-low p-3 rounded-lg">
                    <span className="block text-label-sm font-label-sm text-text-secondary mb-1">{fact.label}</span>
                    <span className={`text-label-md font-label-md font-medium ${fact.tone ?? "text-on-surface"}`}>
                      {fact.value}
                    </span>
                  </div>
                ))}
              </div>

              {detailQuery.isPending ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-surface-variant rounded w-3/4"></div>
                  <div className="h-4 bg-surface-variant rounded w-full"></div>
                  <div className="h-4 bg-surface-variant rounded w-5/6"></div>
                  <div className="h-24 bg-surface-variant rounded-lg"></div>
                </div>
              ) : detailQuery.isError ? (
                <div className="bg-status-error/5 border border-status-error/20 p-3 rounded-lg text-body-md font-body-md text-text-secondary flex items-center justify-between gap-3">
                  <span className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-status-error mt-0.5">error</span>
                    Couldn&apos;t load the drive details.
                  </span>
                  <button
                    onClick={() => void detailQuery.refetch()}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-status-error/20 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : detail ? (
                <>
                  {/* About */}
                  <div>
                    <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">
                      About the Role
                    </h4>
                    <p className="text-body-md font-body-md text-text-secondary">
                      {detail.description ?? "No description provided."}
                    </p>
                  </div>

                  {/* Eligibility */}
                  <div>
                    <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">
                      Eligibility Criteria
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {eligibilityCriteria(detail).map((item) => (
                        <li key={item} className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                          <span className="material-symbols-outlined text-[16px] text-status-success">
                            check_circle
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-3">
                      Process Timeline
                    </h4>
                    {detail.stages.length === 0 ? (
                      <p className="text-body-md font-body-md text-text-secondary">No stages published yet.</p>
                    ) : (
                      <div className="relative border-l border-surface-variant ml-2 space-y-4">
                        {[...detail.stages]
                          .sort((a, b) => a.sequence - b.sequence)
                          .map((stage) => (
                            <div key={stage.id} className="relative pl-5">
                              <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-primary rounded-full"></div>
                              <div className="flex justify-between items-center">
                                <span className="text-body-md font-body-md text-text-primary">
                                  {stage.label ?? STAGE_LABELS[stage.type]}
                                </span>
                                <span className="text-label-md font-label-md text-text-secondary">
                                  {stageDateText(stage)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">
                      Documents
                    </h4>
                    {detail.documents.length === 0 ? (
                      <p className="text-body-md font-body-md text-text-secondary">No documents attached.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.documents.map((doc) => {
                          const inner = (
                            <>
                              <span className="material-symbols-outlined text-primary">description</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-label-md font-label-md text-text-primary truncate">{doc.name}</p>
                                <p className="text-label-sm font-label-sm text-text-secondary">
                                  {doc.type.toUpperCase()}
                                </p>
                              </div>
                              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">
                                download
                              </span>
                            </>
                          );
                          const rowClass =
                            "flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-surface-border hover:border-primary transition-colors group";
                          // Storage keys are presigned on click; absolute URLs open directly.
                          return /^https?:\/\//i.test(doc.fileUrl) ? (
                            <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className={rowClass}>
                              {inner}
                            </a>
                          ) : (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => void openDocument(doc.fileUrl)}
                              className={`w-full text-left ${rowClass}`}
                            >
                              {inner}
                            </button>
                          );
                        })}
                        {docError && (
                          <p className="text-label-sm font-label-sm text-status-error">{docError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {/* Ineligibility block */}
              {!isEligible(selected) && ineligibleReason(selected) && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-body-md font-body-md flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] mt-0.5">info</span>
                  <span>{ineligibleReason(selected)}</span>
                </div>
              )}

              {/* Apply failure (inline) */}
              {applyErrorFor(selected.id) && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-body-md font-body-md flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                  <span>{applyErrorFor(selected.id)}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-surface-container-lowest/95 backdrop-blur-sm border-t border-surface-border px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-variant transition-colors"
              >
                Close
              </button>
              {renderAction(selected, false)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriveCatalogue;
