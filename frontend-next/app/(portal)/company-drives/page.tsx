"use client";

import { useMemo, useState } from "react";
import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
import {
  COMPANY_DRIVES,
  COMPANY_NAME,
  type DriveApplicant,
  type ImportantDateType,
} from "@/data/company-drives";

const DATE_ICON: Record<ImportantDateType, string> = {
  ppt: "co_present",
  oa: "quiz",
  interview: "groups",
  deadline: "event_busy",
  result: "emoji_events",
};

export default function CompanyDrivesPage() {
  const [driveId, setDriveId] = useState(COMPANY_DRIVES[0].id);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DriveApplicant | null>(null);

  const drive = COMPANY_DRIVES.find((d) => d.id === driveId) ?? COMPANY_DRIVES[0];

  const applicants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drive.applicants;
    return drive.applicants.filter((a) =>
      `${a.name} ${a.roll} ${a.branch}`.toLowerCase().includes(q)
    );
  }, [drive, query]);

  const shortlistedCount = drive.applicants.filter(
    (a) => a.status.label === "Shortlisted" || a.status.label === "Interview"
  ).length;

  const columns: Column<DriveApplicant>[] = [
    {
      header: "Candidate",
      render: (a) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 text-label-sm font-label-sm font-semibold">
            {a.initials}
          </div>
          <div className="min-w-0">
            <p className="text-body-md font-body-md text-text-primary truncate">
              {a.name}
            </p>
            <p className="text-label-sm font-label-sm text-text-secondary">
              {a.roll}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Branch",
      render: (a) => (
        <span className="text-body-md font-body-md text-text-secondary whitespace-nowrap">
          {a.branch}
        </span>
      ),
    },
    {
      header: "CPI",
      render: (a) => (
        <span className="text-body-md font-body-md text-text-primary font-semibold">
          {a.cpi}
        </span>
      ),
    },
    {
      header: "Applied",
      render: (a) => (
        <span className="text-label-md font-label-md text-text-secondary whitespace-nowrap">
          {a.appliedOn}
        </span>
      ),
    },
    {
      header: "Status",
      render: (a) => <StatusBadge tone={a.status.tone}>{a.status.label}</StatusBadge>,
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (a) => (
        <button
          type="button"
          onClick={() => setSelected(a)}
          className="inline-flex items-center gap-1 text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          View
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1">
      <PortalHeader
        title="My Drives"
        subtitle={COMPANY_NAME}
        actions={
          <div className="w-full sm:w-auto">
            <label htmlFor="drive-select" className="sr-only">
              Select drive
            </label>
            <select
              id="drive-select"
              value={driveId}
              onChange={(e) => {
                setDriveId(e.target.value);
                setQuery("");
                setSelected(null);
              }}
              className="w-full sm:w-72 bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              {COMPANY_DRIVES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.role} • {d.processType}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-6 space-y-6">
        {/* Drive summary */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-5 md:p-6 elevation-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-title-lg font-title-lg text-text-primary">
                  {drive.role}
                </h2>
                <StatusBadge tone={drive.status.tone}>{drive.status.label}</StatusBadge>
              </div>
              <p className="text-body-md font-body-md text-text-secondary max-w-2xl">
                {drive.description}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            {[
              { icon: "category", label: "Process", value: drive.processType },
              { icon: "payments", label: "CTC", value: drive.ctc },
              { icon: "location_on", label: "Location", value: drive.location },
              { icon: "event_busy", label: "Deadline", value: drive.deadline },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                  {f.label}
                </p>
                <p className="text-body-md font-body-md text-text-primary font-semibold">
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Important dates */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-5 md:p-6 elevation-1">
          <h3 className="text-title-md font-title-md text-text-primary mb-4">
            Important Dates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {drive.dates.map((d) => (
              <div
                key={d.label}
                className={cn(
                  "rounded-lg border p-3 flex flex-col gap-1",
                  d.done
                    ? "border-surface-border bg-surface-container-low"
                    : "border-primary/30 bg-primary-fixed/20"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[20px]",
                    d.done ? "text-text-secondary" : "text-primary"
                  )}
                  style={d.done ? undefined : { fontVariationSettings: "'FILL' 1" }}
                >
                  {d.done ? "check_circle" : DATE_ICON[d.type]}
                </span>
                <span className="text-label-sm font-label-sm text-text-secondary">
                  {d.label}
                </span>
                <span className="text-body-md font-body-md text-text-primary font-semibold">
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Applicants */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-title-md font-title-md text-text-primary">
                Applicants
              </h3>
              <p className="text-label-sm font-label-sm text-text-secondary mt-0.5">
                {drive.applicants.length} applied · {shortlistedCount} in process
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-secondary">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, roll, branch…"
                className="w-full bg-surface border border-surface-border rounded-lg pl-9 pr-3 py-2 text-body-md font-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          {applicants.length === 0 ? (
            <p className="text-body-md font-body-md text-text-secondary text-center py-12">
              No applicants match your search.
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={applicants}
              className="min-w-[680px]"
              theadClassName="border-b border-surface-border"
              thClassName="px-5 md:px-6 py-3 text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
              tdClassName="px-5 md:px-6 py-3 align-middle"
              rowClassName={(_, i) =>
                cn("border-b border-surface-border/60", i % 2 === 1 && "bg-surface/40")
              }
            />
          )}
        </section>
      </div>

      {/* Applicant profile / resume modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-surface-container-lowest rounded-xl border border-surface-border w-full max-w-lg elevation-2 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="sticky top-0 bg-surface-container-lowest border-b border-surface-border p-5 flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 text-title-md font-title-md font-semibold">
                {selected.initials}
              </div>
              <div className="min-w-0 grow">
                <h3 className="text-title-lg font-title-lg text-text-primary truncate">
                  {selected.name}
                </h3>
                <p className="text-label-md font-label-md text-text-secondary">
                  {selected.roll} · {selected.branch} · CPI {selected.cpi}
                </p>
                <div className="mt-2">
                  <StatusBadge tone={selected.status.tone}>
                    {selected.status.label}
                  </StatusBadge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="w-9 h-9 rounded-full hover:bg-surface-variant flex items-center justify-center text-text-secondary shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              <div>
                <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
                  Contact
                </p>
                <div className="space-y-1.5">
                  <a
                    href={`mailto:${selected.email}`}
                    className="flex items-center gap-2 text-body-md font-body-md text-text-primary hover:text-primary transition-colors min-w-0"
                  >
                    <span className="material-symbols-outlined text-[18px] shrink-0">mail</span>
                    <span className="truncate">{selected.email}</span>
                  </a>
                  <a
                    href={`tel:${selected.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-body-md font-body-md text-text-primary hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] shrink-0">call</span>
                    {selected.phone}
                  </a>
                  {selected.preferredLocation && (
                    <p className="flex items-center gap-2 text-body-md font-body-md text-text-secondary">
                      <span className="material-symbols-outlined text-[18px] shrink-0">
                        location_on
                      </span>
                      Prefers {selected.preferredLocation}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-full bg-surface-variant text-label-sm font-label-sm text-text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {(selected.linkedin || selected.github) && (
                <div>
                  <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-2">
                    Links
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {selected.linkedin && (
                      <a
                        href={`https://${selected.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-body-md font-body-md text-primary hover:text-navy-vibrant transition-colors min-w-0"
                      >
                        <span className="material-symbols-outlined text-[18px] shrink-0">link</span>
                        <span className="truncate">{selected.linkedin}</span>
                      </a>
                    )}
                    {selected.github && (
                      <a
                        href={`https://${selected.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-body-md font-body-md text-primary hover:text-navy-vibrant transition-colors min-w-0"
                      >
                        <span className="material-symbols-outlined text-[18px] shrink-0">code</span>
                        <span className="truncate">{selected.github}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="sticky bottom-0 bg-surface-container-lowest border-t border-surface-border p-5 flex flex-col sm:flex-row gap-3">
              <a
                href={selected.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 btn-gradient text-on-primary rounded-lg py-2.5 px-4 text-label-md font-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                Download Resume
              </a>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-variant transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
