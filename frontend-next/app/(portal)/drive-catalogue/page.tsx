"use client";

import { useMemo, useState } from "react";
import {
  DRIVES,
  DRIVE_TABS,
  DRIVE_SORTS,
  type Drive,
  type DriveStatus,
  type SortKey,
} from "@/data/drives";

// Closing-soon deadline highlight.
const deadlineTone = (daysLeft: number) => {
  if (daysLeft <= 0) return "text-text-secondary";
  if (daysLeft <= 3) return "text-status-error";
  if (daysLeft <= 7) return "text-status-warning";
  return "text-on-surface";
};

const DriveCatalogue = () => {
  const [activeTab, setActiveTab] = useState<DriveStatus>("upcoming");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("deadline");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<Drive | null>(null);

  const visibleDrives = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DRIVES.filter((d) => d.status === activeTab)
      .filter((d) => (eligibleOnly ? d.eligible : true))
      .filter((d) => !q || d.company.toLowerCase().includes(q) || d.role.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === "company") return a.company.localeCompare(b.company);
        if (sortBy === "ctc") return b.ctcValue - a.ctcValue;
        return a.daysLeft - b.daysLeft;
      });
  }, [activeTab, query, sortBy, eligibleOnly]);

  return (
    <>
      {/* Header */}
      <header className="bg-surface sticky top-0 z-30 border-b border-surface-border px-gutter-desktop py-6">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-headline-md font-headline-md text-text-primary">Drive Catalogue</h2>
            <p className="text-body-md font-body-md text-text-secondary mt-1">
              Explore and apply for upcoming placement and internship opportunities.
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                placeholder="Search companies or roles..."
                type="text"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`p-2 border rounded-xl transition-colors flex items-center justify-center ${
                  eligibleOnly || showFilter
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-surface-border text-on-surface-variant hover:bg-surface-variant"
                }`}
                aria-label="Filter"
              >
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-surface-border rounded-xl elevation-2 p-4 z-40">
                  <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-3">
                    Filters
                  </p>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-body-md font-body-md text-text-primary">Eligible only</span>
                    <input
                      type="checkbox"
                      checked={eligibleOnly}
                      onChange={(e) => setEligibleOnly(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="flex-1 px-gutter-desktop py-8 max-w-container-max mx-auto w-full">
        {/* Controls (Tabs & Sort) */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="bg-surface-container-low p-1 rounded-xl inline-flex w-full sm:w-auto">
            {DRIVE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-title-md font-title-md transition-all ${
                  activeTab === tab.key
                    ? "bg-surface shadow-sm text-primary"
                    : "text-text-secondary hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-body-md font-body-md text-text-secondary w-full sm:w-auto justify-end">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-transparent border-none text-primary font-medium focus:ring-0 cursor-pointer"
            >
              {DRIVE_SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drives Grid */}
        {visibleDrives.length === 0 ? (
          <div className="text-center py-24 text-text-secondary">
            <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">search_off</span>
            <p className="text-title-md font-title-md">No drives match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleDrives.map((drive) => (
              <article
                key={drive.id}
                className={`bg-surface rounded-xl border border-surface-border soft-shadow p-6 flex flex-col relative overflow-hidden ${
                  drive.eligible ? "hover-lift hover:border-navy-vibrant" : "opacity-90"
                }`}
              >
                {drive.eligible && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed-dim opacity-10 rounded-bl-full -z-10"></div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                      {drive.initials}
                    </div>
                    <div>
                      <h3 className="text-title-lg font-title-lg text-text-primary">{drive.company}</h3>
                      <p className="text-label-md font-label-md text-text-secondary">{drive.role}</p>
                    </div>
                  </div>
                  {drive.eligible ? (
                    <span className="inline-flex items-center gap-1 bg-status-success/10 text-status-success px-2 py-1 rounded-md text-label-sm font-label-sm shrink-0">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Eligible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-status-error/10 text-status-error px-2 py-1 rounded-md text-label-sm font-label-sm shrink-0">
                      <span className="material-symbols-outlined text-[14px]">cancel</span>
                      Ineligible
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-surface-container-low p-3 rounded-lg">
                    <span className="block text-label-sm font-label-sm text-text-secondary mb-1">CTC / Stipend</span>
                    <span className="text-title-md font-title-md text-on-surface">{drive.ctc}</span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg">
                    <span className="block text-label-sm font-label-sm text-text-secondary mb-1">Deadline</span>
                    <span className={`text-title-md font-title-md ${deadlineTone(drive.daysLeft)}`}>
                      {drive.deadline}
                    </span>
                  </div>
                </div>

                {/* Process type + tags + deadline highlight */}
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                  <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded-md text-label-sm font-label-sm">
                    {drive.processType}
                  </span>
                  {drive.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded-md text-label-sm font-label-sm"
                    >
                      {tag}
                    </span>
                  ))}
                  {drive.status === "upcoming" && drive.daysLeft > 0 && drive.daysLeft <= 3 && (
                    <span className="ml-auto inline-flex items-center gap-1 bg-status-error/10 text-status-error px-2 py-1 rounded-md text-label-sm font-label-sm font-bold">
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      Closes in {drive.daysLeft}d
                    </span>
                  )}
                </div>

                {/* Ineligibility note */}
                {!drive.eligible && drive.ineligibleReason && (
                  <div className="bg-error-container text-on-error-container p-2 rounded-lg text-label-md font-label-md mb-4 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                    <span>{drive.ineligibleReason}</span>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-surface-border">
                  <button
                    onClick={() => setSelected(drive)}
                    className="text-label-md font-label-md text-primary hover:text-navy-vibrant flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Details
                  </button>
                  {drive.status === "closed" ? (
                    <span className="bg-surface-container-highest text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md">
                      Closed
                    </span>
                  ) : !drive.eligible ? (
                    <button
                      disabled
                      className="bg-surface-container-highest text-text-secondary px-4 py-2 rounded-lg text-label-md font-label-md cursor-not-allowed"
                    >
                      Apply Locked
                    </button>
                  ) : drive.status === "ongoing" ? (
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-2 rounded-lg text-label-md font-label-md">
                      In Process
                    </span>
                  ) : (
                    <button className="bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary px-4 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity">
                      Apply Now
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}></div>
          <div className="relative z-10 bg-surface-container-lowest rounded-xl border border-surface-border w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar elevation-2">
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-surface-border px-6 py-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                  {selected.initials}
                </div>
                <div>
                  <h3 className="text-title-lg font-title-lg text-text-primary">{selected.company}</h3>
                  <p className="text-label-md font-label-md text-text-secondary">{selected.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-full hover:bg-surface-variant flex items-center justify-center text-text-secondary transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Process", value: selected.processType },
                  { label: "CTC / Stipend", value: selected.ctc },
                  { label: "Location", value: selected.location },
                  { label: "Deadline", value: selected.deadline, tone: deadlineTone(selected.daysLeft) },
                ].map((fact) => (
                  <div key={fact.label} className="bg-surface-container-low p-3 rounded-lg">
                    <span className="block text-label-sm font-label-sm text-text-secondary mb-1">{fact.label}</span>
                    <span className={`text-label-md font-label-md font-medium ${fact.tone ?? "text-on-surface"}`}>
                      {fact.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* About */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">
                  About the Role
                </h4>
                <p className="text-body-md font-body-md text-text-secondary">{selected.about}</p>
              </div>

              {/* Eligibility */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">
                  Eligibility Criteria
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selected.eligibility.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                      <span className="material-symbols-outlined text-[16px] text-status-success">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-3">
                  Process Timeline
                </h4>
                <div className="relative border-l border-surface-variant ml-2 space-y-4">
                  {selected.timeline.map((step) => (
                    <div key={step.label} className="relative pl-5">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-primary rounded-full"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-body-md font-body-md text-text-primary">{step.label}</span>
                        <span className="text-label-md font-label-md text-text-secondary">{step.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-label-md font-label-md text-text-secondary uppercase tracking-wider mb-2">
                  Documents
                </h4>
                <div className="space-y-2">
                  {selected.documents.map((doc) => (
                    <a
                      key={doc.name}
                      href="#"
                      className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-surface-border hover:border-primary transition-colors group"
                    >
                      <span className="material-symbols-outlined text-primary">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-md font-label-md text-text-primary truncate">{doc.name}</p>
                        <p className="text-label-sm font-label-sm text-text-secondary">{doc.meta}</p>
                      </div>
                      <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">
                        download
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Ineligibility block */}
              {!selected.eligible && selected.ineligibleReason && (
                <div className="bg-error-container text-on-error-container p-3 rounded-lg text-body-md font-body-md flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] mt-0.5">info</span>
                  <span>{selected.ineligibleReason}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-surface-container-lowest/95 backdrop-blur-sm border-t border-surface-border px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-variant transition-colors"
              >
                Close
              </button>
              {selected.status === "closed" ? (
                <span className="px-4 py-2 rounded-lg bg-surface-container-highest text-text-secondary text-label-md font-label-md">
                  Drive Closed
                </span>
              ) : !selected.eligible ? (
                <button
                  disabled
                  className="px-4 py-2 rounded-lg bg-surface-container-highest text-text-secondary text-label-md font-label-md cursor-not-allowed"
                >
                  Apply Locked
                </button>
              ) : selected.status === "ongoing" ? (
                <span className="px-4 py-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-label-md font-label-md">
                  In Process
                </span>
              ) : (
                <button className="bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary px-5 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity">
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriveCatalogue;
