import PortalHeader from "@/components/ui/PortalHeader";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import {
  COORDINATOR_METRICS,
  COORDINATOR_DRIVES,
  COORDINATOR_SCHEDULE,
  COORDINATOR_QUICK_ACTIONS,
  type CoordinatorDrive,
} from "@/data/coordinator";

const DRIVE_COLUMNS: Column<CoordinatorDrive>[] = [
  {
    header: "Company",
    className: "px-4 py-3 font-medium text-text-primary",
    render: (d) => d.company,
  },
  {
    header: "Role",
    className: "px-4 py-3 text-text-secondary",
    render: (d) => d.role,
  },
  {
    header: "Status",
    className: "px-4 py-3",
    render: (d) => (
      <StatusBadge tone={d.status.tone} className="px-2 py-1 rounded">
        {d.status.label}
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
      <button className="p-1 text-text-secondary hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
        <span className="material-symbols-outlined text-[20px]">
          chevron_right
        </span>
      </button>
    ),
  },
];

const CoordinatorDashboard = () => {
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
            <button className="bg-surface-container-lowest border border-surface-border text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:border-primary transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined">download</span>
              Export Report
            </button>
            <button className="bg-gradient-to-b from-primary to-navy-deep border-t border-primary-fixed-dim/30 text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              Create Drive
            </button>
          </div>
        }
      />

      {/* Content */}
      <div className="p-gutter-mobile md:p-gutter-desktop flex-1 max-w-container-max mx-auto w-full">
        {/* Metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {COORDINATOR_METRICS.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
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
                <button className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors">
                  View All
                </button>
              </div>
              <DataTable
                columns={DRIVE_COLUMNS}
                rows={COORDINATOR_DRIVES}
                theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                thClassName="px-4 py-3 font-semibold"
                tdClassName=""
                rowClassName={(_, i) =>
                  `border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors group text-body-md font-body-md ${
                    i % 2 === 1 ? "bg-neutral-50" : ""
                  }`
                }
              />
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
                    Google shortlist is ready for publication.
                  </p>
                  <button className="text-label-md font-label-md text-primary font-semibold hover:underline">
                    Review & Publish
                  </button>
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
                    12 student profiles require manual approval.
                  </p>
                  <button className="text-label-md font-label-md text-status-error font-semibold hover:underline">
                    Verify Now
                  </button>
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
              <div className="space-y-4">
                {COORDINATOR_SCHEDULE.map((event) => (
                  <div
                    key={event.title}
                    className="flex gap-3 relative before:absolute before:left-1.5 before:top-6 before:bottom-0 before:w-px before:bg-surface-border last:before:hidden"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 shrink-0 relative z-10 ring-4 ring-surface-container-lowest ${event.dotClassName}`}
                    ></div>
                    <div>
                      <div
                        className={`text-label-md font-label-md font-semibold ${event.timeClassName}`}
                      >
                        {event.time}
                      </div>
                      <div className="text-body-md font-body-md text-text-primary font-medium">
                        {event.title}
                      </div>
                      <div className="text-label-sm font-label-sm text-text-secondary">
                        {event.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 border border-surface-border rounded-lg text-label-md font-label-md text-text-secondary hover:bg-surface-container-low transition-colors">
                View Full Calendar
              </button>
            </div>

            {/* Quick actions */}
            <div className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4">
              <h2 className="text-title-md font-title-md text-text-primary mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {COORDINATOR_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border border-surface-border hover:border-primary hover:bg-primary/5 transition-all text-text-secondary hover:text-primary"
                  >
                    <span className="material-symbols-outlined mb-1">
                      {action.icon}
                    </span>
                    <span className="text-label-sm font-label-sm text-center">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoordinatorDashboard;
