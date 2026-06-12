"use client";

import Link from "next/link";
import PortalHeader from "@/components/ui/PortalHeader";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { useCoordinatorDashboard } from "@/lib/hooks";
import type {
  ApiEvent,
  CoordinatorDashboard as CoordinatorDashboardData,
  DriveStatusApi,
} from "@/lib/api-types";

// ---------- local mappers (API → display) ----------

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Drive status enum → badge label + tone. */
const DRIVE_STATUS: Record<DriveStatusApi, { label: string; tone: BadgeTone }> = {
  open: { label: "Open", tone: "success" },
  pending_approval: { label: "Pending Approval", tone: "warning" },
  draft: { label: "Draft", tone: "neutral" },
  closed: { label: "Closed", tone: "info" },
  completed: { label: "Completed", tone: "info" },
  cancelled: { label: "Cancelled", tone: "error" },
};

/** "HH:MM" → "10:00 AM". */
function formatClock(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** Event date/time → "Today, 10:00 AM" / "Tomorrow, 09:00 AM" / "Oct 25, 2:00 PM". */
function formatEventTime(event: ApiEvent): string {
  const [y = 0, m = 1, d = 1] = event.eventDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  const day =
    diffDays === 0
      ? "Today"
      : diffDays === 1
        ? "Tomorrow"
        : `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return event.startTime ? `${day}, ${formatClock(event.startTime)}` : day;
}

/** Schedule accent (dot + time colour) mirrors the original widget's ordering. */
const EVENT_ACCENTS: { dot: string; time: string }[] = [
  { dot: "bg-primary", time: "text-primary" },
  { dot: "bg-navy-vibrant", time: "text-navy-vibrant" },
];
const eventAccent = (index: number) =>
  EVENT_ACCENTS[index] ?? {
    dot: "bg-surface-variant border border-outline-variant",
    time: "text-text-secondary",
  };

// ---------- static layout config (icons / blobs from the original design) ----------

const METRIC_CONFIG: {
  key: keyof CoordinatorDashboardData["metrics"];
  label: string;
  icon: string;
  iconClassName: string;
  blobClassName: string;
}[] = [
  {
    key: "activeDrives",
    label: "Active Drives",
    icon: "work",
    iconClassName: "text-primary",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-primary-fixed-dim/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
  },
  {
    key: "pendingApplications",
    label: "Pending Apps",
    icon: "pending_actions",
    iconClassName: "text-status-warning",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-secondary-container/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
  },
  {
    key: "offersMade",
    label: "Offers Made",
    icon: "verified",
    iconClassName: "text-status-success",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-status-success/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
  },
  {
    key: "upcomingInterviews",
    label: "Upcoming Int.",
    icon: "event_upcoming",
    iconClassName: "text-navy-vibrant",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-navy-vibrant/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
  },
];

const QUICK_ACTIONS: { icon: string; label: string; href?: string }[] = [
  { icon: "group_add", label: "Add Student" },
  { icon: "domain_add", label: "Add Drive", href: "/add-drive" },
  { icon: "mail", label: "Send Email" },
  { icon: "insert_chart", label: "Generate Stats" },
];

type DashboardDrive = CoordinatorDashboardData["drives"][number];

const DRIVE_COLUMNS: Column<DashboardDrive>[] = [
  {
    header: "Company",
    className: "px-4 py-3 font-medium text-text-primary",
    render: (d) => d.company,
  },
  {
    header: "Role",
    className: "px-4 py-3 text-text-secondary",
    render: (d) => d.title,
  },
  {
    header: "Status",
    className: "px-4 py-3",
    render: (d) => (
      <StatusBadge tone={DRIVE_STATUS[d.status].tone} className="px-2 py-1 rounded">
        {DRIVE_STATUS[d.status].label}
      </StatusBadge>
    ),
  },
  {
    header: "Applicants",
    className: "px-4 py-3 text-text-secondary",
    render: (d) => d.applicants,
  },
  {
    header: "Action",
    headerClassName: "text-right",
    className: "px-4 py-3 text-right",
    render: () => (
      <Link
        href="/drive-workspace"
        className="inline-flex p-1 text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
      >
        <span className="material-symbols-outlined text-[20px]">
          chevron_right
        </span>
      </Link>
    ),
  },
];

const CoordinatorDashboard = () => {
  const { data, isLoading, isError, error, refetch } = useCoordinatorDashboard();

  return (
    <>
      <PortalHeader
        title="Overview"
        subtitle="Placement Season 2024-25"
        className="bg-surface/90 px-gutter-mobile md:px-gutter-desktop py-6 md:py-8"
        innerClassName="max-w-container-max mx-auto md:flex-row md:items-end"
        titleClassName="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled
              title="Report export is coming in Phase 2"
              className="bg-surface-container-lowest border border-surface-border text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm transition-colors flex items-center gap-2 opacity-60 cursor-not-allowed"
            >
              <span className="material-symbols-outlined">download</span>
              Export Report
            </button>
            <Link
              href="/add-drive"
              className="bg-gradient-to-b from-primary to-navy-deep border-t border-primary-fixed-dim/30 text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Create Drive
            </Link>
          </div>
        }
      />

      {/* Content */}
      <div className="p-gutter-mobile md:p-gutter-desktop flex-1 max-w-container-max mx-auto w-full">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {METRIC_CONFIG.map((m) => (
                <div key={m.key} className="h-28 rounded-xl bg-surface-variant" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-80 rounded-xl bg-surface-variant" />
              <div className="h-80 rounded-xl bg-surface-variant" />
            </div>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex items-start gap-3 rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3">
            <span className="material-symbols-outlined text-status-error text-[20px] mt-0.5">
              error
            </span>
            <div className="flex-1">
              <p className="text-body-md font-body-md text-text-primary">
                Couldn&rsquo;t load your dashboard.
              </p>
              <p className="text-label-sm font-label-sm text-text-secondary mt-0.5">
                {error instanceof Error ? error.message : "Something went wrong."}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {METRIC_CONFIG.map((metric) => (
                <MetricCard
                  key={metric.key}
                  label={metric.label}
                  value={String(data.metrics[metric.key])}
                  icon={metric.icon}
                  iconClassName={metric.iconClassName}
                  blobClassName={metric.blobClassName}
                />
              ))}
            </div>

            {/* Main bento grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Active drives table */}
                <div className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-bright">
                    <h2 className="text-title-md font-title-md text-text-primary">
                      Ongoing Placement Drives
                    </h2>
                    <Link
                      href="/drive-workspace"
                      className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors"
                    >
                      View All
                    </Link>
                  </div>
                  {data.drives.length === 0 ? (
                    <div className="text-center py-14 text-text-secondary">
                      <span className="material-symbols-outlined text-[40px] mb-2 opacity-50 block">
                        work_outline
                      </span>
                      <p className="text-title-md font-title-md">
                        No drives assigned to you yet
                      </p>
                      <p className="text-label-md font-label-md mt-1">
                        Create a drive to see it appear here.
                      </p>
                    </div>
                  ) : (
                    <DataTable
                      columns={DRIVE_COLUMNS}
                      rows={data.drives}
                      theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                      thClassName="px-4 py-3 font-semibold"
                      tdClassName=""
                      rowClassName={(_, i) =>
                        `border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors group text-body-md font-body-md ${
                          i % 2 === 1 ? "bg-neutral-50" : ""
                        }`
                      }
                    />
                  )}
                </div>

                {/* Action cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container-low rounded-xl p-5 border border-surface-border flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                      <span className="material-symbols-outlined">campaign</span>
                    </div>
                    <div>
                      <h3 className="text-title-md font-title-md text-text-primary mb-1">
                        Announce Results
                      </h3>
                      <p className="text-body-md font-body-md text-text-secondary mb-3">
                        Publish shortlists from your drive workspace.
                      </p>
                      <Link
                        href="/drive-workspace"
                        className="text-label-md font-label-md text-primary font-semibold hover:underline"
                      >
                        Review &amp; Publish
                      </Link>
                    </div>
                  </div>
                  <div className="bg-error-container/30 rounded-xl p-5 border border-error/20 flex items-start gap-4">
                    <div className="bg-error/10 p-3 rounded-lg text-status-error shrink-0">
                      <span className="material-symbols-outlined">error_outline</span>
                    </div>
                    <div>
                      <h3 className="text-title-md font-title-md text-text-primary mb-1">
                        Urgent Verification
                      </h3>
                      <p className="text-body-md font-body-md text-text-secondary mb-3">
                        Review student profiles in the directory.
                      </p>
                      <Link
                        href="/student-profiles"
                        className="text-label-md font-label-md text-status-error font-semibold hover:underline"
                      >
                        Verify Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-6">
                {/* Calendar widget */}
                <div className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4">
                  <h2 className="text-title-md font-title-md text-text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-secondary">
                      calendar_month
                    </span>
                    Upcoming Schedule
                  </h2>
                  {data.schedule.length === 0 ? (
                    <p className="text-body-md font-body-md text-text-secondary py-4 text-center">
                      No upcoming events scheduled.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {data.schedule.map((event, index) => {
                        const accent = eventAccent(index);
                        return (
                          <div
                            key={event.id}
                            className="flex gap-3 relative before:absolute before:left-1.5 before:top-6 before:bottom-0 before:w-px before:bg-surface-border last:before:hidden"
                          >
                            <div
                              className={`w-3 h-3 rounded-full mt-1.5 shrink-0 relative z-10 ring-4 ring-surface-container-lowest ${accent.dot}`}
                            ></div>
                            <div>
                              <div
                                className={`text-label-md font-label-md font-semibold ${accent.time}`}
                              >
                                {formatEventTime(event)}
                              </div>
                              <div className="text-body-md font-body-md text-text-primary font-medium">
                                {event.title}
                              </div>
                              <div className="text-label-sm font-label-sm text-text-secondary">
                                {event.location?.startsWith("http") ? (
                                  <a
                                    href={event.location}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline"
                                  >
                                    Meeting link
                                  </a>
                                ) : (
                                  event.location ?? "—"
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Link
                    href="/calendar"
                    className="block text-center w-full mt-4 py-2 border border-surface-border rounded-lg text-label-md font-label-md text-text-secondary hover:bg-surface-container-low transition-colors"
                  >
                    View Full Calendar
                  </Link>
                </div>

                {/* Quick actions */}
                <div className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4">
                  <h2 className="text-title-md font-title-md text-text-primary mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => {
                      const className =
                        "flex flex-col items-center justify-center p-3 rounded-lg border border-surface-border hover:border-primary hover:bg-primary/5 transition-all text-text-secondary hover:text-primary";
                      const inner = (
                        <>
                          <span className="material-symbols-outlined mb-1">
                            {action.icon}
                          </span>
                          <span className="text-label-sm font-label-sm text-center">
                            {action.label}
                          </span>
                        </>
                      );
                      return action.href ? (
                        <Link key={action.label} href={action.href} className={className}>
                          {inner}
                        </Link>
                      ) : (
                        <button key={action.label} className={className}>
                          {inner}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CoordinatorDashboard;
