import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { STUDENT_DIRECTORY, type DirectoryStudent } from "@/data/profiles";

const COLUMNS: Column<DirectoryStudent>[] = [
  {
    header: "Student",
    className: "px-4 py-3",
    render: (s) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-label-md font-label-md font-bold shrink-0">
          {s.initials}
        </div>
        <div className="min-w-0">
          <div className="text-body-md font-body-md font-semibold text-text-primary truncate">
            {s.name}
          </div>
          <div className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider">
            {s.roll}
          </div>
        </div>
      </div>
    ),
  },
  {
    header: "Branch",
    className: "px-4 py-3 text-text-secondary",
    render: (s) => s.branch,
  },
  {
    header: "CGPA",
    className: "px-4 py-3 text-text-secondary",
    render: (s) => s.cgpa,
  },
  {
    header: "Email",
    className: "px-4 py-3 text-text-secondary hidden lg:table-cell",
    headerClassName: "hidden lg:table-cell",
    render: (s) => s.email,
  },
  {
    header: "Status",
    className: "px-4 py-3",
    render: (s) => (
      <StatusBadge tone={s.status.tone} className="px-2 py-1 rounded">
        {s.status.label}
      </StatusBadge>
    ),
  },
  {
    header: "Action",
    headerClassName: "text-right",
    className: "px-4 py-3 text-right",
    render: () => (
      <button
        type="button"
        className="inline-flex items-center gap-1 text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors"
      >
        View
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    ),
  },
];

const StudentProfiles = () => {
  return (
    <>
      <PortalHeader
        title="Student Profiles"
        subtitle="Directory of all registered students — for coordinators and admins."
        className="bg-surface/90 px-gutter-mobile md:px-gutter-desktop"
        innerClassName="max-w-container-max mx-auto"
        actions={
          <label className="input-glow flex items-center gap-2 rounded-lg border border-surface-border bg-surface-container-lowest px-3 py-2 w-full sm:w-72">
            <span className="material-symbols-outlined text-[18px] text-text-secondary">
              search
            </span>
            <input
              type="search"
              placeholder="Search by name or roll number"
              className="bg-transparent text-body-md text-text-primary placeholder:text-text-secondary focus:outline-none w-full"
            />
          </label>
        }
      />

      <div className="p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto w-full">
        <div className="bg-surface-container-lowest border border-surface-border rounded-xl soft-shadow overflow-hidden">
          <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-bright">
            <h2 className="text-title-md font-title-md text-text-primary">
              All Students
              <span className="ml-2 text-label-sm font-label-sm text-text-secondary">
                {STUDENT_DIRECTORY.length} total
              </span>
            </h2>
          </div>
          <DataTable
            columns={COLUMNS}
            rows={STUDENT_DIRECTORY}
            className="min-w-[640px]"
            theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
            thClassName="px-4 py-3 font-semibold"
            rowClassName={() =>
              "border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md"
            }
          />
        </div>
      </div>
    </>
  );
};

export default StudentProfiles;
