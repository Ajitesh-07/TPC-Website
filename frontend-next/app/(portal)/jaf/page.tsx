"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCreateDrive,
  useDrive,
  useMeta,
  useSubmitDrive,
  useUpdateDrive,
} from "@/lib/hooks";
import type {
  CreateDrivePayload,
  DriveStatusApi,
  ProcessTypeApi,
} from "@/lib/api-types";

const STEPS = ["Role Specs", "JD Upload", "Eligibility", "Timeline"];

const STATUS_STAGES = [
  "Draft",
  "Pending TPC Approval",
  "Open for Applications",
  "Deadline Closed",
];

/** UI role-type values <-> API process types. */
type RoleType = "ft" | "intern" | "intern_ft";
const ROLE_TYPE_TO_PROCESS: Record<RoleType, ProcessTypeApi> = {
  ft: "fte",
  intern: "internship",
  intern_ft: "six_month_fte",
};
const PROCESS_TO_ROLE_TYPE: Record<ProcessTypeApi, RoleType> = {
  fte: "ft",
  internship: "intern",
  six_month_fte: "intern_ft",
  six_month_ppo: "intern_ft",
};

/** "YYYY-MM-DD" (date input) -> ISO timestamp at local midnight. */
const toIso = (date: string) => new Date(`${date}T00:00:00`).toISOString();
/** ISO timestamp -> "YYYY-MM-DD" in local time (for date inputs). */
const isoToDateInput = (iso: string): string => {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const STATUS_TO_INDEX: Record<DriveStatusApi, number> = {
  draft: 0,
  pending_approval: 1,
  open: 2,
  closed: 3,
  completed: 3,
  cancelled: 1,
};
/** A recruiter may only edit their announcement before TPC acts on it. */
const EDITABLE_STATUSES: DriveStatusApi[] = ["draft", "pending_approval"];

const FORM_INPUT =
  "w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline";
const FLOATING_LABEL =
  "absolute -top-2.5 left-3 bg-surface-container-lowest px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase";
const NEXT_BUTTON =
  "bg-gradient-to-b from-primary to-navy-deep text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:shadow-md hover:from-primary-container hover:to-primary transition-all duration-200 flex items-center gap-2 border-t border-primary-fixed-dim/30";
const BACK_BUTTON =
  "px-6 py-3 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-container-low transition-colors text-title-md font-title-md flex items-center gap-2";

function JobAnnouncementForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEdit = Boolean(editId);

  const [currentStep, setCurrentStep] = useState(1);

  // ---- controlled form state ----
  const [title, setTitle] = useState("");
  const [roleType, setRoleType] = useState<"" | RoleType>("");
  const [location, setLocation] = useState("");
  const [ctc, setCtc] = useState("");
  const [stipend, setStipend] = useState("");
  const [jdText, setJdText] = useState("");
  const [minCpi, setMinCpi] = useState("");
  const [dates, setDates] = useState({ deadline: "", oa: "", interview: "", result: "" });

  // ---- data / submission state ----
  const meta = useMeta();
  const driveQuery = useDrive(editId);
  const createDrive = useCreateDrive();
  const submitDrive = useSubmitDrive();
  const updateDrive = useUpdateDrive(editId ?? "");

  const [action, setAction] = useState<"draft" | "publish" | "save" | "submit" | null>(null);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  // In create mode, the id of the drive once it has been published — locks the
  // form so a second click can't create a duplicate.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const lock = useRef(false); // guards against rapid double-submits
  const hydrated = useRef(false); // edit-mode prefill happens once

  const drive = driveQuery.data;
  const editStatus = drive?.status;
  const editable = !isEdit || (editStatus !== undefined && EDITABLE_STATUSES.includes(editStatus));
  const published = createdId !== null;

  const statusIndex = isEdit && editStatus ? STATUS_TO_INDEX[editStatus] : published ? 1 : 0;
  const busy = createDrive.isPending || submitDrive.isPending || updateDrive.isPending;

  // Prefill the form from the loaded drive (edit mode), once.
  useEffect(() => {
    if (!drive || hydrated.current) return;
    hydrated.current = true;
    setTitle(drive.title);
    setRoleType(PROCESS_TO_ROLE_TYPE[drive.processType]);
    setLocation(drive.location ?? "");
    setCtc(drive.ctcLpa != null ? String(drive.ctcLpa) : "");
    setStipend(drive.stipendPerMonth != null ? String(drive.stipendPerMonth) : "");
    setJdText(drive.description ?? "");
    setMinCpi(drive.minCpi != null ? String(drive.minCpi) : "");
    const stageDate = (type: string) => {
      const s = drive.stages.find((x) => x.type === type);
      return s?.scheduledAt ? isoToDateInput(s.scheduledAt) : "";
    };
    setDates({
      deadline: drive.applicationDeadline ? isoToDateInput(drive.applicationDeadline) : "",
      oa: stageDate("online_assessment"),
      interview: stageDate("interview"),
      result: stageDate("offer"),
    });
  }, [drive]);

  const buildPayload = (): { payload: CreateDrivePayload } | { error: string } => {
    if (!title.trim()) return { error: "Job title is required (Step 1: Role Specs)." };
    if (!roleType) return { error: "Role type is required (Step 1: Role Specs)." };
    if (!meta.data)
      return { error: "Reference data is still loading — please try again in a moment." };
    return {
      payload: {
        title: title.trim(),
        description: jdText.trim() || undefined,
        processType: ROLE_TYPE_TO_PROCESS[roleType],
        location: location.trim() || undefined,
        ctcLpa: ctc ? Number(ctc) : undefined,
        stipendPerMonth: stipend ? Number(stipend) : undefined,
        minCpi: minCpi ? Number(minCpi) : undefined,
        allowBacklog: true,
        applicationDeadline: dates.deadline ? toIso(dates.deadline) : undefined,
        branchIds: meta.data.branches.map((b) => b.id),
        programIds: meta.data.programs.map((p) => p.id),
        skillNames: [],
        stages: [
          { type: "registration", sequence: 1 },
          { type: "online_assessment", sequence: 2, ...(dates.oa ? { scheduledAt: toIso(dates.oa) } : {}) },
          { type: "interview", sequence: 3, ...(dates.interview ? { scheduledAt: toIso(dates.interview) } : {}) },
          { type: "offer", sequence: 4, ...(dates.result ? { scheduledAt: toIso(dates.result) } : {}) },
        ],
      },
    };
  };

  // Run a mutation behind the double-submit lock + shared banner handling.
  const run = async (
    kind: "draft" | "publish" | "save" | "submit",
    fn: () => Promise<void>
  ) => {
    if (lock.current || busy) return;
    const built = buildPayload();
    if ("error" in built) {
      setBanner({ kind: "error", text: built.error });
      return;
    }
    lock.current = true;
    setAction(kind);
    setBanner(null);
    try {
      await fn();
    } catch (e) {
      setBanner({ kind: "error", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setAction(null);
      lock.current = false;
    }
  };

  // ---- create mode ----
  const handleSaveDraft = () =>
    run("draft", async () => {
      const built = buildPayload();
      if ("error" in built) throw new Error(built.error);
      const { id } = await createDrive.mutateAsync(built.payload);
      setCreatedId(id);
      setBanner({ kind: "success", text: `Draft saved (drive ${id.slice(0, 8)}…). Publish it when ready.` });
    });

  const handlePublish = () =>
    run("publish", async () => {
      const built = buildPayload();
      if ("error" in built) throw new Error(built.error);
      const { id } = await createDrive.mutateAsync(built.payload);
      await submitDrive.mutateAsync(id);
      setCreatedId(id);
      setBanner({ kind: "success", text: "Announcement submitted — it's now awaiting TPC approval." });
    });

  // ---- edit mode ----
  const handleSaveChanges = () =>
    run("save", async () => {
      const built = buildPayload();
      if ("error" in built) throw new Error(built.error);
      await updateDrive.mutateAsync(built.payload);
      setBanner({ kind: "success", text: "Changes saved." });
    });

  const handleSubmitForApproval = () =>
    run("submit", async () => {
      if (!editId) return;
      const built = buildPayload();
      if ("error" in built) throw new Error(built.error);
      await updateDrive.mutateAsync(built.payload);
      await submitDrive.mutateAsync(editId);
      setBanner({ kind: "success", text: "Submitted — now awaiting TPC approval." });
      driveQuery.refetch();
    });

  const circleClass = (step: number) => {
    if (step < currentStep)
      return "w-8 h-8 rounded-full bg-surface-tint text-on-primary flex items-center justify-center text-title-md font-title-md shadow-sm transition-colors";
    if (step === currentStep)
      return "w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-title-md font-title-md shadow-sm transition-transform scale-105";
    return "w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-surface-border text-text-secondary flex items-center justify-center text-title-md font-title-md transition-colors";
  };
  const textClass = (step: number) => {
    if (step < currentStep) return "text-label-sm md:text-label-md font-label-md text-surface-tint text-center whitespace-nowrap";
    if (step === currentStep) return "text-label-sm md:text-label-md font-label-md text-primary font-bold text-center whitespace-nowrap";
    return "text-label-sm md:text-label-md font-label-md text-text-secondary text-center whitespace-nowrap";
  };

  // Edit mode: gate on the drive loading.
  if (isEdit && driveQuery.isLoading) {
    return (
      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-12 max-w-[1000px] mx-auto w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-72 rounded-lg bg-surface-variant" />
          <div className="h-20 rounded-xl bg-surface-variant" />
          <div className="h-96 rounded-xl bg-surface-variant" />
        </div>
      </div>
    );
  }
  if (isEdit && driveQuery.isError) {
    return (
      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-12 max-w-[1000px] mx-auto w-full">
        <div className="rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3 text-status-error text-body-md font-body-md flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          Couldn&apos;t load this announcement. It may not exist or you may not have access.
        </div>
      </div>
    );
  }

  const statusBadge =
    editStatus === "cancelled"
      ? { cls: "bg-status-error/10 text-status-error", dot: "bg-status-error", label: "Rejected by TPC" }
      : [
          { cls: "bg-surface-variant text-text-secondary", dot: "bg-text-secondary", label: STATUS_STAGES[0]! },
          { cls: "bg-status-warning/10 text-status-warning", dot: "bg-status-warning", label: STATUS_STAGES[1]! },
          { cls: "bg-status-success/10 text-status-success", dot: "bg-status-success", label: STATUS_STAGES[2]! },
          { cls: "bg-navy-vibrant/10 text-navy-vibrant", dot: "bg-navy-vibrant", label: STATUS_STAGES[3]! },
        ][statusIndex]!;

  return (
    <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 md:py-12 max-w-[1000px] mx-auto w-full transition-all duration-300 ease-in-out">
      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <nav className="flex items-center gap-2 text-label-sm font-label-sm text-text-secondary mb-3">
            <Link className="hover:text-primary transition-colors" href="/company-drives">
              Drives
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">{isEdit ? "Edit" : "New Announcement"}</span>
          </nav>
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg-mobile md:font-headline-lg text-text-primary tracking-tight">
            {isEdit ? "Edit Job Announcement" : "Create Job Announcement"}
          </h1>
          <p className="text-body-md font-body-md text-text-secondary mt-1 max-w-xl">
            Configure role specifications, eligibility criteria, and drive timelines for the
            upcoming campus placement season.
          </p>
        </div>
        {/* "Save as Draft" only when creating a brand-new, unpublished announcement. */}
        {!isEdit && !published && (
          <div className="flex items-center gap-3">
            <button
              className="px-5 py-2.5 rounded-lg border border-surface-border text-text-primary text-title-md font-title-md hover:bg-surface-container-low hover:border-outline-variant transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
              type="button"
              onClick={handleSaveDraft}
              disabled={busy}
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {action === "draft" ? "Saving…" : "Save as Draft"}
            </button>
          </div>
        )}
      </header>

      {/* Feedback */}
      {banner && (
        <div
          className={
            banner.kind === "success"
              ? "mb-8 rounded-xl border border-status-success/20 bg-status-success/10 px-4 py-3 flex items-center gap-2 text-status-success text-body-md font-body-md"
              : "mb-8 rounded-xl border border-status-error/20 bg-status-error/10 px-4 py-3 flex items-center gap-2 text-status-error text-body-md font-body-md"
          }
        >
          <span className="material-symbols-outlined text-[20px]">
            {banner.kind === "success" ? "check_circle" : "error"}
          </span>
          {banner.text}
        </div>
      )}

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
                    <span className="material-symbols-outlined text-[18px]">check</span>
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

      {/* Drive status tracker */}
      <div className="mb-8 bg-surface-container-lowest rounded-xl border border-surface-border p-5 md:p-6 elevation-1">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-label-sm font-label-sm uppercase tracking-wider text-text-secondary">
            Drive Status
          </h3>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm ${statusBadge.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
            {statusBadge.label}
          </span>
        </div>
        <div className="flex items-center overflow-x-auto no-scrollbar -mx-1 px-1 md:mx-0 md:px-0 md:overflow-visible">
          {STATUS_STAGES.map((stage, i) => {
            const done = i < statusIndex;
            const current = i === statusIndex;
            return (
              <div key={stage} className="flex items-center shrink-0 md:shrink md:flex-1 md:last:flex-none">
                <div className="flex flex-col items-center gap-2 shrink-0 w-[5.5rem] md:w-auto">
                  <div
                    className={
                      done
                        ? "w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0"
                        : current
                        ? "w-7 h-7 rounded-full bg-status-warning text-on-primary flex items-center justify-center shrink-0 ring-4 ring-status-warning/15"
                        : "w-7 h-7 rounded-full bg-surface-container-lowest border-2 border-surface-border text-text-secondary flex items-center justify-center shrink-0"
                    }
                  >
                    {done ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      <span className="text-label-sm font-label-sm">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={
                      current
                        ? "text-label-sm font-label-sm text-text-primary font-bold text-center max-w-[5.5rem] md:max-w-[7rem]"
                        : "text-label-sm font-label-sm text-text-secondary text-center max-w-[5.5rem] md:max-w-[7rem]"
                    }
                  >
                    {stage}
                  </span>
                </div>
                {i < STATUS_STAGES.length - 1 && (
                  <div className={`h-[2px] w-6 md:w-auto md:flex-1 mx-1 md:mx-2 -mt-6 shrink-0 ${done ? "bg-primary" : "bg-surface-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Locked notice when the drive can no longer be edited */}
      {isEdit && !editable && (
        <div className="mb-8 rounded-xl border border-navy-vibrant/20 bg-navy-vibrant/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-body-md font-body-md text-text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-navy-vibrant">lock</span>
            This announcement has been processed by the TPC and can no longer be edited.
          </p>
          <Link
            href="/company-drives"
            className="text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors shrink-0"
          >
            View in My Drives →
          </Link>
        </div>
      )}

      {/* Form */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-border p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <form className="relative z-10" onSubmit={(e) => e.preventDefault()}>
          {/* STEP 1: Role specs */}
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">Role Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="relative input-glow md:col-span-2">
                  <label className={FLOATING_LABEL} htmlFor="job_title">Job Title</label>
                  <input className={FORM_INPUT} id="job_title" placeholder="e.g. Senior Software Development Engineer" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="role_type">Role Type</label>
                  <select
                    className={`${FORM_INPUT} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat pr-10`}
                    id="role_type"
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value as "" | RoleType)}
                  >
                    <option disabled value="">Select type</option>
                    <option value="ft">Full-Time (FT)</option>
                    <option value="intern">Internship (2 Months)</option>
                    <option value="intern_ft">Internship + FT</option>
                  </select>
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="location">Work Location</label>
                  <input className={FORM_INPUT} id="location" placeholder="e.g. Bangalore, Remote" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="md:col-span-2 border border-surface-border rounded-xl p-5 bg-surface/50 mt-2">
                  <h3 className="text-title-md font-title-md text-text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-gold-muted text-[20px]">payments</span>
                    Compensation Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative input-glow">
                      <label className="absolute -top-2.5 left-3 bg-surface px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase" htmlFor="ctc_base">Base CTC (LPA)</label>
                      <input className={FORM_INPUT} id="ctc_base" placeholder="0.00" type="number" value={ctc} onChange={(e) => setCtc(e.target.value)} />
                    </div>
                    <div className="relative input-glow">
                      <label className="absolute -top-2.5 left-3 bg-surface px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase" htmlFor="stipend">Stipend (per month)</label>
                      <input className={FORM_INPUT} id="stipend" placeholder="Optional" type="number" value={stipend} onChange={(e) => setStipend(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-end">
                <button className={NEXT_BUTTON} onClick={() => setCurrentStep(2)} type="button">
                  Continue to JD Upload
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: JD upload */}
          {currentStep === 2 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-2">Job Description</h2>
              <p className="text-body-md font-body-md text-text-secondary mb-6">Upload the official JD document or paste the description below.</p>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-10 flex flex-col items-center justify-center bg-surface/30 hover:bg-surface-container-low hover:border-primary transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[32px]">upload_file</span>
                  </div>
                  <span className="text-title-md font-title-md text-text-primary mb-1">Click to upload or drag and drop</span>
                  <span className="text-label-md font-label-md text-text-secondary">PDF, DOCX up to 5MB</span>
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-surface-border flex-1"></div>
                  <span className="text-label-sm font-label-sm text-outline uppercase tracking-widest">OR</span>
                  <div className="h-px bg-surface-border flex-1"></div>
                </div>
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="jd_text">Job Description Text</label>
                  <textarea
                    className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-4 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline resize-none"
                    id="jd_text"
                    placeholder="Enter key responsibilities, requirements, etc..."
                    rows={6}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="mt-10 flex justify-between">
                <button className={BACK_BUTTON} onClick={() => setCurrentStep(1)} type="button">
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span> Back
                </button>
                <button className={NEXT_BUTTON} onClick={() => setCurrentStep(3)} type="button">
                  Continue to Eligibility
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Eligibility */}
          {currentStep === 3 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">Eligibility Criteria</h2>
              <p className="text-body-md font-body-md text-text-secondary mb-10">Configure academic requirements for this role.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="relative input-glow">
                  <label className={FLOATING_LABEL} htmlFor="min_cpi">Minimum CGPA</label>
                  <input className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary transition-colors" id="min_cpi" placeholder="e.g. 7.5" step="0.1" type="number" value={minCpi} onChange={(e) => setMinCpi(e.target.value)} />
                </div>
              </div>
              <div className="mt-10 flex justify-between">
                <button className={BACK_BUTTON} onClick={() => setCurrentStep(2)} type="button">
                  <span className="material-symbols-outlined">arrow_back</span> Back
                </button>
                <button className={NEXT_BUTTON} onClick={() => setCurrentStep(4)} type="button">
                  Next Step <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Timeline + actions */}
          {currentStep === 4 && (
            <div className="animate-fadeIn">
              <h2 className="text-headline-md font-headline-md text-primary mb-6">Timeline Setup</h2>
              <p className="text-body-md font-body-md text-text-secondary mb-10">Set application deadlines and tentative interview dates.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                {(
                  [
                    { id: "deadline", key: "deadline", label: "Application Deadline" },
                    { id: "oa_date", key: "oa", label: "Online Assessment" },
                    { id: "interview_date", key: "interview", label: "Interview Round" },
                    { id: "result_date", key: "result", label: "Result / Offer Roll-out" },
                  ] as const
                ).map((field) => (
                  <div key={field.id} className="relative input-glow">
                    <label className={FLOATING_LABEL} htmlFor={field.id}>{field.label}</label>
                    <input className={FORM_INPUT} id={field.id} type="date" value={dates[field.key]} onChange={(e) => setDates((d) => ({ ...d, [field.key]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                <button className={BACK_BUTTON} onClick={() => setCurrentStep(3)} type="button">
                  <span className="material-symbols-outlined">arrow_back</span> Back
                </button>

                {/* Primary action depends on mode + status */}
                {published ? (
                  // Create mode, already published — no re-create possible.
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-label-md font-label-md text-status-success flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      Submitted to TPC
                    </span>
                    <Link href={`/jaf?id=${createdId}`} className={BACK_BUTTON}>
                      <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                    </Link>
                    <Link
                      href="/company-drives"
                      className="bg-gradient-to-b from-primary to-navy-deep text-on-primary text-title-md font-title-md px-6 py-3 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      View My Drives <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </Link>
                  </div>
                ) : isEdit ? (
                  editable ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="px-6 py-3 rounded-lg border border-surface-border text-text-primary text-title-md font-title-md hover:bg-surface-container-low transition-colors flex items-center gap-2 disabled:opacity-60"
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={busy}
                      >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        {action === "save" ? "Saving…" : "Save Changes"}
                      </button>
                      {editStatus === "draft" && (
                        <button
                          className="bg-status-success text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
                          type="button"
                          onClick={handleSubmitForApproval}
                          disabled={busy}
                        >
                          {action === "submit" ? "Submitting…" : "Submit for Approval"}
                          <span className="material-symbols-outlined">check_circle</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-label-md font-label-md text-text-secondary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">lock</span> Editing locked
                    </span>
                  )
                ) : (
                  <button
                    className="bg-status-success text-on-primary text-title-md font-title-md px-8 py-3 rounded-lg shadow-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
                    type="button"
                    onClick={handlePublish}
                    disabled={busy}
                  >
                    {action === "publish" ? "Publishing…" : "Publish Announcement"}
                    <span className="material-symbols-outlined">check_circle</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function JafPage() {
  return (
    <Suspense fallback={null}>
      <JobAnnouncementForm />
    </Suspense>
  );
}
