"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
import {
  fileUrl,
  useApplicants,
  useDrive,
  useDrives,
  useUpdateApplication,
} from "@/lib/hooks";
import type { ApplicantRow, ApplicationStatusApi } from "@/lib/api-types";
import {
  APP_STATUS_LABEL,
  APP_STATUS_TONE,
  DRIVE_STATUS_LABEL,
  DRIVE_STATUS_TONE,
  PROCESS_TYPE_LABEL,
  RECRUITER_SETTABLE_STATUSES,
  STAGE_META,
  formatDate,
  formatPay,
  initialsOf,
} from "./mappers";

export default function CompanyDrivesPage() {
  const [driveId, setDriveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ApplicantRow | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Debounce the roster search before passing it through to the server.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const drivesQuery = useDrives({});
  const drives = drivesQuery.data?.items ?? [];
  const selectedId = driveId ?? drives[0]?.id ?? null;

  const driveQuery = useDrive(selectedId);
  const drive = driveQuery.data;

  const applicantsQuery = useApplicants(selectedId, search ? { search } : {});
  const applicants = applicantsQuery.data?.items ?? [];

  const updateApplication = useUpdateApplication();
  const pendingRowId = updateApplication.isPending
    ? updateApplication.variables?.id
    : null;

  const shortlistedCount = applicants.filter(
    (a) =>
      a.isShortlisted ||
      a.status === "shortlisted" ||
      a.status === "interview" ||
      a.status === "offered"
  ).length;

  const openResume = async (key: string) => {
    setResumeLoading(true);
    setResumeError(null);
    try {
      const url = await fileUrl(key);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setResumeError(
        e instanceof Error ? e.message : "Couldn't open the resume."
      );
    } finally {
      setResumeLoading(false);
    }
  };

  const columns: Column<ApplicantRow>[] = [
    {
      header: "Candidate",
      render: (a) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 text-label-sm font-label-sm font-semibold">
            {initialsOf(a.student.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-body-md font-body-md text-text-primary truncate">
              {a.student.fullName}
            </p>
            <p className="text-label-sm font-label-sm text-text-secondary">
              {a.student.rollNo}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Branch",
      render: (a) => (
        <span className="text-body-md font-body-md text-text-secondary whitespace-nowrap">
          {a.student.branchCode ?? "—"}
        </span>
      ),
    },
    {
      header: "CPI",
      render: (a) => (
        <span className="text-body-md font-body-md text-text-primary font-semibold">
          {a.student.cpi ?? "—"}
        </span>
      ),
    },
    {
      header: "Applied",
      render: (a) => (
        <span className="text-label-md font-label-md text-text-secondary whitespace-nowrap">
          {formatDate(a.appliedAt)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (a) => (
        <StatusBadge tone={APP_STATUS_TONE[a.status]}>
          {APP_STATUS_LABEL[a.status]}
        </StatusBadge>
      ),
    },
    {
      header: "Manage",
      render: (a) => {
        const rowPending = pendingRowId === a.id;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() =>
                updateApplication.mutate({
                  id: a.id,
                  isShortlisted: !a.isShortlisted,
                })
              }
              disabled={rowPending}
              title={a.isShortlisted ? "Remove from shortlist" : "Shortlist"}
              aria-label={
                a.isShortlisted ? "Remove from shortlist" : "Shortlist"
              }
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-50",
                a.isShortlisted
                  ? "bg-secondary-fixed text-on-secondary-fixed"
                  : "text-text-secondary hover:bg-surface-variant"
              )}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={
                  a.isShortlisted
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                star
              </span>
            </button>
            <select
              value={a.status}
              onChange={(e) =>
                updateApplication.mutate({
                  id: a.id,
                  status: e.target.value as ApplicationStatusApi,
                })
              }
              disabled={rowPending}
              aria-label="Set application status"
              className="bg-surface border border-surface-border rounded px-1.5 py-1 text-label-sm font-label-sm text-text-primary focus:border-primary outline-none transition-colors disabled:opacity-50"
            >
              {RECRUITER_SETTABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {APP_STATUS_LABEL[s]}
                </option>
              ))}
              {!RECRUITER_SETTABLE_STATUSES.includes(a.status) && (
                <option value={a.status} disabled>
                  {APP_STATUS_LABEL[a.status]}
                </option>
              )}
            </select>
          </div>
        );
      },
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (a) => (
        <button
          type="button"
          onClick={() => {
            setSelected(a);
            setResumeError(null);
          }}
          className="inline-flex items-center gap-1 text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          View
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1">
      <PortalHeader
        title="My Drives"
        subtitle={drives[0]?.company.name ?? "Your job announcements"}
        actions={
          drives.length > 0 ? (
            <div className="w-full sm:w-auto">
              <label htmlFor="drive-select" className="sr-only">
                Select drive
              </label>
              <select
                id="drive-select"
                value={selectedId ?? ""}
                onChange={(e) => {
                  setDriveId(e.target.value);
                  setQuery("");
                  setSelected(null);
                }}
                className="w-full sm:w-72 bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} • {PROCESS_TYPE_LABEL[d.processType]}
                  </option>
                ))}
              </select>
            </div>
          ) : undefined
        }
      />

      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-6 space-y-6">
        {drivesQuery.isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-44 rounded-xl bg-surface-variant" />
            <div className="h-32 rounded-xl bg-surface-variant" />
            <div className="h-72 rounded-xl bg-surface-variant" />
          </div>
        ) : drivesQuery.isError ? (
          <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-body-md font-body-md text-status-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              Couldn&apos;t load your drives
              {drivesQuery.error instanceof Error
                ? ` — ${drivesQuery.error.message}`
                : ""}
              .
            </p>
            <button
              type="button"
              onClick={() => drivesQuery.refetch()}
              className="px-4 py-2 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors shrink-0 self-start sm:self-auto"
            >
              Retry
            </button>
          </div>
        ) : drives.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-surface-border p-10 text-center elevation-1">
            <span className="material-symbols-outlined text-[36px] text-text-secondary block mb-3">
              campaign
            </span>
            <p className="text-title-md font-title-md text-text-primary mb-1">
              No drives yet
            </p>
            <p className="text-body-md font-body-md text-text-secondary">
              Create a job announcement to start a placement drive.
            </p>
          </div>
        ) : (
          <>
            {/* Drive summary */}
            {driveQuery.isLoading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-44 rounded-xl bg-surface-variant" />
                <div className="h-32 rounded-xl bg-surface-variant" />
              </div>
            ) : driveQuery.isError ? (
              <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-body-md font-body-md text-status-error flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  Couldn&apos;t load this drive
                  {driveQuery.error instanceof Error
                    ? ` — ${driveQuery.error.message}`
                    : ""}
                  .
                </p>
                <button
                  type="button"
                  onClick={() => driveQuery.refetch()}
                  className="px-4 py-2 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors shrink-0 self-start sm:self-auto"
                >
                  Retry
                </button>
              </div>
            ) : drive ? (
              <>
                <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-5 md:p-6 elevation-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-title-lg font-title-lg text-text-primary">
                          {drive.title}
                        </h2>
                        <StatusBadge tone={DRIVE_STATUS_TONE[drive.status]}>
                          {DRIVE_STATUS_LABEL[drive.status]}
                        </StatusBadge>
                      </div>
                      {drive.description && (
                        <p className="text-body-md font-body-md text-text-secondary max-w-2xl">
                          {drive.description}
                        </p>
                      )}
                    </div>
                    {/* Recruiters can edit their own drive only before TPC acts on it. */}
                    {(drive.status === "draft" || drive.status === "pending_approval") && (
                      <Link
                        href={`/jaf?id=${drive.id}`}
                        className="shrink-0 self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border text-text-primary text-label-md font-label-md hover:bg-surface-container-low hover:border-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit drive
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                    {[
                      {
                        icon: "category",
                        label: "Process",
                        value: PROCESS_TYPE_LABEL[drive.processType],
                      },
                      {
                        icon: "payments",
                        label: "CTC",
                        value: formatPay(drive.ctcLpa, drive.stipendPerMonth),
                      },
                      {
                        icon: "location_on",
                        label: "Location",
                        value: drive.location ?? "—",
                      },
                      {
                        icon: "event_busy",
                        label: "Deadline",
                        value: drive.applicationDeadline
                          ? formatDate(drive.applicationDeadline)
                          : "—",
                      },
                    ].map((f) => (
                      <div key={f.label}>
                        <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                          {f.label}
                        </p>
                        <p className="text-body-md font-body-md text-text-primary font-semibold">
                          {f.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Important dates (drive stages) */}
                <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-5 md:p-6 elevation-1">
                  <h3 className="text-title-md font-title-md text-text-primary mb-4">
                    Important Dates
                  </h3>
                  {drive.stages.length === 0 ? (
                    <p className="text-body-md font-body-md text-text-secondary text-center py-6">
                      No stages scheduled for this drive yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {[...drive.stages]
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((s) => {
                          const done = s.status === "completed";
                          const meta = STAGE_META[s.type];
                          return (
                            <div
                              key={s.id}
                              className={cn(
                                "rounded-lg border p-3 flex flex-col gap-1",
                                done
                                  ? "border-surface-border bg-surface-container-low"
                                  : "border-primary/30 bg-primary-fixed/20"
                              )}
                            >
                              <span
                                className={cn(
                                  "material-symbols-outlined text-[20px]",
                                  done ? "text-text-secondary" : "text-primary"
                                )}
                                style={
                                  done
                                    ? undefined
                                    : { fontVariationSettings: "'FILL' 1" }
                                }
                              >
                                {done ? "check_circle" : meta.icon}
                              </span>
                              <span className="text-label-sm font-label-sm text-text-secondary">
                                {s.label ?? meta.label}
                              </span>
                              <span className="text-body-md font-body-md text-text-primary font-semibold">
                                {s.scheduledAt ? formatDate(s.scheduledAt) : "TBA"}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </section>
              </>
            ) : null}

            {/* Applicants */}
            <section className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
              <div className="p-5 md:p-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-title-md font-title-md text-text-primary">
                    Applicants
                  </h3>
                  <p className="text-label-sm font-label-sm text-text-secondary mt-0.5">
                    {applicantsQuery.data
                      ? `${applicantsQuery.data.total} applied · ${shortlistedCount} in process`
                      : "Loading roster…"}
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-secondary">
                    search
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, roll, branch…"
                    className="w-full bg-surface border border-surface-border rounded-lg pl-9 pr-3 py-2 text-body-md font-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>

              {updateApplication.isError && (
                <div className="mx-5 md:mx-6 mt-4 rounded-lg bg-status-error/10 border border-status-error/20 px-3 py-2 text-label-md font-label-md text-status-error flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  Update failed
                  {updateApplication.error instanceof Error
                    ? ` — ${updateApplication.error.message}`
                    : ""}
                  .
                </div>
              )}

              {applicantsQuery.isLoading ? (
                <div className="animate-pulse space-y-3 p-5 md:p-6">
                  <div className="h-10 rounded-lg bg-surface-variant" />
                  <div className="h-10 rounded-lg bg-surface-variant" />
                  <div className="h-10 rounded-lg bg-surface-variant" />
                </div>
              ) : applicantsQuery.isError ? (
                <div className="p-5 md:p-6">
                  <div className="bg-status-error/10 border border-status-error/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-body-md font-body-md text-status-error flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">error</span>
                      Couldn&apos;t load applicants
                      {applicantsQuery.error instanceof Error
                        ? ` — ${applicantsQuery.error.message}`
                        : ""}
                      .
                    </p>
                    <button
                      type="button"
                      onClick={() => applicantsQuery.refetch()}
                      className="px-4 py-2 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors shrink-0 self-start sm:self-auto"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : applicants.length === 0 ? (
                <p className="text-body-md font-body-md text-text-secondary text-center py-12">
                  {search
                    ? "No applicants match your search."
                    : "No applications received yet."}
                </p>
              ) : (
                <DataTable
                  columns={columns}
                  rows={applicants}
                  className="min-w-[820px]"
                  theadClassName="border-b border-surface-border"
                  thClassName="px-5 md:px-6 py-3 text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                  tdClassName="px-5 md:px-6 py-3 align-middle"
                  rowClassName={(_, i) =>
                    cn("border-b border-surface-border/60", i % 2 === 1 && "bg-surface/40")
                  }
                />
              )}
            </section>
          </>
        )}
      </div>

      {/* Applicant profile / resume modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-surface-container-lowest rounded-xl border border-surface-border w-full max-w-lg elevation-2 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="sticky top-0 bg-surface-container-lowest border-b border-surface-border p-5 flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 text-title-md font-title-md font-semibold">
                {initialsOf(selected.student.fullName)}
              </div>
              <div className="min-w-0 grow">
                <h3 className="text-title-lg font-title-lg text-text-primary truncate">
                  {selected.student.fullName}
                </h3>
                <p className="text-label-md font-label-md text-text-secondary">
                  {[
                    selected.student.rollNo,
                    selected.student.branchCode,
                    selected.student.cpi != null
                      ? `CPI ${selected.student.cpi}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-2">
                  <StatusBadge tone={APP_STATUS_TONE[selected.status]}>
                    {APP_STATUS_LABEL[selected.status]}
                  </StatusBadge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="w-9 h-9 rounded-full hover:bg-surface-variant flex items-center justify-center text-text-secondary shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body — roster API exposes academic fields only (no contact/skills/links) */}
            <div className="p-5 space-y-5">
              <div>
                <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
                  Application
                </p>
                <div className="space-y-1.5">
                  <p className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                    <span className="material-symbols-outlined text-[18px] shrink-0">event</span>
                    Applied on {formatDate(selected.appliedAt)}
                  </p>
                  <p className="flex items-center gap-2 text-body-md font-body-md text-text-secondary">
                    <span className="material-symbols-outlined text-[18px] shrink-0">star</span>
                    {selected.isShortlisted
                      ? "On your shortlist"
                      : "Not on your shortlist"}
                  </p>
                </div>
              </div>

              {resumeError && (
                <div className="rounded-lg bg-status-error/10 border border-status-error/20 px-3 py-2 text-label-md font-label-md text-status-error flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {resumeError}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="sticky bottom-0 bg-surface-container-lowest border-t border-surface-border p-5 flex flex-col sm:flex-row gap-3">
              {selected.student.resumeUrl ? (
                <button
                  type="button"
                  onClick={() => openResume(selected.student.resumeUrl!)}
                  disabled={resumeLoading}
                  className="flex-1 btn-gradient text-on-primary rounded-lg py-2.5 px-4 text-label-md font-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">description</span>
                  {resumeLoading ? "Opening…" : "Download Resume"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-lg py-2.5 px-4 text-label-md font-label-md flex items-center justify-center gap-2 bg-surface-variant text-text-secondary cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[20px]">description</span>
                  No resume
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-variant transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
