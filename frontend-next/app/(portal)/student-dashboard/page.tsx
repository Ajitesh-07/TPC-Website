import Link from "next/link";
import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import {
  STUDENT,
  STUDENT_APPLICATIONS,
  STUDENT_SCHEDULE,
  ELIGIBLE_DRIVES,
  REMINDERS,
  type Application,
} from "@/data/student";

const APPLICATION_COLUMNS: Column<Application>[] = [
  {
    header: "Company",
    className: "py-3 px-5 font-semibold text-text-primary",
    render: (a) => a.company,
  },
  {
    header: "Role",
    className: "py-3 px-5 text-text-secondary",
    render: (a) => a.role,
  },
  {
    header: "Applied On",
    className: "py-3 px-5 text-text-secondary",
    render: (a) => a.appliedOn,
  },
  {
    header: "Status",
    className: "py-3 px-5",
    render: (a) => (
      <StatusBadge tone={a.status.tone} className="text-[11px] font-bold">
        {a.status.label}
      </StatusBadge>
    ),
  },
];

const StudentDashboard = () => {
  return (
    <>
      <PortalHeader
        title="Overview"
        subtitle="Manage your placement journey and track progress."
        className="bg-background/80 px-gutter-desktop"
        innerClassName="flex-row items-center"
        actions={
          <>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-background"></span>
            </Link>
            <div className="h-8 w-px bg-surface-border hidden sm:block"></div>
            <Link href="/my-profile" className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-label-md font-label-md text-text-primary group-hover:text-primary transition-colors">
                  {STUDENT.name}
                </p>
                <p className="text-label-sm font-label-sm text-text-secondary uppercase">{STUDENT.roll}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-title-md ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                {STUDENT.initials}
              </div>
            </Link>
          </>
        }
      />

      {/* Dashboard content */}
      <div className="p-gutter-desktop max-w-container-max mx-auto space-y-6">
        {/* Restriction / Clearance Banner */}
        {STUDENT.restricted ? (
          <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-error">block</span>
              <div>
                <p className="text-title-md font-title-md text-text-primary">Applications restricted</p>
                <p className="text-body-md font-body-md text-text-secondary">
                  You are currently restricted from applying. Please contact the TPC office.
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
                <span className="material-symbols-outlined text-[14px] text-status-success">mail</span>
                {STUDENT.emailVerified ? "Email Verified" : "Email Pending"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-border text-label-sm font-label-sm text-text-secondary">
                <span className="material-symbols-outlined text-[14px] text-status-success">school</span>
                {STUDENT.btechVerified ? "B.Tech Verified" : "B.Tech Pending"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-border text-label-sm font-label-sm text-text-secondary">
                <span className="material-symbols-outlined text-[14px] text-text-secondary">badge</span>
                {STUDENT.placementStatus}
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
              <StatusBadge tone="success" icon="check_circle" className="px-2.5 py-1 rounded-md font-bold">
                Verified
              </StatusBadge>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-display-lg font-display-lg text-primary">
                  {STUDENT.completeness}
                  <span className="text-headline-md font-headline-md">%</span>
                </span>
                <span className="text-label-md font-label-md text-text-secondary pb-2">Completeness</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${STUDENT.completeness}%` }}
                ></div>
              </div>
              <p className="text-label-sm font-label-sm text-text-secondary">
                Complete missing academic records to reach 100%.
              </p>
            </div>
          </div>

          {/* Urgent action card */}
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
                Upcoming Interview
              </p>
              <h3 className="text-headline-md font-headline-md text-on-primary leading-tight mb-2">
                Google - Software Engineer
              </h3>
              <p className="text-body-md font-body-md text-on-primary/80 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Tomorrow, 10:00 AM IST
              </p>
              <button className="w-full bg-surface-container-lowest text-primary py-2 rounded-lg text-label-md font-label-md font-bold hover:bg-surface transition-colors shadow-sm">
                Join Meeting Link
              </button>
            </div>
          </div>

          {/* Quick stats + reminders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-5 soft-shadow border border-surface-border flex flex-col justify-center">
              <span className="material-symbols-outlined text-text-secondary mb-2">assignment</span>
              <span className="text-headline-lg font-headline-lg text-text-primary">12</span>
              <span className="text-label-md font-label-md text-text-secondary">Applied</span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-5 soft-shadow border border-surface-border flex flex-col justify-center">
              <span className="material-symbols-outlined text-status-warning mb-2">star</span>
              <span className="text-headline-lg font-headline-lg text-text-primary">03</span>
              <span className="text-label-md font-label-md text-text-secondary">Shortlisted</span>
            </div>
            {/* Reminders */}
            <div className="col-span-2 bg-surface-container-low rounded-xl p-5 soft-shadow border border-surface-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-[18px]">notifications_active</span>
                <span className="text-title-md font-title-md text-text-primary">Reminders</span>
              </div>
              <ul className="space-y-2">
                {REMINDERS.map((reminder) => (
                  <li
                    key={reminder.text}
                    className="flex items-center gap-2 text-body-md font-body-md text-text-secondary"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${reminder.tone}`}>{reminder.icon}</span>
                    {reminder.text}
                  </li>
                ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {ELIGIBLE_DRIVES.map((drive) => (
              <article
                key={drive.company}
                className="bg-surface rounded-xl border border-surface-border p-5 flex flex-col hover-lift"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-md font-bold text-navy-vibrant shrink-0">
                    {drive.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-title-md font-title-md text-text-primary truncate">{drive.company}</h4>
                    <p className="text-label-md font-label-md text-text-secondary truncate">{drive.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="block text-label-sm font-label-sm text-text-secondary">CTC / Stipend</span>
                    <span className="text-title-md font-title-md text-on-surface">{drive.ctc}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-label-sm font-label-sm text-text-secondary">Deadline</span>
                    <span
                      className={`text-title-md font-title-md ${
                        drive.closingSoon ? "text-status-warning" : "text-on-surface"
                      }`}
                    >
                      {drive.deadline}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {drive.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-label-sm font-label-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href="/drive-catalogue"
                  className="mt-auto bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity text-center"
                >
                  Apply Now
                </Link>
              </article>
            ))}
          </div>
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
            <DataTable
              columns={APPLICATION_COLUMNS}
              rows={STUDENT_APPLICATIONS}
              className="min-w-[600px]"
              theadClassName="bg-surface-container sticky top-0 z-10"
              thClassName="py-3 px-5 text-label-sm font-label-sm text-text-secondary uppercase tracking-wider font-semibold"
              rowClassName={() =>
                "even:bg-surface-container-lowest odd:bg-background/50 hover:bg-surface-variant/30 transition-colors border-b border-surface-variant/50 last:border-0 text-body-md font-body-md"
              }
            />
          </div>

          {/* Upcoming schedule timeline */}
          <div className="bg-surface-container-lowest rounded-xl p-6 soft-shadow border border-surface-border">
            <h3 className="text-title-md font-title-md text-text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
              Upcoming Schedule
            </h3>
            <Timeline>
              {STUDENT_SCHEDULE.map((item) => (
                <TimelineItem
                  key={item.title}
                  dotClassName={
                    item.active
                      ? "-left-1.5 top-1.5 w-3 h-3 bg-primary rounded-full ring-4 ring-primary-fixed"
                      : "-left-[5px] top-1.5 w-2.5 h-2.5 bg-outline-variant rounded-full"
                  }
                >
                  <p
                    className={`text-label-sm font-label-sm mb-1 ${
                      item.active ? "text-primary font-bold" : "text-text-secondary"
                    }`}
                  >
                    {item.time}
                  </p>
                  {item.boxed ? (
                    <div className="bg-surface p-3 rounded-lg border border-surface-border">
                      <h4 className="text-label-md font-label-md font-medium text-text-primary">{item.title}</h4>
                      <p className="text-body-md font-body-md text-text-secondary text-xs mt-1">{item.desc}</p>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-label-md font-label-md font-medium text-text-primary">{item.title}</h4>
                      <p className="text-body-md font-body-md text-text-secondary text-xs mt-1">{item.desc}</p>
                    </>
                  )}
                </TimelineItem>
              ))}
            </Timeline>
          </div>
        </div>
      </div>
      <div className="h-8"></div>
    </>
  );
};

export default StudentDashboard;
