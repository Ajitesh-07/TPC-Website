"use client";

import Link from "next/link";
import PortalHeader from "@/components/ui/PortalHeader";
import NotificationBell from "@/components/layout/NotificationBell";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import { useMe, useStudentDashboard } from "@/lib/hooks";
import type {
  ApiEvent,
  ApplicationStatusApi,
  DriveCard,
  MeResponse,
  MyApplication,
  StudentProfile,
} from "@/lib/api-types";

// ---------- local display mappers (API → mock-shaped strings) ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad2 = (n: number) => String(n).padStart(2, "0");

/** ISO → "Oct 15, 2024". */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${pad2(d.getDate())}, ${d.getFullYear()}`;
}

/** ISO / YYYY-MM-DD → "Oct 24". */
function shortDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${pad2(d.getDate())}`;
}

/** "14:30" → "2:30 PM". */
function time12(t: string | null): string | null {
  if (!t) return null;
  const [hRaw, mRaw = "00"] = t.split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return null;
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${mRaw} ${h >= 12 ? "PM" : "AM"}`;
}

/** Whole days from today until a YYYY-MM-DD event date (0 = today). */
function daysUntilDate(isoDate: string): number {
  const target = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** "Today" / "Tomorrow" / "Oct 18". */
function dayLabel(isoDate: string): string {
  const diff = daysUntilDate(isoDate);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return shortDate(isoDate);
}

/** Days until an ISO deadline (ceil; negative once passed). */
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

/** ctcLpa → "₹32.5 LPA"; stipend → "₹1.2L /mo". */
function compensation(drive: Pick<DriveCard, "ctcLpa" | "stipendPerMonth">): string {
  if (drive.ctcLpa != null) return `₹${drive.ctcLpa} LPA`;
  if (drive.stipendPerMonth != null) {
    return drive.stipendPerMonth >= 100_000
      ? `₹${(drive.stipendPerMonth / 100_000).toFixed(1)}L /mo`
      : `₹${Math.round(drive.stipendPerMonth / 1_000)}K /mo`;
  }
  return "—";
}

const titleCase = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const APP_STATUS_TONE: Record<ApplicationStatusApi, BadgeTone> = {
  applied: "applied",
  under_review: "info",
  shortlisted: "shortlisted",
  interview: "warning",
  offered: "success",
  accepted: "success",
  rejected: "rejected",
  withdrawn: "neutral",
};

/** Derived display status: an ongoing OA stage reads as "Assessment" (mock parity). */
function applicationBadge(app: MyApplication): { label: string; tone: BadgeTone } {
  if (app.currentStage?.type === "online_assessment" && app.currentStage.status === "ongoing") {
    return { label: "Assessment", tone: "assessment" };
  }
  return { label: titleCase(app.status), tone: APP_STATUS_TONE[app.status] };
}

function asStudentProfile(me: MeResponse | undefined): StudentProfile | null {
  if (!me?.profile || me.user.role !== "student") return null;
  return me.profile as StudentProfile;
}

/** Soonest upcoming interview / OA event drives the urgent-action card. */
function nextUrgentEvent(events: ApiEvent[]): ApiEvent | null {
  const candidates = events
    .filter((e) => (e.type === "interview" || e.type === "oa") && daysUntilDate(e.eventDate) >= 0)
    .sort((a, b) =>
      `${a.eventDate} ${a.startTime ?? ""}`.localeCompare(`${b.eventDate} ${b.startTime ?? ""}`)
    );
  return candidates[0] ?? null;
}

interface Reminder {
  icon: string;
  tone: string;
  text: string;
}

/** Reminders = deadline events within the next 7 days. */
function deriveReminders(events: ApiEvent[]): Reminder[] {
  return events
    .filter((e) => {
      if (e.type !== "deadline") return false;
      const d = daysUntilDate(e.eventDate);
      return d >= 0 && d <= 7;
    })
    .slice(0, 3)
    .map((e) => {
      const d = daysUntilDate(e.eventDate);
      const when = d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`;
      return {
        icon: "timer",
        tone: d <= 2 ? "text-status-warning" : "text-primary",
        text: `${e.title} — due ${when}`,
      };
    });
}

const APPLICATION_COLUMNS: Column<MyApplication>[] = [
  {
    header: "Company",
    className: "py-3 px-5 font-semibold text-text-primary",
    render: (a) => a.drive.company.name,
  },
  {
    header: "Role",
    className: "py-3 px-5 text-text-secondary",
    render: (a) => a.drive.title,
  },
  {
    header: "Applied On",
    className: "py-3 px-5 text-text-secondary",
    render: (a) => formatDate(a.appliedAt),
  },
  {
    header: "Status",
    className: "py-3 px-5",
    render: (a) => {
      const badge = applicationBadge(a);
      return (
        <StatusBadge tone={badge.tone} className="text-[11px] font-bold">
          {badge.label}
        </StatusBadge>
      );
    },
  },
];

// ---------- query-state panels ----------

function LoadingState() {
  return (
    <div className="p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto space-y-6">
      <div className="h-16 rounded-xl bg-surface-variant animate-pulse"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-48 rounded-xl bg-surface-variant animate-pulse"></div>
        <div className="h-48 rounded-xl bg-surface-variant animate-pulse"></div>
        <div className="h-48 rounded-xl bg-surface-variant animate-pulse"></div>
      </div>
      <div className="h-64 rounded-xl bg-surface-variant animate-pulse"></div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto">
      <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-status-error">error</span>
          <div>
            <p className="text-title-md font-title-md text-text-primary">Couldn&apos;t load your dashboard</p>
            <p className="text-body-md font-body-md text-text-secondary">{message}</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="shrink-0 px-4 py-2 rounded-lg border border-status-error/20 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

const StudentDashboard = () => {
  const me = useMe();
  const dashboard = useStudentDashboard();

  const name = me.data?.user.fullName ?? (me.isError ? "Student" : undefined);
  const roll = asStudentProfile(me.data)?.rollNo;

  const dash = dashboard.data;
  const urgent = dash ? nextUrgentEvent(dash.upcomingEvents) : null;
  const reminders = dash ? deriveReminders(dash.upcomingEvents) : [];
  const verified = dash ? dash.profile.emailVerified && dash.profile.btechVerified : false;
  const schedule = dash
    ? [...dash.upcomingEvents].sort((a, b) =>
        `${a.eventDate} ${a.startTime ?? ""}`.localeCompare(`${b.eventDate} ${b.startTime ?? ""}`)
      )
    : [];
  const urgentTime = urgent ? time12(urgent.startTime) : null;

  return (
    <>
      <PortalHeader
        title="Overview"
        subtitle="Manage your placement journey and track progress."
        className="bg-background/80 px-gutter-mobile md:px-gutter-desktop"
        innerClassName="flex-row items-center"
        actions={
          <>
            <NotificationBell />
            <div className="h-8 w-px bg-surface-border hidden sm:block"></div>
            <Link href="/my-profile" className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                {name ? (
                  <p className="text-label-md font-label-md text-text-primary group-hover:text-primary transition-colors">
                    {name}
                  </p>
                ) : (
                  <div className="h-4 w-28 rounded bg-surface-variant animate-pulse ml-auto"></div>
                )}
                {roll ? (
                  <p className="text-label-sm font-label-sm text-text-secondary uppercase">{roll}</p>
                ) : !name ? (
                  <div className="h-3 w-16 rounded bg-surface-variant animate-pulse mt-1 ml-auto"></div>
                ) : null}
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-title-md ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                {name ? initialsOf(name) : ""}
              </div>
            </Link>
          </>
        }
      />

      {/* Dashboard content */}
      {dashboard.isPending ? (
        <LoadingState />
      ) : dashboard.isError ? (
        <ErrorState
          message={dashboard.error.message || "Something went wrong while fetching your data."}
          onRetry={() => void dashboard.refetch()}
        />
      ) : dash ? (
        <div className="p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto space-y-6">
          {/* Restriction / Clearance Banner */}
          {dash.profile.isBlocked ? (
            <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-status-error">block</span>
                <div>
                  <p className="text-title-md font-title-md text-text-primary">Applications restricted</p>
                  <p className="text-body-md font-body-md text-text-secondary">
                    {dash.profile.blockedReason ??
                      "You are currently restricted from applying. Please contact the TPC office."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-status-success/20 bg-status-success/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-status-success">verified_user</span>
                <div>
                  <p className="text-title-md font-title-md text-text-primary">You&apos;re all clear</p>
                  <p className="text-body-md font-body-md text-text-secondary">
                    No active restrictions — you&apos;re eligible to apply to open drives.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-border text-label-sm font-label-sm text-text-secondary">
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      dash.profile.emailVerified ? "text-status-success" : "text-status-warning"
                    }`}
                  >
                    mail
                  </span>
                  {dash.profile.emailVerified ? "Email Verified" : "Email Pending"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-border text-label-sm font-label-sm text-text-secondary">
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      dash.profile.btechVerified ? "text-status-success" : "text-status-warning"
                    }`}
                  >
                    school
                  </span>
                  {dash.profile.btechVerified ? "B.Tech Verified" : "B.Tech Pending"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-border text-label-sm font-label-sm text-text-secondary">
                  <span className="material-symbols-outlined text-[14px] text-text-secondary">badge</span>
                  {titleCase(dash.profile.placementStatus)}
                </span>
              </div>
            </div>
          )}

          {/* Action center / bento grid (top row) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile & verification widget */}
            <div className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-surface-border flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-title-md font-title-md text-text-primary">Profile Status</h3>
                <StatusBadge
                  tone={verified ? "success" : "warning"}
                  icon={verified ? "check_circle" : "pending"}
                  className="px-2.5 py-1 rounded-md font-bold"
                >
                  {verified ? "Verified" : "Pending"}
                </StatusBadge>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-display-lg font-display-lg text-primary">
                    {dash.profile.completeness}
                    <span className="text-headline-md font-headline-md">%</span>
                  </span>
                  <span className="text-label-md font-label-md text-text-secondary pb-2">Completeness</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, dash.profile.completeness))}%` }}
                  ></div>
                </div>
                <p className="text-label-sm font-label-sm text-text-secondary">
                  {dash.profile.completeness >= 100
                    ? "Your profile is complete — great job!"
                    : "Complete missing academic records to reach 100%."}
                </p>
              </div>
            </div>

            {/* Urgent action card (derived from the soonest interview / OA event) */}
            {urgent && (
              <div className="bg-gradient-to-br from-primary to-navy-deep rounded-xl p-6 shadow-md border border-primary-container text-on-primary flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed-dim/20 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex justify-between items-start mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-warning/20 text-secondary-fixed text-label-sm font-label-sm border border-secondary-fixed/30 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Action Required
                  </span>
                  <span className="material-symbols-outlined text-on-primary/50 text-[32px]">event_available</span>
                </div>
                <div className="relative z-10 mt-auto">
                  <p className="text-label-sm font-label-sm text-on-primary-fixed-variant uppercase tracking-wider mb-1">
                    {urgent.type === "oa" ? "Upcoming Assessment" : "Upcoming Interview"}
                  </p>
                  <h3 className="text-headline-md font-headline-md text-on-primary leading-tight mb-2">
                    {urgent.title}
                  </h3>
                  <p className="text-body-md font-body-md text-on-primary/80 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {dayLabel(urgent.eventDate)}
                    {urgentTime ? `, ${urgentTime} IST` : ""}
                  </p>
                  {urgent.location && /^https?:\/\//i.test(urgent.location) ? (
                    <a
                      href={urgent.location}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full bg-surface-container-lowest text-primary py-2 rounded-lg text-label-md font-label-md font-bold hover:bg-surface transition-colors shadow-sm text-center"
                    >
                      Join Meeting Link
                    </a>
                  ) : urgent.location ? (
                    <p className="w-full bg-surface-container-lowest text-primary py-2 rounded-lg text-label-md font-label-md font-bold shadow-sm text-center">
                      {urgent.location}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Quick stats + reminders */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest rounded-xl p-5 soft-shadow border border-surface-border flex flex-col justify-center">
                <span className="material-symbols-outlined text-text-secondary mb-2">assignment</span>
                <span className="text-headline-lg font-headline-lg text-text-primary">
                  {pad2(dash.counts.applied)}
                </span>
                <span className="text-label-md font-label-md text-text-secondary">Applied</span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-5 soft-shadow border border-surface-border flex flex-col justify-center">
                <span className="material-symbols-outlined text-status-warning mb-2">star</span>
                <span className="text-headline-lg font-headline-lg text-text-primary">
                  {pad2(dash.counts.shortlisted)}
                </span>
                <span className="text-label-md font-label-md text-text-secondary">Shortlisted</span>
              </div>
              {/* Reminders */}
              <div className="col-span-2 bg-surface-container-low rounded-xl p-5 soft-shadow border border-surface-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">notifications_active</span>
                  <span className="text-title-md font-title-md text-text-primary">Reminders</span>
                </div>
                <ul className="space-y-2">
                  {reminders.length > 0 ? (
                    reminders.map((reminder) => (
                      <li
                        key={reminder.text}
                        className="flex items-center gap-2 text-body-md font-body-md text-text-secondary"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${reminder.tone}`}>
                          {reminder.icon}
                        </span>
                        {reminder.text}
                      </li>
                    ))
                  ) : (
                    <li className="flex items-center gap-2 text-body-md font-body-md text-text-secondary">
                      <span className="material-symbols-outlined text-[16px] text-text-secondary">
                        notifications_off
                      </span>
                      No deadlines in the next 7 days — you&apos;re all caught up.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Eligible Drives Summary */}
          <section className="bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border overflow-hidden">
            <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface/50 backdrop-blur-sm">
              <h3 className="text-title-md font-title-md text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                Drives You&apos;re Eligible For
              </h3>
              <Link
                className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors flex items-center gap-1"
                href="/drive-catalogue"
              >
                View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
            {dash.eligibleDrives.length === 0 ? (
              <div className="p-10 text-center text-text-secondary">
                <span className="material-symbols-outlined text-[40px] mb-2 opacity-50 block">work_history</span>
                <p className="text-title-md font-title-md">No eligible drives right now</p>
                <p className="text-body-md font-body-md mt-1">
                  New drives will appear here as soon as you qualify for them.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
                {dash.eligibleDrives.map((drive) => {
                  const days = daysUntil(drive.applicationDeadline);
                  const closingSoon = Number.isFinite(days) && days >= 0 && days < 3;
                  return (
                    <article
                      key={drive.id}
                      className="bg-surface rounded-xl border border-surface-border p-5 flex flex-col hover-lift"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-md font-bold text-navy-vibrant shrink-0">
                          {initialsOf(drive.company.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-title-md font-title-md text-text-primary truncate">
                            {drive.company.name}
                          </h4>
                          <p className="text-label-md font-label-md text-text-secondary truncate">{drive.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="block text-label-sm font-label-sm text-text-secondary">CTC / Stipend</span>
                          <span className="text-title-md font-title-md text-on-surface">{compensation(drive)}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-label-sm font-label-sm text-text-secondary">Deadline</span>
                          <span
                            className={`text-title-md font-title-md ${
                              closingSoon ? "text-status-warning" : "text-on-surface"
                            }`}
                          >
                            {drive.applicationDeadline ? shortDate(drive.applicationDeadline) : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {drive.skills.map((tag) => (
                          <span
                            key={tag}
                            className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-label-sm font-label-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {drive.hasApplied ? (
                        <span className="mt-auto bg-surface-container-highest text-text-secondary py-2 rounded-lg text-label-md font-label-md text-center cursor-not-allowed">
                          Applied
                        </span>
                      ) : (
                        <Link
                          href="/drive-catalogue"
                          className="mt-auto bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity text-center"
                        >
                          Apply Now
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Main layout (table & timeline) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Application tracker */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border overflow-hidden flex flex-col">
              <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface/50 backdrop-blur-sm">
                <h3 className="text-title-md font-title-md text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">list_alt</span>
                  Recent Applications
                </h3>
                <a className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors" href="#">
                  View All
                </a>
              </div>
              {dash.applications.length === 0 ? (
                <div className="p-10 text-center text-text-secondary">
                  <span className="material-symbols-outlined text-[40px] mb-2 opacity-50 block">inbox</span>
                  <p className="text-title-md font-title-md">No applications yet</p>
                  <p className="text-body-md font-body-md mt-1">Apply to an eligible drive to start tracking it here.</p>
                </div>
              ) : (
                <DataTable
                  columns={APPLICATION_COLUMNS}
                  rows={dash.applications}
                  className="min-w-[600px]"
                  theadClassName="bg-surface-container sticky top-0 z-10"
                  thClassName="py-3 px-5 text-label-sm font-label-sm text-text-secondary uppercase tracking-wider font-semibold"
                  rowClassName={() =>
                    "even:bg-surface-container-lowest odd:bg-background/50 hover:bg-surface-variant/30 transition-colors border-b border-surface-variant/50 last:border-0 text-body-md font-body-md"
                  }
                />
              )}
            </div>

            {/* Upcoming schedule timeline */}
            <div className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-surface-border">
              <h3 className="text-title-md font-title-md text-text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                Upcoming Schedule
              </h3>
              {schedule.length === 0 ? (
                <p className="text-body-md font-body-md text-text-secondary">No upcoming events scheduled.</p>
              ) : (
                <Timeline>
                  {schedule.map((item, index) => {
                    const active = index === 0;
                    const itemTime = time12(item.startTime);
                    const timeText = `${dayLabel(item.eventDate).toUpperCase()}${itemTime ? `, ${itemTime}` : ""}`;
                    const desc =
                      item.detail ??
                      (item.location && !/^https?:\/\//i.test(item.location) ? `Venue: ${item.location}` : "");
                    return (
                      <TimelineItem
                        key={item.id}
                        dotClassName={
                          active
                            ? "-left-1.5 top-1.5 w-3 h-3 bg-primary rounded-full ring-4 ring-primary-fixed"
                            : "-left-[5px] top-1.5 w-2.5 h-2.5 bg-outline-variant rounded-full"
                        }
                      >
                        <p
                          className={`text-label-sm font-label-sm mb-1 ${
                            active ? "text-primary font-bold" : "text-text-secondary"
                          }`}
                        >
                          {timeText}
                        </p>
                        {active ? (
                          <div className="bg-surface p-3 rounded-lg border border-surface-border">
                            <h4 className="text-label-md font-label-md font-medium text-text-primary">{item.title}</h4>
                            <p className="text-body-md font-body-md text-text-secondary text-xs mt-1">{desc}</p>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-label-md font-label-md font-medium text-text-primary">{item.title}</h4>
                            <p className="text-body-md font-body-md text-text-secondary text-xs mt-1">{desc}</p>
                          </>
                        )}
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              )}
            </div>
          </div>
        </div>
      ) : null}
      <div className="h-8"></div>
    </>
  );
};

export default StudentDashboard;
