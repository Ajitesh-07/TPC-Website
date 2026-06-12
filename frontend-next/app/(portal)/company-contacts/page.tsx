"use client";

import { useMemo, useState } from "react";
import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import Button from "@/components/ui/Button";
import {
  COMPANY_CONTACTS,
  CHANNELS,
  INDUSTRIES,
  type CompanyContact,
  type ContactEntry,
  type ContactChannel,
} from "@/data/company-contacts";
import { cn } from "@/lib/utils";

const CHANNEL_ICON: Record<ContactChannel, string> = {
  Email: "mail",
  Call: "call",
  Visit: "location_on",
};

const CHANNEL_TONE: Record<ContactChannel, BadgeTone> = {
  Email: "info",
  Call: "success",
  Visit: "notice",
};

const CHANNEL_DOT: Record<ContactChannel, string> = {
  Email: "bg-navy-vibrant",
  Call: "bg-status-success",
  Visit: "bg-secondary-fixed-dim",
};

/** Today's display date for newly-logged contacts. */
const todayDisplay = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const CompanyContacts = () => {
  // Local state so the mock "Save Contact" mutation is visible.
  const [companies, setCompanies] = useState<CompanyContact[]>(COMPANY_CONTACTS);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  const [selectedId, setSelectedId] = useState<string>(COMPANY_CONTACTS[0].id);

  // Update-contact form fields.
  const [formPerson, setFormPerson] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formChannel, setFormChannel] = useState<ContactChannel>("Email");
  const [formDate, setFormDate] = useState("");
  const [formNote, setFormNote] = useState("");

  const visibleCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies
      .filter((c) => (industry === "all" ? true : c.industry === industry))
      .filter((c) => !q || c.company.toLowerCase().includes(q));
  }, [companies, query, industry]);

  const selected = useMemo(
    () => companies.find((c) => c.id === selectedId) ?? null,
    [companies, selectedId]
  );

  const lastEntry: ContactEntry | undefined = selected?.history[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !formPerson.trim()) return;

    const displayDate = formDate
      ? new Date(formDate + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : todayDisplay();

    const entry: ContactEntry = {
      date: displayDate,
      person: formPerson.trim(),
      designation: formDesignation.trim() || "—",
      channel: formChannel,
      note: formNote.trim() || "No note added.",
    };

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              poc: entry.person,
              lastContacted: entry.date,
              history: [entry, ...c.history],
            }
          : c
      )
    );

    // Reset the form.
    setFormPerson("");
    setFormDesignation("");
    setFormChannel("Email");
    setFormDate("");
    setFormNote("");
  };

  return (
    <>
      <PortalHeader
        title="Company Contacts"
        subtitle="Track who last spoke with each recruiter."
        innerClassName="max-w-container-max mx-auto"
        actions={
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-surface-border rounded-xl text-body-md font-body-md text-on-surface input-glow focus:outline-none focus:border-primary transition-all"
              placeholder="Search companies..."
              type="text"
            />
          </div>
        }
      />

      <div className="flex-1 px-gutter-mobile md:px-gutter-desktop py-8 max-w-container-max mx-auto w-full animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: company list */}
          <aside className="lg:col-span-5 xl:col-span-4 bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-surface-border bg-surface-bright flex items-center justify-between gap-3">
              <h3 className="text-title-md font-title-md text-text-primary">
                Recruiters
              </h3>
              <div className="relative">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="appearance-none text-label-md font-label-md bg-surface border border-surface-border rounded-lg pl-3 pr-8 py-1.5 text-text-secondary outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">All industries</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[18px] absolute right-1.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 max-h-[70vh]">
              {visibleCompanies.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                  <span className="material-symbols-outlined text-[40px] mb-2 opacity-50">
                    search_off
                  </span>
                  <p className="text-label-md font-label-md">No companies found</p>
                </div>
              ) : (
                visibleCompanies.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1",
                        active
                          ? "bg-primary-fixed/60 border border-primary-fixed-dim"
                          : "hover:bg-surface-container-low border border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "w-11 h-11 rounded-lg flex items-center justify-center text-label-md font-bold shrink-0",
                          active
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-highest text-navy-vibrant"
                        )}
                      >
                        {c.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-body-md text-text-primary truncate">
                          {c.company}
                        </p>
                        <p className="text-label-sm font-label-sm text-text-secondary truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            schedule
                          </span>
                          {c.lastContacted}
                        </p>
                      </div>
                      <StatusBadge
                        tone={CHANNEL_TONE[c.history[0].channel]}
                        className="shrink-0"
                      >
                        {c.history[0].channel}
                      </StatusBadge>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT: detail panel */}
          <section className="lg:col-span-7 xl:col-span-8 space-y-6">
            {!selected ? (
              <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 py-24 text-center text-text-secondary">
                <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                  contacts
                </span>
                <p className="text-title-md font-title-md">
                  Select a company to view its contact history
                </p>
              </div>
            ) : (
              <>
                {/* Last Contacted summary */}
                <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-surface-container-highest rounded-xl flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                        {selected.initials}
                      </div>
                      <div>
                        <h3 className="text-title-lg font-title-lg text-text-primary">
                          {selected.company}
                        </h3>
                        <p className="text-label-md font-label-md text-text-secondary">
                          {selected.industry}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone="success" icon="check_circle">
                      Active
                    </StatusBadge>
                  </div>

                  <p className="text-label-sm font-label-sm text-text-secondary uppercase tracking-wider mb-3">
                    Last Contacted
                  </p>
                  {lastEntry && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-surface-container-low p-3 rounded-lg">
                        <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                          POC
                        </span>
                        <span className="text-label-md font-label-md font-medium text-on-surface">
                          {lastEntry.person}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-lg">
                        <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                          Designation
                        </span>
                        <span className="text-label-md font-label-md font-medium text-on-surface">
                          {lastEntry.designation}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-lg">
                        <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                          Channel
                        </span>
                        <span className="inline-flex items-center gap-1 text-label-md font-label-md font-medium text-on-surface">
                          <span className="material-symbols-outlined text-[16px]">
                            {CHANNEL_ICON[lastEntry.channel]}
                          </span>
                          {lastEntry.channel}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-lg">
                        <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                          Date
                        </span>
                        <span className="text-label-md font-label-md font-medium text-on-surface">
                          {lastEntry.date}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact History */}
                <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6">
                  <h4 className="text-title-md font-title-md text-text-primary mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      history
                    </span>
                    Contact History
                  </h4>
                  <Timeline>
                    {selected.history.map((entry, i) => (
                      <TimelineItem
                        key={`${entry.date}-${i}`}
                        dotClassName={cn(
                          "-left-[5px] top-1.5 w-2.5 h-2.5 rounded-full",
                          CHANNEL_DOT[entry.channel]
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-body-md font-body-md text-text-primary font-medium">
                              {entry.person}
                            </span>
                            <span className="text-label-sm font-label-sm text-text-secondary">
                              {entry.designation}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              tone={CHANNEL_TONE[entry.channel]}
                              icon={CHANNEL_ICON[entry.channel]}
                            >
                              {entry.channel}
                            </StatusBadge>
                            <span className="text-label-sm font-label-sm text-text-secondary">
                              {entry.date}
                            </span>
                          </div>
                        </div>
                        <p className="text-body-md font-body-md text-text-secondary mt-1">
                          {entry.note}
                        </p>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </div>

                {/* Update Last Contact form */}
                <form
                  onSubmit={handleSave}
                  className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6"
                >
                  <h4 className="text-title-md font-title-md text-text-primary mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      edit_note
                    </span>
                    Update Last Contact
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1.5">
                        Contact Person
                      </label>
                      <input
                        value={formPerson}
                        onChange={(e) => setFormPerson(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-surface-container-low border border-surface-border rounded-lg text-body-md font-body-md text-on-surface input-glow focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g. Ananya Krishnan"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1.5">
                        Designation
                      </label>
                      <input
                        value={formDesignation}
                        onChange={(e) => setFormDesignation(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container-low border border-surface-border rounded-lg text-body-md font-body-md text-on-surface input-glow focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g. University Programs Lead"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1.5">
                        Channel
                      </label>
                      <div className="relative">
                        <select
                          value={formChannel}
                          onChange={(e) =>
                            setFormChannel(e.target.value as ContactChannel)
                          }
                          className="w-full appearance-none px-3 pr-9 py-2 bg-surface-container-low border border-surface-border rounded-lg text-body-md font-body-md text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
                        >
                          {CHANNELS.map((ch) => (
                            <option key={ch} value={ch}>
                              {ch}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined text-[18px] absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1.5">
                        Date
                      </label>
                      <input
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container-low border border-surface-border rounded-lg text-body-md font-body-md text-on-surface input-glow focus:outline-none focus:border-primary transition-all"
                        type="date"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-label-sm font-label-sm text-text-secondary mb-1.5">
                        Note
                      </label>
                      <textarea
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-surface-container-low border border-surface-border rounded-lg text-body-md font-body-md text-on-surface input-glow focus:outline-none focus:border-primary transition-all resize-none"
                        placeholder="What was discussed?"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-5">
                    <Button type="submit" size="sm" icon="save">
                      Save Contact
                    </Button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default CompanyContacts;
