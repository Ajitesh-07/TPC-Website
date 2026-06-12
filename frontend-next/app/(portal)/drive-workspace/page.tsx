"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_DRIVES,
  WORKSPACE_APPLICANTS,
  STAGE_TONE,
  STAGE_LABEL,
  type StageStatus,
  type WorkspaceApplicant,
} from "@/data/drive-workspace";

type TabKey = "details" | "applicants";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "applicants", label: "Applicants" },
];

const DriveWorkspace = () => {
  const [activeDriveId, setActiveDriveId] = useState(WORKSPACE_DRIVES[0].id);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [query, setQuery] = useState("");

  // Process-stage statuses are managed in local state so the "Mark Complete" /
  // "Set Current" controls can mutate them without touching the data module.
  const [stageStatuses, setStageStatuses] = useState<
    Record<string, StageStatus[]>
  >(() =>
    Object.fromEntries(
      WORKSPACE_DRIVES.map((d) => [d.id, d.stages.map((s) => s.status)])
    )
  );

  // Per-applicant shortlist state.
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      WORKSPACE_APPLICANTS.map((a) => [
        a.id,
        a.status.tone === "shortlisted",
      ])
    )
  );

  const drive = useMemo(
    () => WORKSPACE_DRIVES.find((d) => d.id === activeDriveId)!,
    [activeDriveId]
  );

  const stages = stageStatuses[activeDriveId];

  const setStage = (index: number, status: StageStatus) => {
    setStageStatuses((prev) => {
      const next = [...prev[activeDriveId]];
      next[index] = status;
      return { ...prev, [activeDriveId]: next };
    });
  };

  const toggleShortlist = (id: string) => {
    setShortlisted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleApplicants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORKSPACE_APPLICANTS;
    return WORKSPACE_APPLICANTS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.roll.toLowerCase().includes(q) ||
        a.branch.toLowerCase().includes(q)
    );
  }, [query]);

  const shortlistCount = useMemo(
    () => Object.values(shortlisted).filter(Boolean).length,
    [shortlisted]
  );

  const APPLICANT_COLUMNS: Column<WorkspaceApplicant>[] = [
    {
      header: "Name",
      className: "px-4 py-3",
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-label-sm font-label-sm font-bold text-navy-vibrant shrink-0">
            {a.initials}
          </div>
          <span className="font-medium text-text-primary">{a.name}</span>
        </div>
      ),
    },
    {
      header: "Roll No",
      className: "px-4 py-3 font-mono text-sm text-text-secondary",
      render: (a) => a.roll,
    },
    {
      header: "Branch",
      className: "px-4 py-3 text-text-secondary",
      render: (a) => a.branch,
    },
    {
      header: "CPI",
      className: "px-4 py-3 font-mono text-sm text-on-surface",
      render: (a) => a.cpi.toFixed(2),
    },
    {
      header: "Applied On",
      className: "px-4 py-3 text-text-secondary",
      render: (a) => a.appliedOn,
    },
    {
      header: "Status",
      className: "px-4 py-3",
      render: (a) => (
        <StatusBadge tone={a.status.tone} className="px-2 py-1 rounded">
          {a.status.label}
        </StatusBadge>
      ),
    },
    {
      header: "Shortlist",
      headerClassName: "text-right",
      className: "px-4 py-3 text-right",
      render: (a) => {
        const on = shortlisted[a.id];
        return (
          <button
            onClick={() => toggleShortlist(a.id)}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-label-sm transition-all",
              on
                ? "bg-secondary-fixed text-on-secondary-fixed"
                : "border border-surface-border text-text-secondary hover:border-primary hover:text-primary"
            )}
            aria-pressed={on}
          >
            <span className="material-symbols-outlined text-[16px]">
              {on ? "check_circle" : "add_circle"}
            </span>
            {on ? "Shortlisted" : "Shortlist"}
          </button>
        );
      },
    },
  ];

  return (
    <>
      {/* Sticky header */}
      <header className="bg-surface sticky top-0 z-30 border-b border-surface-border px-gutter-mobile md:px-gutter-desktop py-6">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-headline-md font-headline-md text-text-primary">
              Drive Workspace
            </h2>
            <p className="text-body-md font-body-md text-text-secondary mt-1">
              Managing{" "}
              <span className="font-medium text-primary">
                {drive.company} &ndash; {drive.role}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="material-symbols-outlined text-text-secondary">
              swap_horiz
            </span>
            <select
              value={activeDriveId}
              onChange={(e) => setActiveDriveId(e.target.value)}
              className="w-full sm:w-72 bg-surface-container-low border border-surface-border rounded-xl px-4 py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer"
            >
              {WORKSPACE_DRIVES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company} &ndash; {d.role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 max-w-container-max mx-auto w-full animate-fadeIn">
        {/* Tab bar */}
        <div className="bg-surface-container-low p-1 rounded-xl inline-flex mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-6 py-2 rounded-lg text-title-md font-title-md transition-all",
                activeTab === tab.key
                  ? "bg-surface shadow-sm text-primary"
                  : "text-text-secondary hover:text-on-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab A — Details */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Drive summary */}
            <div className="lg:col-span-1 bg-surface-container-lowest border border-surface-border rounded-xl elevation-1 p-6 flex flex-col gap-4 h-fit">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                  {drive.company.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-title-lg font-title-lg text-text-primary">
                    {drive.company}
                  </h3>
                  <p className="text-label-md font-label-md text-text-secondary">
                    {drive.role}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3 rounded-lg">
                  <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                    CTC
                  </span>
                  <span className="text-title-md font-title-md text-on-surface">
                    {drive.ctc}
                  </span>
                </div>
                <div className="bg-surface-container-low p-3 rounded-lg">
                  <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                    Deadline
                  </span>
                  <span className="text-title-md font-title-md text-on-surface">
                    {drive.deadline}
                  </span>
                </div>
              </div>
            </div>

            {/* Process stages manager */}
            <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-border rounded-xl elevation-1 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-title-md font-title-md text-text-primary">
                  Process Stages
                </h3>
                <span className="text-label-sm font-label-sm text-text-secondary">
                  {stages.filter((s) => s === "completed").length} of{" "}
                  {stages.length} completed
                </span>
              </div>

              <div className="relative border-l-2 border-surface-variant ml-3 space-y-2">
                {drive.stages.map((stage, i) => {
                  const status = stages[i];
                  const dot =
                    status === "completed"
                      ? "bg-status-success border-status-success"
                      : status === "ongoing"
                        ? "bg-primary border-primary ring-4 ring-primary/15"
                        : "bg-surface border-outline-variant";
                  return (
                    <div key={stage.name} className="relative pl-8 pb-4">
                      <div
                        className={cn(
                          "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2",
                          dot
                        )}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low rounded-lg p-3 border border-surface-border">
                        <div className="flex items-center gap-3">
                          <span className="text-body-md font-body-md font-medium text-text-primary">
                            {stage.name}
                          </span>
                          <StatusBadge
                            tone={STAGE_TONE[status]}
                            className="px-2 py-0.5 rounded"
                          >
                            {STAGE_LABEL[status]}
                          </StatusBadge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                          <button
                            onClick={() => setStage(i, "completed")}
                            disabled={status === "completed"}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-label-sm border border-surface-border text-text-secondary hover:border-status-success hover:text-status-success transition-colors disabled:opacity-40 disabled:hover:border-surface-border disabled:hover:text-text-secondary disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              done
                            </span>
                            Mark Complete
                          </button>
                          <button
                            onClick={() => setStage(i, "ongoing")}
                            disabled={status === "ongoing"}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-label-sm bg-gradient-to-b from-primary to-navy-deep border-t border-primary-fixed-dim/30 text-on-primary shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              flag
                            </span>
                            Set Current
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab B — Applicants */}
        {activeTab === "applicants" && (
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl elevation-1 overflow-hidden">
            {/* Toolbar */}
            <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
              <div>
                <h3 className="text-title-md font-title-md text-text-primary">
                  Applicants
                </h3>
                <p className="text-label-md font-label-md text-text-secondary mt-0.5">
                  {visibleApplicants.length} showing &middot;{" "}
                  <span className="text-primary font-medium">
                    {shortlistCount} shortlisted
                  </span>
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">
                  search
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                  placeholder="Search name, roll, branch..."
                  type="text"
                />
              </div>
            </div>

            {visibleApplicants.length === 0 ? (
              <div className="text-center py-20 text-text-secondary">
                <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                  search_off
                </span>
                <p className="text-title-md font-title-md">
                  No applicants match your search
                </p>
              </div>
            ) : (
              <DataTable
                columns={APPLICANT_COLUMNS}
                rows={visibleApplicants}
                theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                thClassName="px-4 py-3 font-semibold"
                rowClassName={(_, i) =>
                  `border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md ${
                    i % 2 === 1 ? "bg-neutral-50/50" : ""
                  }`
                }
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default DriveWorkspace;
