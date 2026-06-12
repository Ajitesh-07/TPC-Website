"use client";

import Link from "next/link";
import PortalHeader from "@/components/ui/PortalHeader";
import MetricCard from "@/components/ui/MetricCard";
import { useAdminDashboard, useDriveDecision } from "@/lib/hooks";
import { useRole } from "@/components/providers/RoleProvider";
import { ROLE_META } from "@/lib/roles";
import { ADMIN_QUICK_LINKS } from "@/data/admin-dashboard";
import { cn } from "@/lib/utils";

/* ---------- local display helpers (API → view) ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

/** "YYYY-MM-DD" → "Mon, Jun 16". */
const formatEventDate = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

/** "HH:MM" → "10:00 AM". */
const formatTime = (time: string) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** Card art for the four admin stats, in API order. */
const METRIC_STYLES = [
  {
    label: "Total Placements",
    icon: "school",
    iconClassName: "text-primary",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-primary-fixed-dim/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
  },
  {
    label: "Active Companies",
    icon: "domain",
    iconClassName: "text-navy-vibrant",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-navy-vibrant/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
  },
  {
    label: "Registered Students",
    icon: "groups",
    iconClassName: "text-status-success",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-status-success/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
  },
  {
    label: "Pending Approvals",
    icon: "pending_actions",
    iconClassName: "text-status-warning",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-secondary-container/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
  },
] as const;

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

const AdminDashboard = () => {
  const { role, user } = useRole();
  const { data, isLoading, isError, error, refetch } = useAdminDashboard();
  const decision = useDriveDecision();

  const adminName = user?.fullName ?? "Administrator";
  const statValues = data
    ? [
        data.stats.totalPlacements,
        data.stats.activeCompanies,
        data.stats.registeredStudents,
        data.stats.pendingApprovals,
      ]
    : [];

  return (
    <>
      <PortalHeader
        title="Admin Dashboard"
        subtitle="Placement Season 2024-25 • Operations Overview"
        className="bg-surface/90 px-gutter-mobile md:px-gutter-desktop py-6 md:py-8"
        innerClassName="max-w-container-max mx-auto md:flex-row md:items-end"
        titleClassName="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg"
        actions={
          <button className="bg-surface-container-lowest border border-surface-border text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:border-primary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined">download</span>
            Export Report
          </button>
        }
      />

      {/* Content */}
      <div className="p-gutter-mobile md:p-gutter-desktop flex-1 max-w-container-max mx-auto w-full animate-fadeIn">
        {/* Admin information card */}
        <section className="glass-panel rounded-xl border border-surface-border elevation-1 p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-b from-primary to-navy-deep text-on-primary flex items-center justify-center text-title-lg font-title-lg font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
            {initialsOf(adminName)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-title-lg font-title-lg text-text-primary">
              {adminName}
            </h2>
            <p className="text-body-md font-body-md text-text-secondary">
              Career Development Centre
            </p>
            <p className="text-label-sm font-label-sm text-text-secondary mt-1 flex items-center gap-1 min-w-0">
              <span className="material-symbols-outlined text-[16px] shrink-0">mail</span>
              <span className="truncate">{user?.email ?? "—"}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-[16px]">
                admin_panel_settings
              </span>
              {ROLE_META[role].label}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm bg-status-success/10 text-status-success border border-status-success/20">
              <span className="material-symbols-outlined text-[16px]">
                verified
              </span>
              Active
            </span>
          </div>
        </section>

        {isLoading ? (
          <>
            {/* Loading skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {METRIC_STYLES.map((m) => (
                <Skeleton key={m.label} className="h-28 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
              <Skeleton className="h-72 rounded-xl" />
            </div>
            <Skeleton className="h-44 rounded-xl mb-8" />
          </>
        ) : isError ? (
          <div className="mb-8">
            <ErrorPanel
              message={error?.message ?? "Failed to load the dashboard."}
              onRetry={() => refetch()}
            />
          </div>
        ) : data ? (
          <>
            {/* Overview metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {METRIC_STYLES.map((metric, i) => (
                <MetricCard
                  key={metric.label}
                  {...metric}
                  value={(statValues[i] ?? 0).toLocaleString("en-IN")}
                  delta={
                    metric.label === "Pending Approvals"
                      ? { text: "Requires review", tone: "warning", icon: "priority_high" }
                      : undefined
                  }
                />
              ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Placement process overview */}
              <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col">
                <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-bright">
                  <h2 className="text-title-md font-title-md text-text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-secondary">
                      event_note
                    </span>
                    Placement Process Overview
                  </h2>
                  <Link
                    href="/calendar"
                    className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors"
                  >
                    View Calendar
                  </Link>
                </div>
                <div className="p-5">
                  <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-4">
                    Ongoing &amp; Upcoming This Week
                  </p>
                  {data.upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      <span className="material-symbols-outlined text-[40px] opacity-50">
                        event_available
                      </span>
                      <p className="text-title-md font-title-md mt-2">
                        No upcoming events this week
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {data.upcomingEvents.map((event, i) => (
                        <div
                          key={event.id}
                          className={`flex gap-4 relative pb-5 last:pb-0 ${
                            i === data.upcomingEvents.length - 1
                              ? ""
                              : "before:absolute before:left-[5px] before:top-5 before:bottom-0 before:w-px before:bg-surface-border"
                          }`}
                        >
                          <div className="w-3 h-3 rounded-full mt-1.5 shrink-0 relative z-10 ring-4 ring-surface-container-lowest bg-primary"></div>
                          <div className="flex-1 min-w-0">
                            <div className="text-body-md font-body-md text-text-primary font-medium">
                              {event.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-label-sm font-label-sm text-text-secondary">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  calendar_today
                                </span>
                                {formatEventDate(event.eventDate)}
                              </span>
                              {event.startTime && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">
                                    schedule
                                  </span>
                                  {formatTime(event.startTime)}
                                </span>
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">
                                    location_on
                                  </span>
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Process snapshot */}
              <div className="bg-primary text-on-primary rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                <div className="relative z-10">
                  <h3 className="text-title-md font-title-md font-semibold mb-1">
                    Season Snapshot
                  </h3>
                  <p className="text-label-sm font-label-sm text-on-primary/70 mb-6">
                    Placement Season 2024-25
                  </p>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                      <div className="text-label-sm font-label-sm text-on-primary/70">
                        Total Placements
                      </div>
                      <div className="text-headline-md font-headline-md">
                        {data.stats.totalPlacements.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/5">
                      <div className="text-label-sm font-label-sm text-on-primary/70">
                        Active Companies
                      </div>
                      <div className="text-headline-md font-headline-md">
                        {data.stats.activeCompanies.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/drive-catalogue"
                    className="text-label-sm font-label-sm text-gold-leaf hover:underline flex items-center gap-1 mt-6"
                  >
                    View all drives
                    <span className="material-symbols-outlined text-[14px]">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Pending drive approvals */}
            <section className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden mb-8">
              <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-bright">
                <h2 className="text-title-md font-title-md text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-text-secondary">
                    approval
                  </span>
                  Pending Drive Approvals
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm bg-status-warning/10 text-status-warning border border-status-warning/20">
                  {data.pendingDrives.length} pending
                </span>
              </div>
              {decision.isError && (
                <div className="mx-5 mt-4 flex items-center gap-2 bg-status-error/10 border border-status-error/20 text-status-error rounded-lg px-3 py-2 text-label-md font-label-md">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {decision.error.message}
                </div>
              )}
              {data.pendingDrives.length === 0 ? (
                <div className="text-center py-10 text-text-secondary">
                  <span className="material-symbols-outlined text-[40px] opacity-50">
                    task_alt
                  </span>
                  <p className="text-title-md font-title-md mt-2">
                    No drives awaiting approval
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {data.pendingDrives.map((drive) => {
                    const busy =
                      decision.isPending && decision.variables?.id === drive.id;
                    return (
                      <div
                        key={drive.id}
                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-surface-container-low transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-body-md font-body-md text-text-primary font-medium truncate">
                            {drive.company} — {drive.title}
                          </div>
                          <div className="text-label-sm font-label-sm text-text-secondary mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              schedule
                            </span>
                            Submitted {formatDate(drive.submittedAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              decision.mutate({ id: drive.id, approve: true })
                            }
                            disabled={decision.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-status-success/30 text-status-success text-label-md font-label-md hover:bg-status-success/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              check_circle
                            </span>
                            {busy && decision.variables?.approve
                              ? "Approving…"
                              : "Approve"}
                          </button>
                          <button
                            onClick={() =>
                              decision.mutate({ id: drive.id, approve: false })
                            }
                            disabled={decision.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              cancel
                            </span>
                            {busy && !decision.variables?.approve
                              ? "Rejecting…"
                              : "Reject"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : null}

        {/* Quick links */}
        <section>
          <h2 className="text-title-md font-title-md text-text-primary mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADMIN_QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-surface-container-lowest border border-surface-border rounded-xl p-5 elevation-1 hover-lift hover:border-primary transition-all flex items-start gap-4"
              >
                <div className="bg-primary/10 text-primary p-3 rounded-lg shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined">{link.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-title-md font-title-md text-text-primary">
                      {link.label}
                    </h3>
                    <span className="material-symbols-outlined text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all">
                      arrow_forward
                    </span>
                  </div>
                  <p className="text-body-md font-body-md text-text-secondary mt-1">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default AdminDashboard;
