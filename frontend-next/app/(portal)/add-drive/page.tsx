"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BRANCHES,
  INDUSTRIES,
  PROCESS_TYPES,
  DEGREE_TYPES,
} from "@/data/add-drive";

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

const AddDriveForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [processType, setProcessType] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([]);
  const [degrees, setDegrees] = useState<string[]>([]);
  const [allowBacklog, setAllowBacklog] = useState(false);

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
            className="px-5 py-2.5 rounded-lg border border-surface-border text-text-primary text-title-md font-title-md hover:bg-surface-container-low hover:border-outline-variant transition-all duration-200 flex items-center gap-2"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save as Draft
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
        <form className="relative z-10" onSubmit={(e) => e.preventDefault()}>
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="company_name">
                    Company Name
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="company_name"
                    placeholder="e.g. Google"
                    type="text"
                  />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="industry">
                    Industry
                  </label>
                  <select
                    className={cn(FORM_INPUT, SELECT_ARROW)}
                    id="industry"
                    defaultValue=""
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
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="logo_url">
                    Company Logo URL
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="logo_url"
                    placeholder="https://logo.clearbit.com/google.com"
                    type="url"
                  />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="website">
                    Website
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="website"
                    placeholder="https://careers.google.com"
                    type="url"
                  />
                </div>
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
                {PROCESS_TYPES.map((option) => {
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
                        {option.hint && (
                          <span className="block text-label-md font-label-md text-text-secondary mt-1">
                            {option.hint}
                          </span>
                        )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BRANCHES.map((branch) => {
                      const checked = branches.includes(branch);
                      return (
                        <label
                          key={branch}
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
                              toggle(branch, branches, setBranches)
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
                            {branch}
                          </span>
                        </label>
                      );
                    })}
                  </div>
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
                  <div className="flex flex-wrap gap-2">
                    {DEGREE_TYPES.map((degree) => {
                      const checked = degrees.includes(degree);
                      return (
                        <label
                          key={degree}
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
                              toggle(degree, degrees, setDegrees)
                            }
                          />
                          <span className="material-symbols-outlined text-[18px]">
                            {checked ? "check_circle" : "radio_button_unchecked"}
                          </span>
                          <span className="text-label-md font-label-md">
                            {degree}
                          </span>
                        </label>
                      );
                    })}
                  </div>
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
                  <input className={FORM_INPUT} id="deadline" type="date" />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="oa_date">
                    Online Assessment
                  </label>
                  <input className={FORM_INPUT} id="oa_date" type="date" />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="interview_date">
                    Interview
                  </label>
                  <input className={FORM_INPUT} id="interview_date" type="date" />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="result_date">
                    Result / Offer
                  </label>
                  <input className={FORM_INPUT} id="result_date" type="date" />
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
                    className="px-5 py-3 rounded-lg border border-surface-border text-text-primary text-title-md font-title-md hover:bg-surface-container-low hover:border-outline-variant transition-all duration-200 flex items-center gap-2"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      save
                    </span>
                    Save as Draft
                  </button>
                  <button
                    className="bg-status-success text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
                    type="submit"
                  >
                    Submit for Approval
                    <span className="material-symbols-outlined">
                      check_circle
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddDriveForm;
