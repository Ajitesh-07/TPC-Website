"use client";

import { useRef, useState } from "react";
import {
  fileUrl,
  uploadFile,
  useCreateCorrection,
  useMe,
  useMyCorrections,
  useUpdateProfile,
} from "@/lib/hooks";
import type { CorrectionRequest, MeResponse, StudentProfile } from "@/lib/api-types";

const inputClass =
  "w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all";

// ---------- local display mappers (API → mock-shaped strings) ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO → "Oct 15, 2024". */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

/** "Aarav Sharma" → "AS". */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

const titleCase = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function asStudentProfile(me: MeResponse | undefined): StudentProfile | null {
  if (!me?.profile || me.user.role !== "student") return null;
  return me.profile as StudentProfile;
}

interface LockedField {
  label: string;
  value: string;
  icon?: string;
  /** Text-colour token for the value (e.g. "text-status-success"). */
  tone?: string;
}

/** Admin-controlled, read-only fields sourced from the verified master dataset. */
function lockedFields(user: MeResponse["user"], p: StudentProfile): LockedField[] {
  return [
    { label: "Official Email", value: user.email },
    { label: "Program", value: p.program?.name ?? "—" },
    { label: "Branch", value: p.branch?.name ?? "—" },
    { label: "Batch", value: p.batchYear != null ? String(p.batchYear) : "—" },
    { label: "CPI (Current)", value: p.cpi != null ? p.cpi.toFixed(2) : "—" },
    p.activeBacklogs === 0
      ? { label: "Backlog Status", value: "No Active Backlogs", icon: "check_circle", tone: "text-status-success" }
      : {
          label: "Backlog Status",
          value: `${p.activeBacklogs} Active Backlog${p.activeBacklogs === 1 ? "" : "s"}`,
          icon: "error",
          tone: "text-status-error",
        },
    { label: "Placement Status", value: titleCase(p.placementStatus) },
    { label: "Placement Credits", value: String(p.creditBalance), icon: "toll", tone: "text-primary" },
    p.btechVerified
      ? { label: "B.Tech Status", value: "Verified", icon: "verified", tone: "text-status-success" }
      : { label: "B.Tech Status", value: "Pending", icon: "hourglass_empty", tone: "text-status-warning" },
  ];
}

const REQUEST_STYLES: Record<CorrectionRequest["status"], string> = {
  pending: "bg-status-warning/10 text-status-warning border-status-warning/20",
  approved: "bg-status-success/10 text-status-success border-status-success/20",
  rejected: "bg-error-container text-on-error-container border-error/20",
};

const CORRECTION_FIELDS: { value: string; label: string }[] = [
  { value: "cpi", label: "CPI" },
  { value: "branch", label: "Branch" },
  { value: "program", label: "Program" },
  { value: "batchYear", label: "Batch Year" },
  { value: "name", label: "Name" },
  { value: "rollNo", label: "Roll No" },
];

const fieldLabel = (fieldName: string) =>
  CORRECTION_FIELDS.find((f) => f.value === fieldName)?.label ?? titleCase(fieldName);

function correctionDetail(r: CorrectionRequest): string {
  if (r.reason) return r.reason;
  if (r.requestedValue) {
    return r.currentValue
      ? `Requested change from ${r.currentValue} to ${r.requestedValue}.`
      : `Requested value: ${r.requestedValue}.`;
  }
  return "—";
}

/** Storage key "resume/<uid>/<uuid>-CV.pdf" → "CV.pdf". */
function resumeFileName(key: string | null): string | null {
  if (!key) return null;
  const last = key.split("/").pop() ?? key;
  const m = last.match(/^[0-9a-fA-F-]{36}-(.+)$/);
  return m ? m[1] : last;
}

interface ProfileForm {
  phone: string;
  altEmail: string;
  preferredLocation: string;
  linkedinUrl: string;
  githubUrl: string;
  skills: string;
}

const CONTACT_FIELDS: { id: keyof ProfileForm; label: string; type: string; placeholder: string }[] = [
  { id: "phone", label: "Phone Number", type: "tel", placeholder: "+91 98765 43210" },
  { id: "altEmail", label: "Alternate Email", type: "email", placeholder: "you@example.com" },
  { id: "preferredLocation", label: "Preferred Location", type: "text", placeholder: "Bangalore, Hyderabad, Remote" },
];

const LINK_FIELDS: { id: keyof ProfileForm; label: string; type: string; placeholder: string }[] = [
  { id: "linkedinUrl", label: "LinkedIn Profile URL", type: "url", placeholder: "https://linkedin.com/in/…" },
  { id: "githubUrl", label: "GitHub / Portfolio URL", type: "url", placeholder: "https://github.com/…" },
];

const MyProfile = () => {
  const me = useMe();
  const corrections = useMyCorrections();
  const updateProfile = useUpdateProfile();
  const createCorrection = useCreateCorrection();

  const user = me.data?.user ?? null;
  const profile = asStudentProfile(me.data);

  // Editable form = profile values overlaid with the user's unsaved edits.
  // (Derived during render — no effect-based seeding needed.)
  const [edits, setEdits] = useState<Partial<ProfileForm>>({});
  const baseForm: ProfileForm | null = profile
    ? {
        phone: profile.phone ?? "",
        altEmail: profile.altEmail ?? "",
        preferredLocation: profile.preferredLocation ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
        skills: profile.skills.join(", "),
      }
    : null;
  const form: ProfileForm | null = baseForm ? { ...baseForm, ...edits } : null;
  const [saved, setSaved] = useState(false);

  // Resume upload state.
  const [resumeKey, setResumeKey] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New correction-request form state.
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqField, setReqField] = useState("cpi");
  const [reqValue, setReqValue] = useState("");
  const [reqReason, setReqReason] = useState("");

  const setField = (id: keyof ProfileForm, value: string) =>
    setEdits((prev) => ({ ...prev, [id]: value }));

  const handleSave = () => {
    if (!form) return;
    setSaved(false);
    const orUndef = (s: string) => (s.trim() === "" ? undefined : s.trim());
    updateProfile.mutate(
      {
        phone: orUndef(form.phone),
        altEmail: orUndef(form.altEmail),
        preferredLocation: orUndef(form.preferredLocation),
        linkedinUrl: orUndef(form.linkedinUrl),
        githubUrl: orUndef(form.githubUrl),
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        ...(resumeKey ? { resumeKey } : {}),
      },
      {
        onSuccess: () => {
          setSaved(true);
          setResumeKey(null);
        },
      }
    );
  };

  const handleResumeFile = async (file: File) => {
    setResumeError(null);
    setUploading(true);
    try {
      const key = await uploadFile("resume", file);
      setResumeKey(key);
      setResumeName(file.name);
      setSaved(false);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Upload failed — please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleViewResume = async () => {
    if (!profile?.resumeUrl) return;
    setResumeError(null);
    try {
      const url = await fileUrl(profile.resumeUrl);
      window.open(url, "_blank", "noopener");
    } catch {
      setResumeError("Could not open your resume — please try again.");
    }
  };

  const handleCreateCorrection = () => {
    if (!reqValue.trim()) return;
    createCorrection.mutate(
      { fieldName: reqField, requestedValue: reqValue.trim(), reason: reqReason.trim() || undefined },
      {
        onSuccess: () => {
          setShowRequestForm(false);
          setReqField("cpi");
          setReqValue("");
          setReqReason("");
        },
      }
    );
  };

  const resumeDisplayName = resumeName ?? resumeFileName(profile?.resumeUrl ?? null) ?? "";

  return (
    <>
      {/* Header */}
      <header className="bg-surface sticky top-0 z-30 px-gutter-desktop py-6 border-b border-surface-border/50 bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-container-max mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-headline-md font-headline-md text-text-primary hidden md:block">My Profile</h1>
            <h1 className="text-headline-lg-mobile font-headline-lg-mobile text-text-primary md:hidden">
              My Profile
            </h1>
            <p className="text-body-md font-body-md text-text-secondary mt-1">
              Manage your academic and professional identity.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-border">
              <span
                className={`w-2 h-2 rounded-full ${profile?.isBlocked ? "bg-status-error" : "bg-status-success"}`}
              ></span>
              <span className="text-label-sm font-label-sm text-text-secondary">
                {profile?.isBlocked ? "Profile Restricted" : "Profile Active"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 p-gutter-mobile md:p-gutter-desktop max-w-container-max mx-auto w-full space-y-6 md:space-y-8">
        {me.isPending ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 h-72 rounded-xl bg-surface-variant animate-pulse"></div>
              <div className="h-72 rounded-xl bg-surface-variant animate-pulse"></div>
            </div>
            <div className="h-96 rounded-xl bg-surface-variant animate-pulse"></div>
          </>
        ) : me.isError ? (
          <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-status-error">error</span>
              <div>
                <p className="text-title-md font-title-md text-text-primary">Couldn&apos;t load your profile</p>
                <p className="text-body-md font-body-md text-text-secondary">
                  {me.error.message || "Something went wrong while fetching your data."}
                </p>
              </div>
            </div>
            <button
              onClick={() => void me.refetch()}
              className="shrink-0 px-4 py-2 rounded-lg border border-status-error/20 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !user || !profile ? (
          <div className="rounded-xl border border-surface-border bg-surface-container-low p-10 text-center text-text-secondary">
            <span className="material-symbols-outlined text-[40px] mb-2 opacity-50 block">person_off</span>
            <p className="text-title-md font-title-md">Student profile unavailable</p>
            <p className="text-body-md font-body-md mt-1">Sign in with your institute account to view your profile.</p>
          </div>
        ) : (
          <>
            {/* Top Grid: Identity & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Locked Identity & Academic Card */}
              <div className="lg:col-span-2 glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row relative">
                <div className="absolute top-4 right-4 bg-surface-container-low px-2 py-1 rounded border border-surface-border flex items-center gap-1 z-10">
                  <span className="material-symbols-outlined text-[14px] text-text-secondary">lock</span>
                  <span className="text-label-sm font-label-sm text-text-secondary">Verified by Admin</span>
                </div>
                <div className="w-full md:w-1/3 bg-surface-container-low p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-surface-border">
                  <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-display-lg font-display-lg mb-4 shadow-sm">
                    {initialsOf(user.fullName)}
                  </div>
                  <h2 className="text-title-md font-title-md text-text-primary text-center">{user.fullName}</h2>
                  <p className="text-body-md font-body-md text-text-secondary text-center mt-1">{profile.rollNo}</p>
                </div>
                <div className="w-full md:w-2/3 p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 content-start">
                  {lockedFields(user, profile).map((field) => (
                    <div key={field.label}>
                      <label className="text-label-sm font-label-sm text-text-secondary block mb-1 uppercase tracking-wider">
                        {field.label}
                      </label>
                      <div
                        className={`text-body-md font-body-md font-medium flex items-center gap-1.5 ${
                          field.tone ?? "text-text-primary"
                        }`}
                      >
                        {field.icon && <span className="material-symbols-outlined text-[16px]">{field.icon}</span>}
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Correction Tracker */}
              <div className="glass-panel rounded-xl shadow-sm p-6 flex flex-col border border-surface-border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-title-md font-title-md text-text-primary">Data Requests</h3>
                    <p className="text-label-sm font-label-sm text-text-secondary">
                      Correction requests for locked fields
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRequestForm((v) => !v)}
                    className="text-primary hover:text-navy-vibrant text-label-sm font-label-sm transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">{showRequestForm ? "close" : "add"}</span>{" "}
                    {showRequestForm ? "Cancel" : "New Request"}
                  </button>
                </div>

                {/* Inline new-request form */}
                {showRequestForm && (
                  <div className="p-3 bg-surface-container-low rounded-lg border border-surface-border mb-4 space-y-3">
                    <div>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="req-field">
                        Field
                      </label>
                      <select
                        id="req-field"
                        className={inputClass}
                        value={reqField}
                        onChange={(e) => setReqField(e.target.value)}
                      >
                        {CORRECTION_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="req-value">
                        Correct value
                      </label>
                      <input
                        id="req-value"
                        className={inputClass}
                        type="text"
                        value={reqValue}
                        onChange={(e) => setReqValue(e.target.value)}
                        placeholder="e.g. 8.92"
                      />
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="req-reason">
                        Reason
                      </label>
                      <textarea
                        id="req-reason"
                        className={`${inputClass} resize-none`}
                        rows={2}
                        value={reqReason}
                        onChange={(e) => setReqReason(e.target.value)}
                        placeholder="Why does this field need correcting?"
                      ></textarea>
                    </div>
                    {createCorrection.isError && (
                      <p className="text-label-sm font-label-sm text-status-error">
                        {createCorrection.error.message || "Could not submit the request."}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={handleCreateCorrection}
                        disabled={createCorrection.isPending || !reqValue.trim()}
                        className="bg-gradient-to-b from-primary to-navy-deep text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                      >
                        {createCorrection.isPending ? "Submitting…" : "Submit Request"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4 flex-1">
                  {corrections.isPending ? (
                    <>
                      <div className="h-20 rounded-lg bg-surface-variant animate-pulse"></div>
                      <div className="h-20 rounded-lg bg-surface-variant animate-pulse"></div>
                    </>
                  ) : corrections.isError ? (
                    <div className="p-3 bg-status-error/5 rounded-lg border border-status-error/20 text-label-sm font-label-sm text-status-error flex items-center justify-between gap-2">
                      <span>Couldn&apos;t load requests.</span>
                      <button onClick={() => void corrections.refetch()} className="underline hover:no-underline">
                        Retry
                      </button>
                    </div>
                  ) : corrections.data.length === 0 ? (
                    <p className="text-label-sm font-label-sm text-text-secondary">
                      No correction requests yet. Spot something wrong in a locked field? Raise a request.
                    </p>
                  ) : (
                    corrections.data.map((request) => (
                      <div key={request.id} className="p-3 bg-surface-container-low rounded-lg border border-surface-border">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <span className="text-label-md font-label-md text-text-primary font-medium">
                            {fieldLabel(request.fieldName)} Correction
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-label-sm font-label-sm border whitespace-nowrap ${
                              REQUEST_STYLES[request.status]
                            }`}
                          >
                            {titleCase(request.status)}
                          </span>
                        </div>
                        <p className="text-label-sm font-label-sm text-text-secondary line-clamp-2">
                          {correctionDetail(request)}
                        </p>
                        <div className="mt-2 text-label-sm font-label-sm text-text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span> Submitted{" "}
                          {formatDate(request.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Grid: Editable Sections */}
            <div className="glass-panel rounded-xl shadow-sm border border-surface-border overflow-hidden">
              <div className="border-b border-surface-border bg-surface-container-lowest px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-title-md font-title-md text-text-primary">Professional Details</h3>
                  <p className="text-label-sm font-label-sm text-text-secondary">
                    Editable fields — used to prefill your applications
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {updateProfile.isError && (
                    <span className="text-label-sm font-label-sm text-status-error hidden sm:inline">
                      {updateProfile.error.message || "Save failed."}
                    </span>
                  )}
                  {saved && !updateProfile.isPending && (
                    <span className="text-label-sm font-label-sm text-status-success hidden sm:flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Saved
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={updateProfile.isPending || !form}
                    className="bg-gradient-to-b from-primary to-navy-deep text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:shadow-md transition-all shrink-0 disabled:opacity-60"
                  >
                    {updateProfile.isPending ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info Form */}
                <div className="space-y-5">
                  <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider border-b border-surface-border pb-2 mb-4">
                    Contact Information
                  </h4>
                  {CONTACT_FIELDS.map((field) => (
                    <div key={field.id}>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor={field.id}>
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        className={inputClass}
                        type={field.type}
                        value={form?.[field.id] ?? ""}
                        onChange={(e) => setField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={!form}
                      />
                    </div>
                  ))}
                </div>

                {/* Skills & Links Form */}
                <div className="space-y-5">
                  <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider border-b border-surface-border pb-2 mb-4">
                    Skills &amp; Links
                  </h4>
                  <div>
                    <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="skills">
                      Core Technical Skills (Comma separated)
                    </label>
                    <textarea
                      id="skills"
                      className={`${inputClass} resize-none`}
                      rows={2}
                      value={form?.skills ?? ""}
                      onChange={(e) => setField("skills", e.target.value)}
                      placeholder="C++, Python, React, Machine Learning"
                      disabled={!form}
                    ></textarea>
                  </div>
                  {LINK_FIELDS.map((field) => (
                    <div key={field.id}>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor={field.id}>
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        className={inputClass}
                        type={field.type}
                        value={form?.[field.id] ?? ""}
                        onChange={(e) => setField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={!form}
                      />
                    </div>
                  ))}
                  {/* Resume — PDF upload */}
                  <div>
                    <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="resume">
                      Resume (PDF)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="resume"
                        className={inputClass}
                        type="text"
                        readOnly
                        value={resumeDisplayName}
                        placeholder="Upload a PDF resume…"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border bg-surface-container-low text-label-md font-label-md text-text-primary hover:bg-surface-variant transition-colors disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        <span className="hidden sm:inline">{uploading ? "Uploading…" : "Upload PDF"}</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleResumeFile(file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-label-sm font-label-sm">
                      {resumeKey && (
                        <span className="text-status-warning flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          Uploaded — press Save Changes to keep it.
                        </span>
                      )}
                      {!resumeKey && profile.resumeUrl?.startsWith("resume/") && (
                        <button
                          type="button"
                          onClick={() => void handleViewResume()}
                          className="text-primary hover:text-navy-vibrant transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          View resume
                        </button>
                      )}
                      {resumeError && <span className="text-status-error">{resumeError}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MyProfile;
