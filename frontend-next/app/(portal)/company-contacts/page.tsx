"use client";

import { useEffect, useMemo, useState } from "react";
import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge, { type BadgeTone } from "@/components/ui/StatusBadge";
import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import { useContacts, useContactDetail, useAddContact } from "@/lib/hooks";
import type {
  ContactChannelApi,
  ContactCompanyRow,
  ContactEntry,
} from "@/lib/api-types";
import { cn } from "@/lib/utils";

// ---------- local mappers / formatting ----------

const CHANNELS: ContactChannelApi[] = ["email", "call", "visit", "other"];

const CHANNEL_LABEL: Record<ContactChannelApi, string> = {
  email: "Email",
  call: "Call",
  visit: "Visit",
  other: "Other",
};

const CHANNEL_ICON: Record<ContactChannelApi, string> = {
  email: "mail",
  call: "call",
  visit: "location_on",
  other: "chat",
};

const CHANNEL_TONE: Record<ContactChannelApi, BadgeTone> = {
  email: "info",
  call: "success",
  visit: "notice",
  other: "neutral",
};

const CHANNEL_DOT: Record<ContactChannelApi, string> = {
  email: "bg-navy-vibrant",
  call: "bg-status-success",
  visit: "bg-secondary-fixed-dim",
  other: "bg-outline",
};

/** ISO / YYYY-MM-DD → "Oct 15, 2024" (falls back to em-dash on empty/invalid). */
const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

/** Two-letter initials from a company name. */
const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/** Today as YYYY-MM-DD for the date input default. */
const todayInput = (): string => new Date().toISOString().slice(0, 10);

const CompanyContacts = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  // User's explicit choice; null falls back to the first company (derived below).
  const [pickedId, setPickedId] = useState<string | null>(null);

  // Update-contact form fields.
  const [formPerson, setFormPerson] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formChannel, setFormChannel] = useState<ContactChannelApi>("email");
  const [formDate, setFormDate] = useState("");
  const [formNote, setFormNote] = useState("");

  // Debounce the search box → search param (300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const listParams = useMemo(
    () => ({
      search: debouncedQuery || undefined,
      industry: industry === "all" ? undefined : industry,
    }),
    [debouncedQuery, industry]
  );

  const listQuery = useContacts(listParams);
  const companies = useMemo<ContactCompanyRow[]>(
    () => listQuery.data ?? [],
    [listQuery.data]
  );

  // Industry filter options, derived from the current results plus the active
  // filter value (so the selected option never vanishes when results narrow).
  const industries = useMemo(() => {
    const set = new Set<string>();
    if (industry !== "all") set.add(industry);
    for (const c of companies) {
      if (c.industry) set.add(c.industry);
    }
    return Array.from(set).sort();
  }, [companies, industry]);

  // Effective selection: the user's pick if still present, else the first row.
  const selectedId = useMemo(() => {
    if (pickedId && companies.some((c) => c.id === pickedId)) return pickedId;
    return companies[0]?.id ?? null;
  }, [pickedId, companies]);

  const detailQuery = useContactDetail(selectedId);
  const detail = detailQuery.data;
  const addContact = useAddContact(selectedId ?? "");

  const lastEntry: ContactEntry | undefined = detail?.history[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !formPerson.trim()) return;

    addContact.mutate(
      {
        contactName: formPerson.trim(),
        designation: formDesignation.trim() || undefined,
        channel: formChannel,
        note: formNote.trim() || undefined,
        contactedOn: formDate || todayInput(),
      },
      {
        onSuccess: () => {
          setFormPerson("");
          setFormDesignation("");
          setFormChannel("email");
          setFormDate("");
          setFormNote("");
        },
      }
    );
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
                  {industries.map((ind) => (
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
              {listQuery.isPending ? (
                <div className="space-y-2 p-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg animate-pulse"
                    >
                      <div className="w-11 h-11 rounded-lg bg-surface-variant shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-3.5 w-3/4 rounded bg-surface-variant" />
                        <div className="h-3 w-1/2 rounded bg-surface-variant" />
                      </div>
                      <div className="h-5 w-12 rounded bg-surface-variant shrink-0" />
                    </div>
                  ))}
                </div>
              ) : listQuery.isError ? (
                <div className="m-2 p-4 rounded-lg bg-status-error/10 border border-status-error/20 text-center">
                  <span className="material-symbols-outlined text-[32px] text-status-error mb-1">
                    error
                  </span>
                  <p className="text-label-md font-label-md text-status-error mb-3">
                    Couldn&apos;t load companies.
                  </p>
                  <button
                    type="button"
                    onClick={() => listQuery.refetch()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-error/10 text-status-error text-label-sm font-label-sm hover:bg-status-error/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      refresh
                    </span>
                    Retry
                  </button>
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-16 text-text-secondary">
                  <span className="material-symbols-outlined text-[40px] mb-2 opacity-50">
                    search_off
                  </span>
                  <p className="text-label-md font-label-md">No companies found</p>
                </div>
              ) : (
                companies.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setPickedId(c.id)}
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
                        {initialsOf(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-body-md text-text-primary truncate">
                          {c.name}
                        </p>
                        <p className="text-label-sm font-label-sm text-text-secondary truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            schedule
                          </span>
                          {formatDate(c.lastContacted)}
                        </p>
                      </div>
                      <StatusBadge tone="neutral" className="shrink-0">
                        {c.logCount} {c.logCount === 1 ? "log" : "logs"}
                      </StatusBadge>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT: detail panel */}
          <section className="lg:col-span-7 xl:col-span-8 space-y-6">
            {!selectedId ? (
              <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 py-24 text-center text-text-secondary">
                <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                  contacts
                </span>
                <p className="text-title-md font-title-md">
                  Select a company to view its contact history
                </p>
              </div>
            ) : detailQuery.isPending ? (
              <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6 animate-pulse space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-surface-variant" />
                  <div className="space-y-2">
                    <div className="h-5 w-48 rounded bg-surface-variant" />
                    <div className="h-3.5 w-32 rounded bg-surface-variant" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-lg bg-surface-variant" />
                  ))}
                </div>
              </div>
            ) : detailQuery.isError ? (
              <div className="bg-surface-container-lowest rounded-xl border border-status-error/20 elevation-1 p-8 text-center">
                <span className="material-symbols-outlined text-[40px] text-status-error mb-2">
                  error
                </span>
                <p className="text-title-md font-title-md text-status-error mb-1">
                  Couldn&apos;t load this company
                </p>
                <p className="text-label-md font-label-md text-text-secondary mb-4">
                  Something went wrong fetching the contact history.
                </p>
                <button
                  type="button"
                  onClick={() => detailQuery.refetch()}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-status-error/10 text-status-error text-label-md font-label-md hover:bg-status-error/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    refresh
                  </span>
                  Retry
                </button>
              </div>
            ) : !detail ? (
              <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 py-24 text-center text-text-secondary">
                <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                  contacts
                </span>
                <p className="text-title-md font-title-md">
                  No contact details available
                </p>
              </div>
            ) : (
              <>
                {/* Last Contacted summary */}
                <div className="bg-surface-container-lowest rounded-xl border border-surface-border elevation-1 p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-surface-container-highest rounded-xl flex items-center justify-center text-title-lg font-bold text-navy-vibrant shrink-0">
                        {initialsOf(detail.company.name)}
                      </div>
                      <div>
                        <h3 className="text-title-lg font-title-lg text-text-primary">
                          {detail.company.name}
                        </h3>
                        <p className="text-label-md font-label-md text-text-secondary">
                          {detail.company.industry ?? "—"}
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
                  {lastEntry ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-surface-container-low p-3 rounded-lg">
                        <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                          POC
                        </span>
                        <span className="text-label-md font-label-md font-medium text-on-surface">
                          {lastEntry.contactName}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-lg">
                        <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                          Designation
                        </span>
                        <span className="text-label-md font-label-md font-medium text-on-surface">
                          {lastEntry.designation ?? "—"}
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
                          {CHANNEL_LABEL[lastEntry.channel]}
                        </span>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-lg">
                        <span className="block text-label-sm font-label-sm text-text-secondary mb-1">
                          Date
                        </span>
                        <span className="text-label-md font-label-md font-medium text-on-surface">
                          {formatDate(lastEntry.contactedOn)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-label-md font-label-md text-text-secondary">
                      No contact logged yet.
                    </p>
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
                  {detail.history.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      <span className="material-symbols-outlined text-[36px] mb-1 opacity-50">
                        forum
                      </span>
                      <p className="text-label-md font-label-md">
                        No interactions recorded yet.
                      </p>
                    </div>
                  ) : (
                    <Timeline>
                      {detail.history.map((entry) => (
                        <TimelineItem
                          key={entry.id}
                          dotClassName={cn(
                            "-left-[5px] top-1.5 w-2.5 h-2.5 rounded-full",
                            CHANNEL_DOT[entry.channel]
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-body-md font-body-md text-text-primary font-medium">
                                {entry.contactName}
                              </span>
                              <span className="text-label-sm font-label-sm text-text-secondary">
                                {entry.designation ?? "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                tone={CHANNEL_TONE[entry.channel]}
                                icon={CHANNEL_ICON[entry.channel]}
                              >
                                {CHANNEL_LABEL[entry.channel]}
                              </StatusBadge>
                              <span className="text-label-sm font-label-sm text-text-secondary">
                                {formatDate(entry.contactedOn)}
                              </span>
                            </div>
                          </div>
                          <p className="text-body-md font-body-md text-text-secondary mt-1">
                            {entry.note ?? "No note added."}
                          </p>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  )}
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
                            setFormChannel(e.target.value as ContactChannelApi)
                          }
                          className="w-full appearance-none px-3 pr-9 py-2 bg-surface-container-low border border-surface-border rounded-lg text-body-md font-body-md text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
                        >
                          {CHANNELS.map((ch) => (
                            <option key={ch} value={ch}>
                              {CHANNEL_LABEL[ch]}
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

                  {addContact.isError && (
                    <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-status-error/10 border border-status-error/20">
                      <span className="material-symbols-outlined text-[18px] text-status-error">
                        error
                      </span>
                      <p className="text-label-md font-label-md text-status-error">
                        Couldn&apos;t save the contact. Please try again.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end mt-5">
                    <button
                      type="submit"
                      disabled={addContact.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200 btn-primary text-on-primary shadow-sm hover:shadow-md hover:scale-[1.02] px-6 py-2 text-label-md font-label-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-sm"
                    >
                      <span className="material-symbols-outlined">
                        {addContact.isPending ? "progress_activity" : "save"}
                      </span>
                      {addContact.isPending ? "Saving..." : "Save Contact"}
                    </button>
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
