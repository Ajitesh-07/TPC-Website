"use client";

import { useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  COMPANY_REGISTRATIONS,
  FORM_RESPONSES,
  INDUSTRIES,
  BRANCHES,
  PROCESS_TYPES,
  type CompanyRegistration,
  type FormResponse,
} from "@/data/manage-companies";

type TabKey = "registrations" | "responses";

const TABS: { key: TabKey; label: string }[] = [
  { key: "registrations", label: "Registrations" },
  { key: "responses", label: "Form Responses" },
];

const FORM_INPUT =
  "w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline";

const FLOATING_LABEL =
  "absolute -top-2.5 left-3 bg-surface-container-lowest px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase";

const SELECT_INPUT = `${FORM_INPUT} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat pr-10`;

// ── Registration table columns ────────────────────────────────────────────
const REGISTRATION_COLUMNS: Column<CompanyRegistration>[] = [
  {
    header: "Company",
    className: "py-3 px-4",
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-label-md font-bold text-navy-vibrant shrink-0">
          {r.company.charAt(0)}
        </div>
        <span className="font-medium text-primary">{r.company}</span>
      </div>
    ),
  },
  {
    header: "Industry",
    className: "py-3 px-4 text-text-secondary",
    render: (r) => r.industry,
  },
  {
    header: "Process Type",
    className: "py-3 px-4 text-text-secondary",
    render: (r) => r.processType,
  },
  {
    header: "Status",
    className: "py-3 px-4",
    render: (r) => <StatusBadge tone={r.status.tone}>{r.status.label}</StatusBadge>,
  },
  {
    header: "Responses",
    headerClassName: "text-center",
    className: "py-3 px-4 text-center",
    render: (r) => (
      <span className="inline-flex items-center justify-center min-w-7 px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-label-sm font-label-sm font-semibold">
        {r.responses}
      </span>
    ),
  },
  {
    header: "Created On",
    className: "py-3 px-4 text-text-secondary",
    render: (r) => r.createdOn,
  },
  {
    header: "",
    headerClassName: "text-right",
    className: "py-3 px-4 text-right",
    render: () => (
      <button className="text-text-secondary hover:text-primary p-1 transition-colors">
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
    ),
  },
];

// ── CSV export helper (mock client download) ──────────────────────────────
const exportResponsesCsv = (rows: FormResponse[]) => {
  const header = ["Name", "Roll No", "Branch", "CPI", "Email", "Submitted On", "Company"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.name, r.roll, r.branch, String(r.cpi), r.email, r.submittedOn, r.company]
        .map(escape)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "form-responses.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const ManageCompanies = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("registrations");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // Form selects (mock controlled state)
  const [industry, setIndustry] = useState("");
  const [processType, setProcessType] = useState("");
  const [eligibleBranches, setEligibleBranches] = useState<string[]>([]);

  const toggleBranch = (branch: string) =>
    setEligibleBranches((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );

  const companies = useMemo(
    () => COMPANY_REGISTRATIONS.map((r) => r.company),
    []
  );

  const visibleResponses = useMemo(
    () =>
      FORM_RESPONSES.filter((r) =>
        companyFilter === "all" ? true : r.company === companyFilter
      ),
    [companyFilter]
  );

  // ── Response table columns (depends on nothing dynamic) ─────────────────
  const RESPONSE_COLUMNS: Column<FormResponse>[] = [
    {
      header: "Name",
      className: "py-3 px-4",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-label-sm font-bold shrink-0">
            {r.initials}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-primary truncate">{r.name}</div>
            <div className="text-label-sm text-text-secondary">{r.company}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Roll No",
      className: "py-3 px-4 font-mono text-sm text-on-surface",
      render: (r) => r.roll,
    },
    {
      header: "Branch",
      className: "py-3 px-4",
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant text-label-sm font-label-sm">
          {r.branch}
        </span>
      ),
    },
    {
      header: "CPI",
      className: "py-3 px-4 font-mono text-sm text-on-surface",
      render: (r) => r.cpi.toFixed(2),
    },
    {
      header: "Email",
      className: "py-3 px-4 text-text-secondary",
      render: (r) => r.email,
    },
    {
      header: "Submitted On",
      className: "py-3 px-4 text-text-secondary",
      render: (r) => r.submittedOn,
    },
  ];

  return (
    <>
      {/* Sticky header */}
      <header className="bg-surface sticky top-0 z-30 border-b border-surface-border px-gutter-mobile md:px-gutter-desktop py-6">
        <div className="max-w-container-max mx-auto">
          <h2 className="text-headline-md font-headline-md text-text-primary">
            Manage Companies
          </h2>
          <p className="text-body-md font-body-md text-text-secondary mt-1">
            Register recruiters and collect their data for the season.
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 max-w-container-max mx-auto w-full">
        {/* Tab toggle */}
        <div className="bg-surface-container-low p-1 rounded-xl inline-flex w-full sm:w-auto mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2 rounded-lg text-title-md font-title-md transition-all",
                activeTab === tab.key
                  ? "bg-surface shadow-sm text-primary"
                  : "text-text-secondary hover:text-on-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB A: Registrations ── */}
        {activeTab === "registrations" && (
          <div className="animate-fadeIn space-y-8">
            {/* Register New Company form */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="text-title-lg font-title-lg text-primary mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gold-leaf">
                    add_business
                  </span>
                  Register New Company
                </h3>
                <p className="text-body-md font-body-md text-text-secondary mb-8">
                  Define the registration criteria recruiters must meet for this
                  season.
                </p>

                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="company_name">
                      Company Name
                    </label>
                    <input
                      className={FORM_INPUT}
                      id="company_name"
                      placeholder="e.g. Microsoft"
                      type="text"
                    />
                  </div>

                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="industry">
                      Industry
                    </label>
                    <select
                      className={SELECT_INPUT}
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    >
                      <option disabled value="">
                        Select industry
                      </option>
                      {INDUSTRIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="website">
                      Website
                    </label>
                    <input
                      className={FORM_INPUT}
                      id="website"
                      placeholder="https://company.com"
                      type="url"
                    />
                  </div>

                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="process_type">
                      Process Type
                    </label>
                    <select
                      className={SELECT_INPUT}
                      id="process_type"
                      value={processType}
                      onChange={(e) => setProcessType(e.target.value)}
                    >
                      <option disabled value="">
                        Select process
                      </option>
                      {PROCESS_TYPES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="hr_name">
                      HR Name
                    </label>
                    <input
                      className={FORM_INPUT}
                      id="hr_name"
                      placeholder="e.g. Priya Sharma"
                      type="text"
                    />
                  </div>

                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="hr_email">
                      HR Email
                    </label>
                    <input
                      className={FORM_INPUT}
                      id="hr_email"
                      placeholder="hr@company.com"
                      type="email"
                    />
                  </div>

                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="min_cpi">
                      Minimum CPI
                    </label>
                    <input
                      className={FORM_INPUT}
                      id="min_cpi"
                      placeholder="e.g. 7.5"
                      step="0.1"
                      type="number"
                    />
                  </div>

                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="deadline">
                      Registration Deadline
                    </label>
                    <input className={FORM_INPUT} id="deadline" type="date" />
                  </div>

                  {/* Eligible branches multi-checkbox */}
                  <div className="md:col-span-2 border border-surface-border rounded-xl p-5 bg-surface/50">
                    <span className="block text-label-sm font-label-sm text-text-secondary uppercase tracking-wide mb-4">
                      Eligible Branches
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {BRANCHES.map((branch) => {
                        const checked = eligibleBranches.includes(branch);
                        return (
                          <label
                            key={branch}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-body-md font-body-md",
                              checked
                                ? "border-primary bg-primary-fixed text-primary"
                                : "border-surface-border text-text-secondary hover:border-outline-variant"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBranch(branch)}
                              className="w-4 h-4 accent-primary"
                            />
                            {branch}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end pt-2">
                    <button
                      type="submit"
                      className="btn-gradient text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        check_circle
                      </span>
                      Create Registration
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Existing registrations table */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
              <div className="p-5 border-b border-surface-border bg-surface-bright">
                <h3 className="text-title-md font-title-md text-primary">
                  Company Registrations
                </h3>
                <p className="text-label-md font-label-md text-text-secondary">
                  Recruiters registered for the ongoing season.
                </p>
              </div>
              <DataTable
                columns={REGISTRATION_COLUMNS}
                rows={COMPANY_REGISTRATIONS}
                theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                thClassName="py-3 px-4 font-semibold border-b border-surface-border text-left"
                rowClassName={(_, i) =>
                  `border-b border-surface-border hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface ${
                    i % 2 === 1 ? "bg-neutral-50/50" : ""
                  }`
                }
              />
            </div>
          </div>
        )}

        {/* ── TAB B: Form Responses ── */}
        {activeTab === "responses" && (
          <div className="animate-fadeIn">
            <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
              <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
                <div>
                  <h3 className="text-title-md font-title-md text-primary">
                    Form Responses
                  </h3>
                  <p className="text-label-md font-label-md text-text-secondary">
                    Students who filled a company&apos;s registration form.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="all">All Companies</option>
                    {companies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => exportResponsesCsv(visibleResponses)}
                    className="flex items-center gap-1 text-label-md font-label-md px-3 py-2 border border-surface-border rounded-lg bg-white hover:bg-surface-container-low transition-colors text-text-secondary"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      download
                    </span>
                    Export CSV
                  </button>
                </div>
              </div>

              {visibleResponses.length === 0 ? (
                <div className="text-center py-20 text-text-secondary">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                    inbox
                  </span>
                  <p className="text-title-md font-title-md">
                    No responses for this company yet
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={RESPONSE_COLUMNS}
                  rows={visibleResponses}
                  theadClassName="bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                  thClassName="py-3 px-4 font-semibold border-b border-surface-border text-left"
                  rowClassName={(_, i) =>
                    `border-b border-surface-border hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface ${
                      i % 2 === 1 ? "bg-neutral-50/50" : ""
                    }`
                  }
                />
              )}

              <div className="p-3 bg-surface-bright text-label-sm text-text-secondary">
                Showing {visibleResponses.length} of {FORM_RESPONSES.length} responses
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageCompanies;
