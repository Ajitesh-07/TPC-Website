import MetricCard from "@/components/ui/MetricCard";
import DataTable, { type Column } from "@/components/ui/DataTable";
import {
  ADMIN_STATS,
  ADMIN_ROLE_CHANGES,
  ADMIN_DIRECTORY,
  type DirectoryRow,
} from "@/data/admin";

const DIRECTORY_COLUMNS: Column<DirectoryRow>[] = [
  {
    headerClassName: "w-12",
    className: "py-2 px-4",
    render: (r) => (
      <div
        className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${r.badgeClassName}`}
      >
        {r.badge}
      </div>
    ),
  },
  {
    header: "Roll No / Name",
    className: "py-2 px-4",
    render: (r) => (
      <>
        <div className="font-medium text-primary">{r.rollNo}</div>
        <div className="text-label-sm text-text-secondary">{r.name}</div>
      </>
    ),
  },
  {
    header: "Department",
    className: "py-2 px-4 text-text-secondary",
    render: (r) => r.department,
  },
  {
    header: "Credits",
    className: "py-2 px-4 font-mono text-sm",
    render: (r) => (
      <span className={r.creditsClassName}>{r.credits}</span>
    ),
  },
  {
    header: "Status",
    className: "py-2 px-4",
    render: (r) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${r.status.className}`}
      >
        {r.status.label}
      </span>
    ),
  },
  {
    header: "Actions",
    headerClassName: "text-right",
    className: "py-2 px-4 text-right",
    render: () => (
      <>
        <button className="text-text-secondary hover:text-primary p-1">
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button className="text-text-secondary hover:text-primary p-1">
          <span className="material-symbols-outlined text-[18px]">more_vert</span>
        </button>
      </>
    ),
  },
];

const SuperAdminDashboard = () => {
  return (
    <div className="flex-1 p-gutter-mobile md:p-gutter-desktop space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary">
            Global Dashboard
          </h2>
          <p className="text-body-md font-body-md text-text-secondary mt-1">
            Admin &amp; Credit Management Overview
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative grow md:grow-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">
              search
            </span>
            <input
              className="pl-9 pr-4 py-2 rounded-lg border border-surface-border bg-surface-container-lowest text-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-64"
              placeholder="Search directory..."
              type="text"
            />
          </div>
          <button className="bg-surface-container-lowest border border-surface-border p-2 rounded-lg text-text-secondary hover:text-primary transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Quick stats */}
        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {ADMIN_STATS.map((stat) => (
            <MetricCard
              key={stat.label}
              {...stat}
              className="h-32 flex flex-col justify-between"
              valueClassName="text-headline-md font-headline-md text-primary"
            />
          ))}
        </div>

        {/* Credit management widget */}
        <div className="md:col-span-4 bg-primary text-on-primary rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h3 className="text-title-md font-title-md font-semibold">
              Credit Management
            </h3>
            <button className="text-on-primary/70 hover:text-white transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/5 mb-4">
              <label className="text-label-sm font-label-sm text-on-primary/70 block mb-1">
                Quick Adjust Student Credits
              </label>
              <div className="flex gap-2 mt-2">
                <input
                  className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-body-md text-white placeholder:text-white/40 focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf outline-none"
                  placeholder="Roll No."
                  type="text"
                />
                <input
                  className="w-20 bg-white/5 border border-white/20 rounded px-3 py-2 text-body-md text-white placeholder:text-white/40 focus:border-gold-leaf focus:ring-1 focus:ring-gold-leaf outline-none"
                  placeholder="+/-"
                  type="number"
                />
              </div>
              <button className="w-full mt-3 bg-gold-leaf text-on-secondary-fixed-variant py-2 rounded font-title-md text-sm hover:bg-secondary-container transition-colors shadow-sm">
                Apply Adjustment
              </button>
            </div>
            <a
              className="text-label-sm font-label-sm text-gold-leaf hover:underline flex items-center gap-1 self-start mt-auto"
              href="#"
            >
              View Full Audit Log{" "}
              <span className="material-symbols-outlined text-[14px]">
                arrow_forward
              </span>
            </a>
          </div>
        </div>

        {/* Placement trajectory chart */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-md font-title-md text-primary">
              Placement Trajectory
            </h3>
            <select className="text-label-md font-label-md bg-surface border border-surface-border rounded px-2 py-1 text-text-secondary outline-none focus:border-primary">
              <option>2023-2024</option>
              <option>2022-2023</option>
            </select>
          </div>
          <div className="flex-1 bg-surface-container-low rounded-lg border border-dashed border-outline-variant flex items-center justify-center min-h-[250px] relative">
            <div className="absolute bottom-0 left-0 w-full h-[80%] flex items-end justify-between px-4 pb-4 gap-2 opacity-40">
              {[40, 55, 45, 70, 60, 85, 75, 95].map((h, i) => (
                <div
                  key={i}
                  className="w-1/12 bg-primary-fixed-dim rounded-t"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
            <span className="text-text-secondary text-body-md z-10 flex items-center gap-2">
              <span className="material-symbols-outlined">insights</span>
              Interactive Chart Component
            </span>
          </div>
        </div>

        {/* Recent role changes */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-surface-border flex justify-between items-center bg-surface-bright">
            <h3 className="text-title-md font-title-md text-primary">
              Recent Role Changes
            </h3>
            <button className="text-primary hover:bg-surface-container rounded-full p-1 transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {ADMIN_ROLE_CHANGES.map((change) => (
              <div
                key={change.name}
                className="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold ${change.avatarClassName}`}
                >
                  {change.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-body-md text-primary truncate">
                    {change.name}
                  </p>
                  <p className="text-label-sm font-label-sm text-text-secondary truncate">
                    {change.change}
                  </p>
                </div>
                <span className="text-label-sm text-text-secondary">
                  {change.time}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-surface-border text-center bg-surface-bright">
            <a
              className="text-label-sm font-label-sm text-primary hover:underline"
              href="#"
            >
              View All Roles
            </a>
          </div>
        </div>

        {/* Student directory */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden mt-4">
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
            <div>
              <h3 className="text-title-md font-title-md text-primary">
                Student Directory
              </h3>
              <p className="text-label-md font-label-md text-text-secondary">
                Manage and view student placement statuses.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-1 text-label-md font-label-md px-3 py-1.5 border border-surface-border rounded bg-white hover:bg-surface-container-low transition-colors text-text-secondary">
                <span className="material-symbols-outlined text-[16px]">
                  download
                </span>{" "}
                Export
              </button>
            </div>
          </div>
          <DataTable
            columns={DIRECTORY_COLUMNS}
            rows={ADMIN_DIRECTORY}
            theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
            thClassName="py-3 px-4 font-semibold border-b border-surface-border"
            rowClassName={(_, i) =>
              `border-b border-surface-border hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface ${
                i % 2 === 1 ? "bg-neutral-50/50" : ""
              }`
            }
          />
          <div className="p-3 bg-surface-bright flex justify-between items-center text-label-sm text-text-secondary">
            <span>Showing 1-3 of 842 students</span>
            <div className="flex gap-1">
              <button
                className="p-1 hover:bg-surface-variant rounded disabled:opacity-50"
                disabled
              >
                <span className="material-symbols-outlined text-[16px]">
                  chevron_left
                </span>
              </button>
              <button className="p-1 hover:bg-surface-variant rounded">
                <span className="material-symbols-outlined text-[16px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
