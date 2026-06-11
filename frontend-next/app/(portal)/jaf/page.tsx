"use client";

import { useState } from "react";

const STEPS = ["Role Specs", "JD Upload", "Eligibility", "Timeline"];

const FORM_INPUT =
  "w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline";

const FLOATING_LABEL =
  "absolute -top-2.5 left-3 bg-surface-container-lowest px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase";

const NEXT_BUTTON =
  "bg-gradient-to-b from-primary to-navy-deep text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:shadow-md hover:from-primary-container hover:to-primary transition-all duration-200 flex items-center gap-2 border-t border-primary-fixed-dim/30";

const BACK_BUTTON =
  "px-6 py-3 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-container-low transition-colors text-title-md font-title-md flex items-center gap-2";

const JobAnnouncementForm = () => {
  const [currentStep, setCurrentStep] = useState(1);

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
            <a className="hover:text-primary transition-colors" href="#">
              Drives
            </a>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span className="text-primary font-bold">New Announcement</span>
          </nav>
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-text-primary tracking-tight">
            Create Job Announcement
          </h1>
          <p className="text-body-md font-body-md text-text-secondary mt-1 max-w-xl">
            Configure role specifications, eligibility criteria, and drive
            timelines for the upcoming campus placement season.
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
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
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
                <span className={textClass(step)}>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Form container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-border p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <form className="relative z-10" onSubmit={(e) => e.preventDefault()}>
          {/* STEP 1: Role specs */}
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">
                Role Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="relative input-glow md:col-span-2">
                  <label className={FLOATING_LABEL} htmlFor="job_title">
                    Job Title
                  </label>
                  <input
                    className={FORM_INPUT}
                    id="job_title"
                    placeholder="e.g. Senior Software Development Engineer"
                    type="text"
                  />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="role_type">
                    Role Type
                  </label>
                  <select
                    className={`${FORM_INPUT} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat pr-10`}
                    id="role_type"
                    defaultValue=""
                  >
                    <option disabled value="">
                      Select type
                    </option>
                    <option value="ft">Full-Time (FT)</option>
                    <option value="intern">Internship (2 Months)</option>
                    <option value="intern_ft">Internship + FT</option>
                  </select>
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="location">
                    Work Location
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
              <div className="mt-10 flex justify-end">
                <button
                  className={NEXT_BUTTON}
                  onClick={() => setCurrentStep(2)}
                  type="button"
                >
                  Continue to JD Upload
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: JD upload */}
          {currentStep === 2 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-2">
                Job Description
              </h2>
              <p className="text-body-md font-body-md text-text-secondary mb-6">
                Upload the official JD document or paste the description below.
              </p>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-10 flex flex-col items-center justify-center bg-surface/30 hover:bg-surface-container-low hover:border-primary transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[32px]">
                      upload_file
                    </span>
                  </div>
                  <span className="text-title-md font-title-md text-text-primary mb-1">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-label-md font-label-md text-text-secondary">
                    PDF, DOCX up to 5MB
                  </span>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-surface-border flex-1"></div>
                  <span className="text-label-sm font-label-sm text-outline uppercase tracking-widest">
                    OR
                  </span>
                  <div className="h-px bg-surface-border flex-1"></div>
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="jd_text">
                    Job Description Text
                  </label>
                  <textarea
                    className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-4 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline resize-none"
                    id="jd_text"
                    placeholder="Enter key responsibilities, requirements, etc..."
                    rows={6}
                  ></textarea>
                </div>
              </div>
              <div className="mt-10 flex justify-between">
                <button
                  className={BACK_BUTTON}
                  onClick={() => setCurrentStep(1)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                  Back
                </button>
                <button
                  className={NEXT_BUTTON}
                  onClick={() => setCurrentStep(3)}
                  type="button"
                >
                  Continue to Eligibility
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Eligibility */}
          {currentStep === 3 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">
                Eligibility Criteria
              </h2>
              <p className="text-body-md font-body-md text-text-secondary mb-10">
                Configure academic requirements for this role.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL}>Minimum CGPA</label>
                  <input
                    className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g. 7.5"
                    step="0.1"
                    type="number"
                  />
                </div>
              </div>
              <div className="mt-10 flex justify-between">
                <button
                  className={BACK_BUTTON}
                  onClick={() => setCurrentStep(2)}
                  type="button"
                >
                  <span className="material-symbols-outlined">arrow_back</span> Back
                </button>
                <button
                  className={NEXT_BUTTON}
                  onClick={() => setCurrentStep(4)}
                  type="button"
                >
                  Next Step{" "}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Timeline */}
          {currentStep === 4 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">
                Timeline Setup
              </h2>
              <p className="text-body-md font-body-md text-text-secondary mb-10">
                Set application deadlines and tentative interview dates.
              </p>
              <div className="mt-10 flex justify-between">
                <button
                  className={BACK_BUTTON}
                  onClick={() => setCurrentStep(3)}
                  type="button"
                >
                  <span className="material-symbols-outlined">arrow_back</span> Back
                </button>
                <button
                  className="bg-status-success text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
                  type="button"
                >
                  Publish Announcement{" "}
                  <span className="material-symbols-outlined">check_circle</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default JobAnnouncementForm;
