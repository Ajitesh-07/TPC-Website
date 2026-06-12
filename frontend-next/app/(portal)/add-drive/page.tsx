"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useCompanies,
  useCreateCompany,
  useCreateDrive,
  useMeta,
  useSubmitDrive,
} from "@/lib/hooks";
import type {
  CreateDrivePayload,
  ProcessTypeApi,
  StageTypeApi,
} from "@/lib/api-types";
import { INDUSTRIES } from "@/data/add-drive";

const STEPS = [
  "Basic Info",
  "Role Specs",
  "Process",
  "Eligibility",
  "Timeline",
];

const FORM_INPUT =
  "w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline";

const FORM_TEXTAREA =
  "w-full bg-transparent border border-outline-variant rounded-lg px-4 py-4 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline resize-none";

const FLOATING_LABEL =
  "absolute -top-2.5 left-3 bg-surface-container-lowest px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase";

const SELECT_ARROW =
  "appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat pr-10";

const NEXT_BUTTON =
  "bg-gradient-to-b from-primary to-navy-deep text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:shadow-md hover:from-primary-container hover:to-primary transition-all duration-200 flex items-center gap-2 border-t border-primary-fixed-dim/30";

const BACK_BUTTON =
  "px-6 py-3 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-container-low transition-colors text-title-md font-title-md flex items-center gap-2";

const TOTAL_STEPS = STEPS.length;

/** Process-type cards (labels/hints from the original design → API enum values). */
const PROCESS_TYPE_OPTIONS: {
  value: ProcessTypeApi;
  label: string;
  hint: string;
}[] = [
  {
    value: "internship",
    label: "Internship",
    hint: "Fixed-duration internship with a monthly stipend.",
  },
  {
    value: "six_month_fte",
    label: "6M + FTE",
    hint: "6-month internship followed by a full-time offer.",
  },
  {
    value: "six_month_ppo",
    label: "6M + PPO",
    hint: "6-month internship with a pre-placement offer on performance.",
  },
  {
    value: "fte",
    label: "FTE",
    hint: "Direct full-time employment offer.",
  },
];

/** "" → undefined, otherwise parsed number (NaN-safe). */
const num = (value: string): number | undefined => {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

/** "YYYY-MM-DD" (date input) → ISO string at local midnight. */
const toIso = (date: string): string | undefined =>
  date ? new Date(`${date}T00:00:00`).toISOString() : undefined;

const AddDriveForm = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 — company
  const [companyId, setCompanyId] = useState("");
  const [newCompanyMode, setNewCompanyMode] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("");
  // HR point of contact (display-only for now — no API field on the drive yet)
  const [hrName, setHrName] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [hrPhone, setHrPhone] = useState("");

  // Step 2 — role
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [openings, setOpenings] = useState("");
  const [location, setLocation] = useState("");
  const [ctc, setCtc] = useState("");
  const [stipend, setStipend] = useState("");

  // Step 3 — process
  const [processType, setProcessType] = useState<ProcessTypeApi | "">("");

  // Step 4 — eligibility
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [minCpi, setMinCpi] = useState("");
  const [allowBacklog, setAllowBacklog] = useState(false);
  const [customRules, setCustomRules] = useState("");

  // Step 5 — timeline
  const [deadline, setDeadline] = useState("");
  const [oaDate, setOaDate] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [resultDate, setResultDate] = useState("");

  // Submission state
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<"draft" | "submit" | null>(null);
  const [saved, setSaved] = useState<{ id: string; submitted: boolean } | null>(null);

  const meta = useMeta();
  const companies = useCompanies();
  const createCompany = useCreateCompany();
  const createDrive = useCreateDrive();
  const submitDrive = useSubmitDrive();

  const saving = pendingMode !== null;

  const toggle = (
    value: string,
    list: string[],
    setList: (next: string[]) => void
  ) => {
    setList(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  };

  const next = () => setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const save = async (mode: "draft" | "submit") => {
    if (saving || saved) return;
    setFormError(null);

    if (newCompanyMode ? !newCompanyName.trim() : !companyId) {
      setFormError(
        newCompanyMode
          ? "Enter the new company's name (Basic Info)."
          : "Select a company or register a new one (Basic Info)."
      );
      setCurrentStep(1);
      return;
    }
    if (!title.trim()) {
      setFormError("Job title is required (Role Specs).");
      setCurrentStep(2);
      return;
    }
    if (!processType) {
      setFormError("Choose a process type (Process).");
      setCurrentStep(3);
      return;
    }

    setPendingMode(mode);
    try {
      let resolvedCompanyId = companyId;
      if (newCompanyMode) {
        const company = await createCompany.mutateAsync({
          name: newCompanyName.trim(),
          website: newCompanyWebsite.trim() || undefined,
          industry: newCompanyIndustry || undefined,
        });
        resolvedCompanyId = company.id;
      }

      const stageDates: { type: StageTypeApi; date: string }[] = [
        { type: "registration", date: deadline },
        { type: "online_assessment", date: oaDate },
        { type: "interview", date: interviewDate },
        { type: "offer", date: resultDate },
      ];
      const payload: CreateDrivePayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        processType,
        location: location.trim() || undefined,
        ctcLpa: num(ctc),
        stipendPerMonth: num(stipend),
        openings: num(openings),
        minCpi: num(minCpi),
        allowBacklog,
        customRules: customRules.trim() || undefined,
        applicationDeadline: toIso(deadline),
        branchIds,
        programIds,
        skillNames: [],
        stages: stageDates.map((s, i) => ({
          type: s.type,
          sequence: i + 1,
          scheduledAt: toIso(s.date),
        })),
        companyId: resolvedCompanyId,
      };

      const { id } = await createDrive.mutateAsync(payload);
      if (mode === "submit") {
        await submitDrive.mutateAsync(id);
      }
      setSaved({ id, submitted: mode === "submit" });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Something went wrong while saving."
      );
    } finally {
      setPendingMode(null);
    }
  };

  const circleClass = (step: number) => {
    if (step < currentStep)
      return "w-8 h-8 rounded-full bg-surface-tint text-on-primary flex items-center justify-center text-title-md font-title-md shadow-sm transition-colors";
    if (step === currentStep)
      return "w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-title-md font-title-md shadow-sm transition-transform scale-105";
    return "w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-surface-border text-text-secondary flex items-center justify-center text-title-md font-title-md transition-colors";
  };

  const textClass = (step: number) => {
    if (step < currentStep) return "text-label-md font-label-md text-surface-tint";
    if (step === currentStep)
      return "text-label-md font-label-md text-primary font-bold";
    return "text-label-md font-label-md text-text-secondary";
  };

  return (
    <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 md:py-12 max-w-[1000px] mx-auto w-full transition-all duration-300 ease-in-out">
      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <nav className="flex items-center gap-2 text-label-sm font-label-sm text-text-secondary mb-3">
            <span className="hover:text-primary transition-colors">Drives</span>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span className="text-primary font-bold">Add Drive</span>
          </nav>
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-text-primary tracking-tight">
            Add Placement Drive
          </h1>
          <p className="text-body-md font-body-md text-text-secondary mt-1 max-w-xl">
            Set up a new company drive with role, eligibility, and timeline
            details. Saved drives are sent to the TPC for approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-5 py-2.5 rounded-lg border border-surface-border text-text-primary text-title-md font-title-md hover:bg-surface-container-low hover:border-outline-variant transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            disabled={saving || !!saved}
            onClick={() => save("draft")}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {pendingMode === "draft" ? "Saving…" : "Save as Draft"}
          </button>
        </div>
      </header>

      {/* Stepper */}
      <div className="mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-surface-border z-0"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary z-0 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`,
          }}
        ></div>
        <ul className="relative z-10 flex justify-between">
          {STEPS.map((label, index) => {
            const step = index + 1;
            return (
              <li
                key={label}
                className="flex flex-col items-center gap-2 group cursor-pointer"
                onClick={() => setCurrentStep(step)}
              >
                <div className={circleClass(step)}>
                  {step < currentStep ? (
                    <span className="material-symbols-outlined text-[18px]">
                      check
                    </span>
                  ) : (
                    step
                  )}
                </div>
                <span className={cn(textClass(step), "hidden sm:block")}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Form container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-border p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Success panel */}
        {saved ? (
          <div className="relative z-10 text-center py-14 animate-fadeIn">
            <span className="material-symbols-outlined text-status-success text-[56px]">
              check_circle
            </span>
            <h2 className="text-headline-md font-headline-md text-text-primary mt-4 mb-2">
              {saved.submitted
                ? "Drive submitted for approval"
                : "Drive saved as draft"}
            </h2>
            <p className="text-body-md font-body-md text-text-secondary max-w-md mx-auto mb-8">
              {saved.submitted
                ? "The TPC has been notified. You can track its status and manage stages from the Drive Workspace."
                : "You can keep editing this drive and submit it for approval from the Drive Workspace."}
            </p>
            <Link href="/drive-workspace" className={cn(NEXT_BUTTON, "inline-flex")}>
              Open Drive Workspace
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </Link>
          </div>
        ) : (
        <form
          className="relative z-10"
          onSubmit={(e) => {
            e.preventDefault();
            // Only the step-5 "Submit for Approval" button submits; Enter on
            // earlier steps must not fire an accidental submission.
            if (currentStep === TOTAL_STEPS) save("submit");
          }}
        >
          {/* Inline error (validation / API) */}
          {formError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3">
              <span className="material-symbols-outlined text-status-error text-[20px] mt-0.5">
                error
              </span>
              <p className="text-label-md font-label-md text-status-error">
                {formError}
              </p>
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="company_select">
                    Company
                  </label>
                  <select
                    className={cn(FORM_INPUT, SELECT_ARROW, "disabled:opacity-50")}
                    id="company_select"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    disabled={newCompanyMode || companies.isLoading}
                  >
                    <option disabled value="">
                      {companies.isLoading
                        ? "Loading companies…"
                        : "Select company"}
                    </option>
                    {(companies.data ?? []).map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* New company toggle */}
                <div className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3.5">
                  <div>
                    <span className="block text-body-md font-body-md text-text-primary">
                      New Company
                    </span>
                    <span className="block text-label-sm font-label-sm text-text-secondary">
                      Not listed? Register it with this drive.
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={newCompanyMode}
                    onClick={() => setNewCompanyMode((v) => !v)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors shrink-0",
                      newCompanyMode ? "bg-primary" : "bg-surface-variant"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform",
                        newCompanyMode && "translate-x-5"
                      )}
                    ></span>
                  </button>
                </div>

                {companies.isError && (
                  <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3">
                    <span className="material-symbols-outlined text-status-error text-[20px]">
                      error
                    </span>
                    <p className="flex-1 text-label-md font-label-md text-status-error">
                      Couldn&rsquo;t load the company list.
                    </p>
                    <button
                      type="button"
                      onClick={() => companies.refetch()}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {newCompanyMode && (
                  <>
                    <div className="relative input-glow">
                      <label className={FLOATING_LABEL} htmlFor="company_name">
                        Company Name
                      </label>
                      <input
                        className={FORM_INPUT}
                        id="company_name"
                        placeholder="e.g. Google"
                        type="text"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                      />
                    </div>
                    <div className="relative input-glow">
                      <label className={FLOATING_LABEL} htmlFor="industry">
                        Industry
                      </label>
                      <select
                        className={cn(FORM_INPUT, SELECT_ARROW)}
                        id="industry"
                        value={newCompanyIndustry}
                        onChange={(e) => setNewCompanyIndustry(e.target.value)}
                      >
                        <option disabled value="">
                          Select industry
                        </option>
                        {INDUSTRIES.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="relative input-glow md:col-span-2">
                      <label className={FLOATING_LABEL} htmlFor="website">
                        Website
                      </label>
                      <input
                        className={FORM_INPUT}
                        id="website"
                        placeholder="https://careers.google.com"
                        type="url"
                        value={newCompanyWebsite}
                        onChange={(e) => setNewCompanyWebsite(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 border border-surface-border rounded-xl p-5 bg-surface/50 mt-2">
                  <h3 className="text-title-md font-title-md text-text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-muted text-[20px]">
                      contact_mail
                    </span>
                    HR Point of Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative input-glow">
                      <label
                        className="absolute -top-2.5 left-3 bg-surface px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase"
                        htmlFor="hr_name"
                      >
                        HR Name
                      </label>
                      <input
                        className={FORM_INPUT}
                        id="hr_name"
                        placeholder="Full name"
                        type="text"
                        value={hrName}
                        onChange={(e) => setHrName(e.target.value)}
                      />
                    </div>
                    <div className="relative input-glow">
                      <label
                        className="absolute -top-2.5 left-3 bg-surface px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase"
                        htmlFor="hr_email"
                      >
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
                      <label
                        className="absolute -top-2.5 left-3 bg-surface px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase"
                        htmlFor="hr_phone"
                      >
                        HR Phone
                      </label>
                      <input
                        className={FORM_INPUT}
                        id="hr_phone"
                        placeholder="+91 ..."
                        type="tel"
                        value={hrPhone}
                        onChange={(e) => setHrPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-end">
                <button className={NEXT_BUTTON} onClick={next} type="button">
                  Continue to Role Specs
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Role Specification */}
          {currentStep === 2 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">
                Role Specification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="relative input-glow md:col-span-2">
                  <label className={FLOATING_LABEL} htmlFor="job_title">
                    Job Title
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="job_title"
                    placeholder="e.g. Software Engineer (SDE I)"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="relative input-glow md:col-span-2">
                  <label className={FLOATING_LABEL} htmlFor="role_desc">
                    Role Description
                  </label>
                  <textarea
                    className={FORM_TEXTAREA}
                    id="role_desc"
                    placeholder="Responsibilities, tech stack, expectations..."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="openings">
                    Number of Openings
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="openings"
                    placeholder="e.g. 10"
                    type="number"
                    min={1}
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                  />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="location">
                    Location
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="location"
                    placeholder="e.g. Bangalore, Remote"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 border border-surface-border rounded-xl p-5 bg-surface/50 mt-2">
                  <h3 className="text-title-md font-title-md text-text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-muted text-[20px]">
                      payments
                    </span>
                    Compensation Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative input-glow">
                      <label
                        className="absolute -top-2.5 left-3 bg-surface px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase"
                        htmlFor="ctc_base"
                      >
                        Base CTC (LPA)
                      </label>
                      <input
                        className={FORM_INPUT}
                        id="ctc_base"
                        placeholder="0.00"
                        type="number"
                        step="0.1"
                        value={ctc}
                        onChange={(e) => setCtc(e.target.value)}
                      />
                    </div>
                    <div className="relative input-glow">
                      <label
                        className="absolute -top-2.5 left-3 bg-surface px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase"
                        htmlFor="stipend"
                      >
                        Stipend (per month)
                      </label>
                      <input
                        className={FORM_INPUT}
                        id="stipend"
                        placeholder="Optional"
                        type="number"
                        value={stipend}
                        onChange={(e) => setStipend(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-between">
                <button className={BACK_BUTTON} onClick={back} type="button">
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                  Back
                </button>
                <button className={NEXT_BUTTON} onClick={next} type="button">
                  Continue to Process
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Process Type */}
          {currentStep === 3 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-2">
                Process Type
              </h2>
              <p className="text-body-md font-body-md text-text-secondary mb-6">
                Select how this drive is structured.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROCESS_TYPE_OPTIONS.map((option) => {
                  const selected = processType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProcessType(option.value)}
                      className={cn(
                        "text-left rounded-xl border p-5 transition-all duration-200 flex items-start gap-3",
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-surface-border hover:border-outline-variant hover:bg-surface-container-low"
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-[22px] mt-0.5",
                          selected ? "text-primary" : "text-text-secondary"
                        )}
                      >
                        {selected ? "radio_button_checked" : "radio_button_unchecked"}
                      </span>
                      <span>
                        <span className="block text-title-md font-title-md text-text-primary">
                          {option.label}
                        </span>
                        <span className="block text-label-md font-label-md text-text-secondary mt-1">
                          {option.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-10 flex justify-between">
                <button className={BACK_BUTTON} onClick={back} type="button">
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                  Back
                </button>
                <button className={NEXT_BUTTON} onClick={next} type="button">
                  Continue to Eligibility
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Eligibility Criteria */}
          {currentStep === 4 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-2">
                Eligibility Criteria
              </h2>
              <p className="text-body-md font-body-md text-text-secondary mb-6">
                Configure who can apply to this drive.
              </p>
              <div className="space-y-8">
                {/* Branches */}
                <div>
                  <h3 className="text-title-md font-title-md text-text-primary mb-3">
                    Eligible Branches
                  </h3>
                  {meta.isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-pulse">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-lg bg-surface-variant" />
                      ))}
                    </div>
                  ) : meta.isError ? (
                    <div className="flex items-center gap-3 rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3">
                      <span className="material-symbols-outlined text-status-error text-[20px]">
                        error
                      </span>
                      <p className="flex-1 text-label-md font-label-md text-status-error">
                        Couldn&rsquo;t load branches and programmes.
                      </p>
                      <button
                        type="button"
                        onClick={() => meta.refetch()}
                        className="shrink-0 px-3 py-1.5 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(meta.data?.branches ?? []).map((branch) => {
                        const checked = branchIds.includes(branch.id);
                        return (
                          <label
                            key={branch.id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors",
                              checked
                                ? "border-primary bg-primary/5"
                                : "border-surface-border hover:bg-surface-container-low"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() =>
                                toggle(branch.id, branchIds, setBranchIds)
                              }
                            />
                            <span
                              className={cn(
                                "material-symbols-outlined text-[20px]",
                                checked ? "text-primary" : "text-text-secondary"
                              )}
                            >
                              {checked ? "check_box" : "check_box_outline_blank"}
                            </span>
                            <span className="text-body-md font-body-md text-text-primary">
                              {branch.name} ({branch.code})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Minimum CPI */}
                  <div className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor="min_cpi">
                      Minimum CPI
                    </label>
                    <input
                      className={FORM_INPUT}
                      id="min_cpi"
                      placeholder="e.g. 7.5"
                      type="number"
                      step="0.1"
                      min={0}
                      max={10}
                      value={minCpi}
                      onChange={(e) => setMinCpi(e.target.value)}
                    />
                  </div>
                  {/* Allow backlog toggle */}
                  <div className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3.5">
                    <div>
                      <span className="block text-body-md font-body-md text-text-primary">
                        Allow Active Backlog
                      </span>
                      <span className="block text-label-sm font-label-sm text-text-secondary">
                        Permit students with pending backlogs.
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={allowBacklog}
                      onClick={() => setAllowBacklog((v) => !v)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors shrink-0",
                        allowBacklog ? "bg-primary" : "bg-surface-variant"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow-sm transition-transform",
                          allowBacklog && "translate-x-5"
                        )}
                      ></span>
                    </button>
                  </div>
                </div>

                {/* Degree types */}
                <div>
                  <h3 className="text-title-md font-title-md text-text-primary mb-3">
                    Degree Type
                  </h3>
                  {meta.isLoading ? (
                    <div className="flex flex-wrap gap-2 animate-pulse">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-10 w-28 rounded-full bg-surface-variant" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(meta.data?.programs ?? []).map((program) => {
                        const checked = programIds.includes(program.id);
                        return (
                          <label
                            key={program.id}
                            className={cn(
                              "flex items-center gap-2 rounded-full border px-4 py-2 cursor-pointer transition-colors",
                              checked
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-surface-border text-text-secondary hover:bg-surface-container-low"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() =>
                                toggle(program.id, programIds, setProgramIds)
                              }
                            />
                            <span className="material-symbols-outlined text-[18px]">
                              {checked ? "check_circle" : "radio_button_unchecked"}
                            </span>
                            <span className="text-label-md font-label-md">
                              {program.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Custom rules */}
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="custom_rules">
                    Custom Rules
                  </label>
                  <textarea
                    className={FORM_TEXTAREA}
                    id="custom_rules"
                    placeholder="Any additional eligibility constraints..."
                    rows={3}
                    value={customRules}
                    onChange={(e) => setCustomRules(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="mt-10 flex justify-between">
                <button className={BACK_BUTTON} onClick={back} type="button">
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                  Back
                </button>
                <button className={NEXT_BUTTON} onClick={next} type="button">
                  Continue to Timeline
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Timeline Setup */}
          {currentStep === 5 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-2">
                Timeline Setup
              </h2>
              <p className="text-body-md font-body-md text-text-secondary mb-6">
                Set key dates for the drive. These are shown to students on the
                drive timeline.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="deadline">
                    Application Deadline
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="oa_date">
                    Online Assessment
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="oa_date"
                    type="date"
                    value={oaDate}
                    onChange={(e) => setOaDate(e.target.value)}
                  />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="interview_date">
                    Interview
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="interview_date"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="result_date">
                    Result / Offer
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="result_date"
                    type="date"
                    value={resultDate}
                    onChange={(e) => setResultDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Approval helper note */}
              <div className="mt-8 flex items-start gap-3 rounded-xl border border-status-warning/20 bg-status-warning/10 px-4 py-3">
                <span className="material-symbols-outlined text-status-warning text-[20px] mt-0.5">
                  info
                </span>
                <p className="text-label-md font-label-md text-text-secondary">
                  Submitting this drive sends it to the TPC for approval. You can
                  save it as a draft and edit it until it is approved.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap justify-between gap-3">
                <button className={BACK_BUTTON} onClick={back} type="button">
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                  Back
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="px-5 py-3 rounded-lg border border-surface-border text-text-primary text-title-md font-title-md hover:bg-surface-container-low hover:border-outline-variant transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    disabled={saving}
                    onClick={() => save("draft")}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      save
                    </span>
                    {pendingMode === "draft" ? "Saving…" : "Save as Draft"}
                  </button>
                  <button
                    className="bg-status-success text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={saving}
                  >
                    {pendingMode === "submit"
                      ? "Submitting…"
                      : "Submit for Approval"}
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
        )}
      </div>
    </div>
  );
};

export default AddDriveForm;
