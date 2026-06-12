"use client";

import { useMemo, useState, type FormEvent } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  useRegistrations,
  useCreateRegistration,
  useUpdateRegistration,
  useRegistrationResponses,
  useMeta,
} from "@/lib/hooks";
import type {
  ProcessTypeApi,
  RegistrationRow,
  RegistrationResponseRow,
  RegistrationStatusApi,
} from "@/lib/api-types";

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

// ── Static industry list (no meta endpoint for industries) ────────────────
const INDUSTRY_OPTIONS: string[] = [
  "Software / IT",
  "Finance / Fintech",
  "Semiconductors / Hardware",
  "Core / Manufacturing",
  "E-Commerce / Retail",
  "Consulting",
  "Analytics / Data Science",
];

// ── Process type: UI label ⇄ API enum ─────────────────────────────────────
const PROCESS_OPTIONS: { value: ProcessTypeApi; label: string }[] = [
  { value: "fte", label: "Full-Time" },
  { value: "internship", label: "Internship" },
  { value: "six_month_fte", label: "6-Month FTE Conversion" },
  { value: "six_month_ppo", label: "6-Month + PPO" },
];

const PROCESS_LABELS: Record<ProcessTypeApi, string> = {
  fte: "Full-Time",
  internship: "Internship",
  six_month_fte: "6-Month FTE Conversion",
  six_month_ppo: "6-Month + PPO",
};

const processLabel = (p: ProcessTypeApi | null): string =>
  p ? PROCESS_LABELS[p] : "—";

// ── Status → StatusBadge tone/label ───────────────────────────────────────
const STATUS_TONE: Record<RegistrationStatusApi, BadgeTone> = {
  open: "success",
  closed: "neutral",
  pending: "warning",
};

const STATUS_LABEL: Record<RegistrationStatusApi, string> = {
  open: "Open",
  closed: "Closed",
  pending: "Pending",
};

// ── Local formatters / derivations ────────────────────────────────────────
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** ISO/date string → "Oct 15, 2024". Returns "—" for empty/invalid input. */
const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/** "Aarav Sharma" → "AS". */
const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

// ── CSV export helper (client-side download) ──────────────────────────────
const exportResponsesCsv = (
  rows: RegistrationResponseRow[],
  fileLabel: string
) => {
  const header = ["Name", "Roll No", "Branch", "CPI", "Email", "Submitted On"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.student.fullName,
        r.student.rollNo,
        r.student.branchCode ?? "",
        r.student.cpi != null ? r.student.cpi.toFixed(2) : "",
        r.student.email,
        formatDate(r.submittedAt),
      ]
        .map(escape)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileLabel || "form-responses"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ── Shared skeleton block ─────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded bg-surface-variant", className)} />
);

const ManageCompanies = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("registrations");

  // Registration form controlled state
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [processType, setProcessType] = useState<"" | ProcessTypeApi>("");
  const [hrName, setHrName] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [minCpi, setMinCpi] = useState("");
  const [deadline, setDeadline] = useState("");
  const [eligibleBranches, setEligibleBranches] = useState<string[]>([]);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Responses tab: selected registration
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<
    string | null
  >(null);

  // ── Data ────────────────────────────────────────────────────────────────
  const registrationsQuery = useRegistrations({ page: 1 });
  const meta = useMeta();
  const createRegistration = useCreateRegistration();
  const updateRegistration = useUpdateRegistration();
  const responsesQuery = useRegistrationResponses(selectedRegistrationId);

  const registrations = registrationsQuery.data?.items ?? [];
  const branchOptions = meta.data?.branches ?? [];
  const responses = responsesQuery.data ?? [];

  const selectedRegistration = useMemo(
    () => registrations.find((r) => r.id === selectedRegistrationId) ?? null,
    [registrations, selectedRegistrationId]
  );

  const toggleBranch = (code: string) =>
    setEligibleBranches((prev) =>
      prev.includes(code) ? prev.filter((b) => b !== code) : [...prev, code]
    );

  const resetForm = () => {
    setCompanyName("");
    setWebsite("");
    setIndustry("");
    setProcessType("");
    setHrName("");
    setHrEmail("");
    setMinCpi("");
    setDeadline("");
    setEligibleBranches([]);
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    setCreateSuccess(false);
    const parsedCpi = minCpi.trim() === "" ? undefined : Number(minCpi);
    createRegistration.mutate(
      {
        companyName: companyName.trim(),
        industry: industry || undefined,
        processType: processType || undefined,
        minCpi:
          parsedCpi != null && !Number.isNaN(parsedCpi) ? parsedCpi : undefined,
        registrationDeadline: deadline || undefined,
        eligibleBranchCodes: eligibleBranches,
      },
      {
        onSuccess: () => {
          setCreateSuccess(true);
          resetForm();
        },
      }
    );
  };

  const handleToggleStatus = (row: RegistrationRow) => {
    const nextStatus: RegistrationStatusApi =
      row.status === "open" ? "closed" : "open";
    updateRegistration.mutate({ id: row.id, status: nextStatus });
  };

  const selectRow = (row: RegistrationRow) => {
    setSelectedRegistrationId(row.id);
    setActiveTab("responses");
  };

  // ── Registration table columns ──────────────────────────────────────────
  const REGISTRATION_COLUMNS: Column<RegistrationRow>[] = [
    {
      header: "Company",
      className: "py-3 px-4",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-label-md font-bold text-navy-vibrant shrink-0">
            {r.companyName.charAt(0)}
          </div>
          <span className="font-medium text-primary">{r.companyName}</span>
        </div>
      ),
    },
    {
      header: "Industry",
      className: "py-3 px-4 text-text-secondary",
      render: (r) => r.industry ?? "—",
    },
    {
      header: "Process Type",
      className: "py-3 px-4 text-text-secondary",
      render: (r) => processLabel(r.processType),
    },
    {
      header: "Status",
      className: "py-3 px-4",
      render: (r) => (
        <StatusBadge tone={STATUS_TONE[r.status]}>
          {STATUS_LABEL[r.status]}
        </StatusBadge>
      ),
    },
    {
      header: "Responses",
      headerClassName: "text-center",
      className: "py-3 px-4 text-center",
      render: (r) => (
        <span className="inline-flex items-center justify-center min-w-7 px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-label-sm font-label-sm font-semibold">
          {r.responseCount}
        </span>
      ),
    },
    {
      header: "Created On",
      className: "py-3 px-4 text-text-secondary",
      render: (r) => formatDate(r.createdAt),
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "py-3 px-4 text-right",
      render: (r) => {
        const isOpen = r.status === "open";
        const busy =
          updateRegistration.isPending &&
          updateRegistration.variables?.id === r.id;
        return (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(r);
            }}
            className={cn(
              "inline-flex items-center gap-1 text-label-sm font-label-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60",
              isOpen
                ? "border-surface-border text-text-secondary hover:bg-surface-container-low"
                : "border-status-success/30 text-status-success hover:bg-status-success/10"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">
              {busy ? "progress_activity" : isOpen ? "lock" : "lock_open"}
            </span>
            {busy ? "Saving" : isOpen ? "Close" : "Open"}
          </button>
        );
      },
    },
  ];

  // ── Response table columns ──────────────────────────────────────────────
  const RESPONSE_COLUMNS: Column<RegistrationResponseRow>[] = [
    {
      header: "Name",
      className: "py-3 px-4",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-label-sm font-bold shrink-0">
            {initialsOf(r.student.fullName)}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-primary truncate">
              {r.student.fullName}
            </div>
            <div className="text-label-sm text-text-secondary truncate">
              {r.student.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Roll No",
      className: "py-3 px-4 font-mono text-sm text-on-surface",
      render: (r) => r.student.rollNo,
    },
    {
      header: "Branch",
      className: "py-3 px-4",
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant text-label-sm font-label-sm">
          {r.student.branchCode ?? "—"}
        </span>
      ),
    },
    {
      header: "CPI",
      className: "py-3 px-4 font-mono text-sm text-on-surface",
      render: (r) => (r.student.cpi != null ? r.student.cpi.toFixed(2) : "—"),
    },
    {
      header: "Email",
      className: "py-3 px-4 text-text-secondary",
      render: (r) => r.student.email,
    },
    {
      header: "Submitted On",
      className: "py-3 px-4 text-text-secondary",
      render: (r) => formatDate(r.submittedAt),
    },
  ];

  const tableShellClasses = {
    theadClassName:
      "bg-surface-container text-label-sm font-label-sm text-text-secondary uppercase tracking-wider",
    thClassName: "py-3 px-4 font-semibold border-b border-surface-border text-left",
    rowClassName: (_row: unknown, i: number) =>
      `border-b border-surface-border hover:bg-surface-container-low transition-colors text-body-md font-body-md text-on-surface ${
        i % 2 === 1 ? "bg-neutral-50/50" : ""
      }`,
  };

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
                  onSubmit={handleCreate}
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
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
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
                      {INDUSTRY_OPTIONS.map((item) => (
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
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
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
                      onChange={(e) =>
                        setProcessType(e.target.value as "" | ProcessTypeApi)
                      }
                    >
                      <option disabled value="">
                        Select process
                      </option>
                      {PROCESS_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
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
                      value={hrName}
                      onChange={(e) => setHrName(e.target.value)}
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
                      value={hrEmail}
                      onChange={(e) => setHrEmail(e.target.value)}
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
                      value={minCpi}
                      onChange={(e) => setMinCpi(e.target.value)}
                    />
                  </div>

                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="deadline">
                      Registration Deadline
                    </label>
                    <input
                      className={FORM_INPUT}
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>

                  {/* Eligible branches multi-checkbox */}
                  <div className="md:col-span-2 border border-surface-border rounded-xl p-5 bg-surface/50">
                    <span className="block text-label-sm font-label-sm text-text-secondary uppercase tracking-wide mb-4">
                      Eligible Branches
                    </span>
                    {meta.isLoading ? (
                      <div className="flex flex-wrap gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
                        ))}
                      </div>
                    ) : meta.isError ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-status-error/10 px-4 py-3 text-status-error">
                        <span className="text-body-md font-body-md">
                          Couldn&apos;t load branches.
                        </span>
                        <button
                          type="button"
                          onClick={() => meta.refetch()}
                          className="text-label-md font-label-md underline"
                        >
                          Retry
                        </button>
                      </div>
                    ) : branchOptions.length === 0 ? (
                      <p className="text-body-md font-body-md text-text-secondary">
                        No branches available.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {branchOptions.map((branch) => {
                          const checked = eligibleBranches.includes(branch.code);
                          return (
                            <label
                              key={branch.id}
                              title={branch.name}
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
                                onChange={() => toggleBranch(branch.code)}
                                className="w-4 h-4 accent-primary"
                              />
                              {branch.code}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Inline create feedback */}
                  {createRegistration.isError && (
                    <div className="md:col-span-2 flex items-center gap-2 rounded-lg bg-status-error/10 border border-status-error/20 px-4 py-3 text-status-error text-body-md font-body-md">
                      <span className="material-symbols-outlined text-[18px]">
                        error
                      </span>
                      {createRegistration.error instanceof Error
                        ? createRegistration.error.message
                        : "Could not create the registration. Please try again."}
                    </div>
                  )}
                  {createSuccess && !createRegistration.isPending && (
                    <div className="md:col-span-2 flex items-center gap-2 rounded-lg bg-status-success/10 border border-status-success/20 px-4 py-3 text-status-success text-body-md font-body-md">
                      <span className="material-symbols-outlined text-[18px]">
                        check_circle
                      </span>
                      Registration created successfully.
                    </div>
                  )}

                  <div className="md:col-span-2 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={createRegistration.isPending}
                      className="btn-gradient text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-[20px]",
                          createRegistration.isPending && "animate-spin"
                        )}
                      >
                        {createRegistration.isPending
                          ? "progress_activity"
                          : "check_circle"}
                      </span>
                      {createRegistration.isPending
                        ? "Creating…"
                        : "Create Registration"}
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

              {registrationsQuery.isLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : registrationsQuery.isError ? (
                <div className="m-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-status-error/10 border border-status-error/20 px-4 py-4 text-status-error">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                      error
                    </span>
                    <span className="text-body-md font-body-md">
                      Couldn&apos;t load registrations.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => registrationsQuery.refetch()}
                    className="flex items-center gap-1 text-label-md font-label-md px-3 py-1.5 rounded-lg border border-status-error/30 hover:bg-status-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      refresh
                    </span>
                    Retry
                  </button>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-20 text-text-secondary">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                    domain_add
                  </span>
                  <p className="text-title-md font-title-md">
                    No companies registered yet
                  </p>
                  <p className="text-body-md font-body-md mt-1">
                    Use the form above to register your first recruiter.
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={REGISTRATION_COLUMNS}
                  rows={registrations}
                  theadClassName={tableShellClasses.theadClassName}
                  thClassName={tableShellClasses.thClassName}
                  rowClassName={(row, i) =>
                    cn(
                      tableShellClasses.rowClassName(row, i),
                      "cursor-pointer",
                      row.id === selectedRegistrationId && "bg-primary-fixed/40"
                    )
                  }
                />
              )}
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
                    value={selectedRegistrationId ?? ""}
                    onChange={(e) =>
                      setSelectedRegistrationId(e.target.value || null)
                    }
                    className="min-w-0 flex-1 sm:flex-none bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="">Select a company…</option>
                    {registrations.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.companyName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      exportResponsesCsv(
                        responses,
                        selectedRegistration
                          ? `${selectedRegistration.companyName}-responses`
                          : "form-responses"
                      )
                    }
                    disabled={responses.length === 0}
                    className="shrink-0 flex items-center gap-1 text-label-md font-label-md px-3 py-2 border border-surface-border rounded-lg bg-white hover:bg-surface-container-low transition-colors text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      download
                    </span>
                    Export CSV
                  </button>
                </div>
              </div>

              {!selectedRegistrationId ? (
                <div className="text-center py-20 text-text-secondary">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                    ads_click
                  </span>
                  <p className="text-title-md font-title-md">
                    Select a company to view responses
                  </p>
                  <p className="text-body-md font-body-md mt-1">
                    Pick a registration above, or click a row in the
                    Registrations tab.
                  </p>
                </div>
              ) : responsesQuery.isLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : responsesQuery.isError ? (
                <div className="m-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-status-error/10 border border-status-error/20 px-4 py-4 text-status-error">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                      error
                    </span>
                    <span className="text-body-md font-body-md">
                      Couldn&apos;t load responses.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => responsesQuery.refetch()}
                    className="flex items-center gap-1 text-label-md font-label-md px-3 py-1.5 rounded-lg border border-status-error/30 hover:bg-status-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      refresh
                    </span>
                    Retry
                  </button>
                </div>
              ) : responses.length === 0 ? (
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
                  rows={responses}
                  theadClassName={tableShellClasses.theadClassName}
                  thClassName={tableShellClasses.thClassName}
                  rowClassName={tableShellClasses.rowClassName}
                />
              )}

              {selectedRegistrationId &&
                !responsesQuery.isLoading &&
                !responsesQuery.isError && (
                  <div className="p-3 bg-surface-bright text-label-sm text-text-secondary">
                    Showing {responses.length}{" "}
                    {responses.length === 1 ? "response" : "responses"}
                    {selectedRegistration
                      ? ` for ${selectedRegistration.companyName}`
                      : ""}
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageCompanies;
