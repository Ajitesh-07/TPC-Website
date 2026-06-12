"use client";

import Link from "next/link";
import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import { useCompanyDashboard } from "@/lib/hooks";
import type { ApiEvent } from "@/lib/api-types";

// ---------- local display helpers (derived fields live in the page mapper) ----------

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** ISO date ("2026-06-12" or full timestamp) → "Jun 12, 2026". */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

/** "14:30" → "2:30 PM". */
function formatTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Event time window in the itinerary's display style. */
function formatTimeRange(ev: ApiEvent): string {
  if (ev.startTime && ev.endTime)
    return `${formatTime(ev.startTime)} - ${formatTime(ev.endTime)}`;
  if (ev.startTime) return `Starts at ${formatTime(ev.startTime)}`;
  return "All day";
}

/** "TechFlow Solutions Inc." → "TS" (first letters of the first two words). */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}

const CompanyDashboard = () => {
  const { data, isLoading, isError, error, refetch } = useCompanyDashboard();

  if (isLoading) {
    return (
      <div className="flex-1 p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="animate-pulse">
          <div className="h-48 rounded-xl bg-surface-variant mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-44 rounded-xl bg-surface-variant" />
            <div className="h-44 rounded-xl bg-surface-variant" />
            <div className="h-44 rounded-xl bg-surface-variant" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-64 rounded-xl bg-surface-variant" />
            <div className="h-64 rounded-xl bg-surface-variant" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-body-md font-body-md text-status-error flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            Couldn&apos;t load your dashboard
            {error instanceof Error ? ` — ${error.message}` : ""}.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors shrink-0 self-start sm:self-auto"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { company, drives, itinerary, pocs } = data;
  const totalApplicants = drives.reduce((sum, d) => sum + d.applicants, 0);
  const totalShortlisted = drives.reduce((sum, d) => sum + d.shortlisted, 0);
  const ongoingDrives = drives.filter((d) => d.status === "open");
  const companyMeta = [company.location, company.industry]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="flex-1 p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto w-full">
      {/* Company profile banner */}
      <section className="relative rounded-xl overflow-hidden mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-border">
        <div className="h-32 md:h-40 w-full bg-gradient-to-r from-navy-deep to-primary-container relative">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          ></div>
        </div>
        <div className="glass-panel relative px-6 pb-6 pt-16 md:pt-6 md:flex md:items-end md:justify-between -mt-12 md:-mt-0 rounded-b-xl">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:absolute md:bottom-6 md:left-6">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white overflow-hidden relative z-10 shrink-0">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${company.name} logo`}
                  className="w-full h-full object-cover"
                  src={company.logoUrl}
                />
              ) : (
                <div className="w-full h-full bg-primary-fixed text-primary flex items-center justify-center text-headline-md font-headline-md font-semibold">
                  {initialsOf(company.name)}
                </div>
              )}
            </div>
            <div className="text-center md:text-left md:mb-1 z-10 md:ml-[110px]">
              <h1 className="text-headline-md font-headline-md text-text-primary mb-1">
                {company.name}
              </h1>
              {companyMeta && (
                <p className="text-body-md font-body-md text-text-secondary flex items-center justify-center md:justify-start gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    location_on
                  </span>
                  {companyMeta}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex gap-3 justify-center md:justify-end w-full md:w-auto relative z-10">
            <button className="px-4 py-2 rounded-lg border border-surface-border bg-white text-text-primary text-label-md font-label-md font-medium hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* Key metrics grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full relative overflow-hidden group hover:border-primary-fixed-dim transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px] text-primary">
              groups
            </span>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
              Total Applicants
            </p>
            <h2 className="text-display-lg font-display-lg text-text-primary">
              {totalApplicants.toLocaleString("en-IN")}
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-status-success text-label-md font-label-md">
            <span className="material-symbols-outlined text-[16px]">
              trending_up
            </span>
            <span>{totalShortlisted.toLocaleString("en-IN")} shortlisted</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full relative overflow-hidden group hover:border-primary-fixed-dim transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-[64px] text-primary">
              campaign
            </span>
          </div>
          <div>
            <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
              Ongoing Drives
            </p>
            <h2 className="text-display-lg font-display-lg text-text-primary">
              {ongoingDrives.length}
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-2 text-text-secondary text-label-md font-label-md">
            <span className="w-2 h-2 rounded-full bg-status-warning"></span>
            <span className="truncate">
              {ongoingDrives.length > 0
                ? ongoingDrives.map((d) => d.title).join(", ")
                : "No drives in progress"}
            </span>
          </div>
        </div>

        {/* Action card (quick JDs) */}
        <div className="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div>
            <p className="text-label-sm font-label-sm text-primary-fixed-dim uppercase tracking-wider mb-2">
              Quick Actions
            </p>
            <h3 className="text-title-lg font-title-lg text-white mb-4">
              Job Descriptions
            </h3>
          </div>
          <div className="flex flex-col gap-3 relative z-10">
            <Link
              href="/jaf"
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg flex items-center justify-between transition-colors text-label-md font-label-md"
            >
              <span>Upload New JD</span>
              <span className="material-symbols-outlined text-[18px]">
                upload_file
              </span>
            </Link>
            <Link
              href="/company-drives"
              className="w-full bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-primary-fixed-dim py-2 px-4 rounded-lg flex items-center justify-between transition-colors text-label-md font-label-md"
            >
              <span>View Active JDs</span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live applicant metrics + point of contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Live applicants per drive */}
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg font-title-lg text-text-primary">
              Live Applicant Metrics
            </h3>
            <span className="inline-flex items-center gap-1.5 text-label-sm font-label-sm text-status-success">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              Live
            </span>
          </div>
          {drives.length === 0 ? (
            <p className="text-body-md font-body-md text-text-secondary text-center py-8">
              No drives yet — create a job announcement to start receiving
              applications.
            </p>
          ) : (
            <div className="space-y-4">
              {drives.map((d) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-label-md font-label-md text-text-primary">
                      {d.title}
                    </span>
                    <span className="text-label-sm font-label-sm text-text-secondary">
                      {d.applicants} applied •{" "}
                      <span className="text-status-success">
                        {d.shortlisted} shortlisted
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-navy-vibrant"
                      style={{
                        width: `${
                          d.applicants > 0
                            ? Math.min(
                                100,
                                Math.round((d.shortlisted / d.applicants) * 100)
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Point of contact */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-title-lg font-title-lg text-text-primary mb-6">
            Point of Contact
          </h3>
          {pocs.length === 0 ? (
            <p className="text-body-md font-body-md text-text-secondary">
              Your placement-cell contacts will appear here once assigned.
            </p>
          ) : (
            <ul className="space-y-5">
              {pocs.map((poc) => (
                <li key={poc.id} className="flex gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 text-label-md font-label-md font-semibold">
                    {initialsOf(poc.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-title-md font-title-md text-text-primary truncate">
                      {poc.name}
                    </p>
                    <p className="text-label-sm font-label-sm text-text-secondary mb-1.5">
                      {poc.designation ?? "Placement Cell"}
                    </p>
                    {poc.phone && (
                      <a
                        href={`tel:${poc.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-1.5 text-label-sm font-label-sm text-text-secondary hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        {poc.phone}
                      </a>
                    )}
                    {poc.email && (
                      <a
                        href={`mailto:${poc.email}`}
                        className="flex items-center gap-1.5 text-label-sm font-label-sm text-text-secondary hover:text-primary transition-colors truncate"
                      >
                        <span className="material-symbols-outlined text-[14px]">mail</span>
                        <span className="truncate">{poc.email}</span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Campus itinerary */}
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg font-title-lg text-text-primary">
              Campus Itinerary
            </h3>
            <Link
              href="/calendar"
              className="text-primary text-label-md font-label-md font-medium hover:underline flex items-center gap-1"
            >
              Full Schedule{" "}
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
            </Link>
          </div>
          {itinerary.length === 0 ? (
            <p className="text-body-md font-body-md text-text-secondary text-center py-8">
              No campus events scheduled yet.
            </p>
          ) : (
            <Timeline
              rail="border-l-2 border-surface-variant"
              spacing="space-y-8"
              className="pb-4"
            >
              {itinerary.map((ev, i) => (
                <TimelineItem
                  key={ev.id}
                  padding="pl-8"
                  dotClassName={`w-4 h-4 rounded-full border-4 border-white -left-[9px] top-1 shadow-sm ${
                    i === 0 ? "bg-primary" : "bg-surface-variant"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <h4 className="text-title-md font-title-md text-text-primary">
                        {ev.title}
                      </h4>
                      <p className="text-body-md font-body-md text-text-secondary mt-1">
                        {ev.location ?? "Location to be announced"}
                      </p>
                      {ev.detail && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed text-label-sm font-label-sm">
                          <span className="material-symbols-outlined text-[14px]">
                            groups
                          </span>{" "}
                          {ev.detail}
                        </div>
                      )}
                    </div>
                    <div className="text-left md:text-right shrink-0">
                      <span className="block text-label-md font-label-md text-text-primary font-bold">
                        {formatDate(ev.eventDate)}
                      </span>
                      <span className="block text-label-sm font-label-sm text-text-secondary mt-1">
                        {formatTimeRange(ev)}
                      </span>
                    </div>
                  </div>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </section>

        {/* Recent activity — live feed ships with notifications (phase 2) */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6">
          <h3 className="text-title-lg font-title-lg text-text-primary mb-6">
            Recent Activity
          </h3>
          <div className="rounded-lg border border-dashed border-surface-border bg-surface/50 p-6 text-center">
            <span className="material-symbols-outlined text-[28px] text-text-secondary block mb-2">
              notifications
            </span>
            <p className="text-body-md font-body-md text-text-primary">
              Activity feed coming soon
            </p>
            <p className="text-label-sm font-label-sm text-text-secondary mt-1">
              Live updates on JD approvals, registrations, and pending actions
              will appear here.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CompanyDashboard;
