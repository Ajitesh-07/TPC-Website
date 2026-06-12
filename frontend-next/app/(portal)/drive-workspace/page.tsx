"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
import {
  useApplicants,
  useDrive,
  useDrives,
  useUpdateApplication,
  useUpdateStage,
} from "@/lib/hooks";
import type {
  ApplicantRow,
  ApplicationStatusApi,
  DriveDetail,
  StageStatusApi,
  StageTypeApi,
} from "@/lib/api-types";

type TabKey = "details" | "applicants";

const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "applicants", label: "Applicants" },
];

const PAGE_SIZE = 20;

// ---------- local mappers (API → display) ----------

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** ISO date → "Oct 15, 2024". */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Aarav Sharma" → "AS". */
function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : parts[0].charAt(1);
  return (first + (last ?? "")).toUpperCase();
}

const STAGE_TONE: Record<StageStatusApi, BadgeTone> = {
  completed: "success",
  ongoing: "info",
  upcoming: "neutral",
  skipped: "neutral",
};

const STAGE_LABEL: Record<StageStatusApi, string> = {
  completed: "Completed",
  ongoing: "Ongoing",
  upcoming: "Upcoming",
  skipped: "Skipped",
};

const STAGE_TYPE_LABEL: Record<StageTypeApi, string> = {
  registration: "Registration",
  ppt: "Pre-Placement Talk",
  online_assessment: "Online Assessment",
  group_discussion: "Group Discussion",
  shortlisting: "Shortlisting",
  interview: "Interviews",
  offer: "Offers",
};

const APP_STATUS: Record<ApplicationStatusApi, { label: string; tone: BadgeTone }> = {
  applied: { label: "Applied", tone: "applied" },
  under_review: { label: "Under Review", tone: "info" },
  shortlisted: { label: "Shortlisted", tone: "shortlisted" },
  interview: { label: "Interview", tone: "warning" },
  offered: { label: "Offered", tone: "success" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Rejected", tone: "rejected" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
};

/** Drive money summary for the workspace card. */
function formatCtc(drive: DriveDetail): string {
  if (drive.ctcLpa != null) return `₹ ${drive.ctcLpa} LPA`;
  if (drive.stipendPerMonth != null)
    return `₹ ${drive.stipendPerMonth.toLocaleString("en-IN")}/mo`;
  return "—";
}

/** Small inline error panel with a retry action. */
function ErrorPanel({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3">
      <span className="material-symbols-outlined text-status-error text-[20px]">
        error
      </span>
      <p className="flex-1 text-body-md font-body-md text-status-error">{text}</p>
      <button
        onClick={onRetry}
        className="shrink-0 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

const DriveWorkspace = () => {
  const drivesQuery = useDrives();
  const drives = drivesQuery.data?.items ?? [];

  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const driveId = selectedDriveId ?? drives[0]?.id ?? null;
  const activeCard = drives.find((d) => d.id === driveId) ?? null;

  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the applicant search → server-side `search` param.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const driveQuery = useDrive(driveId);
  const drive = driveQuery.data;
  const updateStage = useUpdateStage(driveId ?? "");
  const applicantsQuery = useApplicants(
    activeTab === "applicants" ? driveId : null,
    { search, page, pageSize: PAGE_SIZE }
  );
  const updateApplication = useUpdateApplication();

  const selectDrive = (id: string) => {
    setSelectedDriveId(id);
    setPage(1);
    setQuery("");
    setSearch("");
  };

  const stagePending = (stageId: string, status: StageStatusApi) =>
    updateStage.isPending &&
    updateStage.variables?.stageId === stageId &&
    updateStage.variables?.status === status;

  const togglingApplicationId = updateApplication.isPending
    ? updateApplication.variables?.id
    : null;

  const applicants = applicantsQuery.data?.items ?? [];
  const applicantsTotal = applicantsQuery.data?.total ?? 0;
  const shortlistCount = applicants.filter((a) => a.isShortlisted).length;
  const pageFrom = applicantsTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(page * PAGE_SIZE, applicantsTotal);

  const APPLICANT_COLUMNS: Column<ApplicantRow>[] = [
    {
      header: "Name",
      className: "px-4 py-3",
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-label-sm font-label-sm font-bold text-navy-vibrant shrink-0">
            {initials(a.student.fullName)}
          </div>
          <span className="font-medium text-text-primary">
            {a.student.fullName}
          </span>
        </div>
      ),
    },
    {
      header: "Roll No",
      className: "px-4 py-3 font-mono text-sm text-text-secondary",
      render: (a) => a.student.rollNo,
    },
    {
      header: "Branch",
      className: "px-4 py-3 text-text-secondary",
      render: (a) => a.student.branchCode ?? "—",
    },
    {
      header: "CPI",
      className: "px-4 py-3 font-mono text-sm text-on-surface",
      render: (a) => (a.student.cpi != null ? a.student.cpi.toFixed(2) : "—"),
    },
    {
      header: "Applied On",
      className: "px-4 py-3 text-text-secondary",
      render: (a) => formatDate(a.appliedAt),
    },
    {
      header: "Status",
      className: "px-4 py-3",
      render: (a) => (
        <StatusBadge tone={APP_STATUS[a.status].tone} className="px-2 py-1 rounded">
          {APP_STATUS[a.status].label}
        </StatusBadge>
      ),
    },
    {
      header: "Shortlist",
      headerClassName: "text-right",
      className: "px-4 py-3 text-right",
      render: (a) => {
        const on = a.isShortlisted;
        const pending = togglingApplicationId === a.id;
        return (
          <button
            onClick={() =>
              updateApplication.mutate({ id: a.id, isShortlisted: !on })
            }
            disabled={pending}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-label-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed",
              on
                ? "bg-secondary-fixed text-on-secondary-fixed"
                : "border border-surface-border text-text-secondary hover:border-primary hover:text-primary"
            )}
            aria-pressed={on}
          >
            <span className="material-symbols-outlined text-[16px]">
              {on ? "check_circle" : "add_circle"}
            </span>
            {pending ? "Saving…" : on ? "Shortlisted" : "Shortlist"}
          </button>
        );
      },
    },
  ];

  const sortedStages = drive
    ? [...drive.stages].sort((a, b) => a.sequence - b.sequence)
    : [];
  const completedStages = sortedStages.filter(
    (s) => s.status === "completed"
  ).length;

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
              {activeCard ? (
                <>
                  Managing{" "}
                  <span className="font-medium text-primary">
                    {activeCard.company.name} &ndash; {activeCard.title}
                  </span>
                </>
              ) : drivesQuery.isLoading ? (
                "Loading your drives…"
              ) : (
                "Select a drive to manage"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="material-symbols-outlined text-text-secondary">
              swap_horiz
            </span>
            <select
              value={driveId ?? ""}
              onChange={(e) => selectDrive(e.target.value)}
              disabled={drivesQuery.isLoading || drives.length === 0}
              className="w-full sm:w-72 bg-surface-container-low border border-surface-border rounded-xl px-4 py-2 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer disabled:opacity-50"
            >
              {drives.length === 0 && (
                <option value="">
                  {drivesQuery.isLoading ? "Loading drives…" : "No drives"}
                </option>
              )}
              {drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company.name} &ndash; {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 max-w-container-max mx-auto w-full animate-fadeIn">
        {/* Drives list states */}
        {drivesQuery.isLoading && (
          <div className="animate-pulse">
            <div className="h-11 w-56 rounded-xl bg-surface-variant mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-56 rounded-xl bg-surface-variant" />
              <div className="lg:col-span-2 h-80 rounded-xl bg-surface-variant" />
            </div>
          </div>
        )}

        {drivesQuery.isError && (
          <ErrorPanel
            text="Couldn't load your drives."
            onRetry={() => drivesQuery.refetch()}
          />
        )}

        {drivesQuery.isSuccess && drives.length === 0 && (
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl elevation-1 text-center py-20 px-6 text-text-secondary">
            <span className="material-symbols-outlined text-[48px] mb-2 opacity-50 block">
              work_outline
            </span>
            <p className="text-title-md font-title-md text-text-primary">
              No drives to manage yet
            </p>
            <p className="text-body-md font-body-md mt-1 mb-6">
              Create your first placement drive to start managing stages and
              applicants here.
            </p>
            <Link
              href="/add-drive"
              className="inline-flex items-center gap-2 bg-gradient-to-b from-primary to-navy-deep border-t border-primary-fixed-dim/30 text-on-primary px-5 py-2.5 rounded-lg text-label-md font-label-md shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Drive
            </Link>
          </div>
        )}

        {driveId && drives.length > 0 && (
          <>
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
              <>
                {driveQuery.isLoading && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                    <div className="h-56 rounded-xl bg-surface-variant" />
                    <div className="lg:col-span-2 h-80 rounded-xl bg-surface-variant" />
                  </div>
                )}
                {driveQuery.isError && (
                  <ErrorPanel
                    text="Couldn't load this drive's details."
                    onRetry={() => driveQuery.refetch()}
                  />
                )}
                {drive && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Drive summary */}
                    <div className="lg:col-span-1 bg-surface-container-lowest border border-surface-border rounded-xl elevation-1 p-6 flex flex-col gap-4 h-fit">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                          {drive.company.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-title-lg font-title-lg text-text-primary">
                            {drive.company.name}
                          </h3>
                          <p className="text-label-md font-label-md text-text-secondary">
                            {drive.title}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-container-low p-3 rounded-lg">
                          <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                            CTC
                          </span>
                          <span className="text-title-md font-title-md text-on-surface">
                            {formatCtc(drive)}
                          </span>
                        </div>
                        <div className="bg-surface-container-low p-3 rounded-lg">
                          <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                            Deadline
                          </span>
                          <span className="text-title-md font-title-md text-on-surface">
                            {formatDate(drive.applicationDeadline)}
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
                          {completedStages} of {sortedStages.length} completed
                        </span>
                      </div>

                      {updateStage.isError && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-status-error/20 bg-status-error/10 px-3 py-2">
                          <span className="material-symbols-outlined text-status-error text-[18px]">
                            error
                          </span>
                          <p className="text-label-sm font-label-sm text-status-error">
                            {updateStage.error instanceof Error
                              ? updateStage.error.message
                              : "Couldn't update the stage."}
                          </p>
                        </div>
                      )}

                      {sortedStages.length === 0 ? (
                        <p className="text-body-md font-body-md text-text-secondary py-6 text-center">
                          No process stages configured for this drive.
                        </p>
                      ) : (
                        <div className="relative border-l-2 border-surface-variant ml-3 space-y-2">
                          {sortedStages.map((stage) => {
                            const status = stage.status;
                            const dot =
                              status === "completed"
                                ? "bg-status-success border-status-success"
                                : status === "ongoing"
                                  ? "bg-primary border-primary ring-4 ring-primary/15"
                                  : "bg-surface border-outline-variant";
                            return (
                              <div key={stage.id} className="relative pl-8 pb-4">
                                <div
                                  className={cn(
                                    "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2",
                                    dot
                                  )}
                                />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low rounded-lg p-3 border border-surface-border">
                                  <div className="flex items-center gap-3">
                                    <span className="text-body-md font-body-md font-medium text-text-primary">
                                      {stage.label ?? STAGE_TYPE_LABEL[stage.type]}
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
                                      onClick={() =>
                                        updateStage.mutate({
                                          stageId: stage.id,
                                          status: "completed",
                                        })
                                      }
                                      disabled={
                                        status === "completed" ||
                                        updateStage.isPending
                                      }
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-label-sm border border-surface-border text-text-secondary hover:border-status-success hover:text-status-success transition-colors disabled:opacity-40 disabled:hover:border-surface-border disabled:hover:text-text-secondary disabled:cursor-not-allowed"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        done
                                      </span>
                                      {stagePending(stage.id, "completed")
                                        ? "Saving…"
                                        : "Mark Complete"}
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateStage.mutate({
                                          stageId: stage.id,
                                          status: "ongoing",
                                        })
                                      }
                                      disabled={
                                        status === "ongoing" ||
                                        updateStage.isPending
                                      }
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-label-sm font-label-sm bg-gradient-to-b from-primary to-navy-deep border-t border-primary-fixed-dim/30 text-on-primary shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        flag
                                      </span>
                                      {stagePending(stage.id, "ongoing")
                                        ? "Saving…"
                                        : "Set Current"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
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
                      {applicantsTotal} total &middot;{" "}
                      <span className="text-primary font-medium">
                        {shortlistCount} shortlisted on this page
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

                {updateApplication.isError && (
                  <div className="px-5 py-3 border-b border-surface-border flex items-center gap-2 bg-status-error/10">
                    <span className="material-symbols-outlined text-status-error text-[18px]">
                      error
                    </span>
                    <p className="text-label-sm font-label-sm text-status-error">
                      {updateApplication.error instanceof Error
                        ? updateApplication.error.message
                        : "Couldn't update the application."}
                    </p>
                  </div>
                )}

                {applicantsQuery.isLoading ? (
                  <div className="p-5 space-y-3 animate-pulse">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-lg bg-surface-variant" />
                    ))}
                  </div>
                ) : applicantsQuery.isError ? (
                  <div className="p-5">
                    <ErrorPanel
                      text="Couldn't load applicants."
                      onRetry={() => applicantsQuery.refetch()}
                    />
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-20 text-text-secondary">
                    <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                      search_off
                    </span>
                    <p className="text-title-md font-title-md">
                      {search
                        ? "No applicants match your search"
                        : "No applicants yet"}
                    </p>
                  </div>
                ) : (
                  <>
                    <DataTable
                      columns={APPLICANT_COLUMNS}
                      rows={applicants}
                      theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                      thClassName="px-4 py-3 font-semibold"
                      rowClassName={(_, i) =>
                        `border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md ${
                          i % 2 === 1 ? "bg-neutral-50/50" : ""
                        }`
                      }
                    />
                    {applicantsTotal > PAGE_SIZE && (
                      <div className="p-4 border-t border-surface-border flex items-center justify-between bg-surface-bright">
                        <span className="text-label-sm font-label-sm text-text-secondary">
                          Showing {pageFrom}&ndash;{pageTo} of {applicantsTotal}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || applicantsQuery.isFetching}
                            className="px-3 py-1.5 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={
                              pageTo >= applicantsTotal ||
                              applicantsQuery.isFetching
                            }
                            className="px-3 py-1.5 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default DriveWorkspace;
