"use client";

import { useEffect, useRef, useState } from "react";
import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
import { useRole } from "@/components/providers/RoleProvider";
import {
  useAddVisitingMember,
  useLogistics,
  useRemoveVisitingMember,
  useSaveLogistics,
} from "@/lib/hooks";
import type {
  LogisticsRequestApi,
  LogisticsResponse,
  LogisticsUpdatePayload,
  VisitingMemberApi,
} from "@/lib/api-types";
import {
  VENUE_OPTIONS,
  DIETARY_OPTIONS,
} from "@/data/logistics";

const FORM_INPUT =
  "w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline";

const FORM_TEXTAREA =
  "w-full bg-transparent border border-outline-variant rounded-lg px-4 py-4 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-0 transition-colors relative z-0 placeholder:text-outline resize-none";

const FLOATING_LABEL =
  "absolute -top-2.5 left-3 bg-surface px-1.5 text-label-sm font-label-sm text-text-secondary z-10 tracking-wide uppercase";

const SELECT_CHEVRON =
  "appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat pr-10";

const AVATAR_TONES = [
  "bg-primary-fixed text-primary",
  "bg-secondary-fixed text-on-secondary-fixed",
  "bg-tertiary-fixed text-on-tertiary-fixed",
  "bg-navy-vibrant/10 text-navy-vibrant",
];

// ---------- local display helpers ----------

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** ISO / "YYYY-MM-DD" → "Jul 14, 2026". */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

/** "14:30" → "2:30 PM". */
function formatTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Schedule slot time window in display style. */
function formatTimeRange(
  startTime: string | null,
  endTime: string | null
): string {
  if (startTime && endTime) return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  if (startTime) return `${formatTime(startTime)} onwards`;
  return "All day";
}

/** "Ananya Krishnan" → "AK" (first letters of the first two words). */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}

type ScheduleEntryApi = LogisticsResponse["schedule"][number];

/** Editable mirror of the logistics request (id stripped). */
type RequestForm = LogisticsUpdatePayload;

/** Map a loaded request into editable form state, defaulting nullable fields. */
function toForm(req: LogisticsRequestApi): RequestForm {
  return {
    accommodationRequired: req.accommodationRequired,
    roomsRequired: req.roomsRequired,
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    dietaryPreference: req.dietaryPreference,
    specialRequests: req.specialRequests,
    venuePreference: req.venuePreference,
    systemsRequired: req.systemsRequired,
    projectorRequired: req.projectorRequired,
    internetRequired: req.internetRequired,
    technicalNotes: req.technicalNotes,
  };
}

/** ISO / "YYYY-MM-DD" → "YYYY-MM-DD" for date inputs (local time). */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Empty member form. */
const EMPTY_MEMBER = { name: "", designation: "", phone: "", email: "" };

/** Card section wrapper: title + icon + optional action, then content. */
function SectionCard({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface rounded-xl border border-surface-border p-5 md:p-6 elevation-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-lg shrink-0">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
          <div>
            <h2 className="text-title-lg font-title-lg text-text-primary">
              {title}
            </h2>
            {description && (
              <p className="text-label-md font-label-md text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Reusable on/off pill toggle. */
function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-primary" : "bg-surface-variant"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-surface shadow-sm transform transition-transform",
          on ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

const SCHEDULE_COLUMNS: Column<ScheduleEntryApi>[] = [
  {
    header: "Event",
    className: "px-4 py-3 font-medium text-text-primary",
    render: (s) => s.title,
  },
  {
    header: "Date",
    className: "px-4 py-3 text-text-secondary whitespace-nowrap",
    render: (s) => formatDate(s.eventDate),
  },
  {
    header: "Time",
    className: "px-4 py-3 text-text-secondary whitespace-nowrap",
    render: (s) => formatTimeRange(s.startTime, s.endTime),
  },
  {
    header: "Venue",
    className: "px-4 py-3 text-text-secondary",
    render: (s) => s.location ?? "To be announced",
  },
  {
    header: "Status",
    headerClassName: "text-right",
    className: "px-4 py-3 text-right",
    render: () => (
      <StatusBadge tone="success" icon="check_circle" className="px-2 py-1 rounded">
        Confirmed
      </StatusBadge>
    ),
  },
];

const LogisticsPage = () => {
  const { user } = useRole();
  const { data, isLoading, isError, error, refetch } = useLogistics();

  const saveLogistics = useSaveLogistics();
  const addMember = useAddVisitingMember();
  const removeMember = useRemoveVisitingMember();

  // ---- controlled request form (seeded once from the loaded request) ----
  const [form, setForm] = useState<RequestForm | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!data || hydrated.current) return;
    hydrated.current = true;
    setForm(toForm(data.request));
  }, [data]);

  // ---- add-member inline form ----
  const [showAddMember, setShowAddMember] = useState(false);
  const [member, setMember] = useState(EMPTY_MEMBER);

  // ---- save banner ----
  const [banner, setBanner] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);

  const patch = (next: Partial<RequestForm>) =>
    setForm((prev) => (prev ? { ...prev, ...next } : prev));

  const submitMember = () => {
    if (!member.name.trim()) return;
    addMember.mutate(
      {
        name: member.name.trim(),
        designation: member.designation.trim() || undefined,
        phone: member.phone.trim() || undefined,
        email: member.email.trim() || undefined,
      },
      {
        onSuccess: () => {
          setMember(EMPTY_MEMBER);
          setShowAddMember(false);
        },
      }
    );
  };

  const save = () => {
    if (!form) return;
    setBanner(null);
    saveLogistics.mutate(form, {
      onSuccess: () => setBanner({ kind: "success", text: "Logistics requests saved." }),
      onError: (err) =>
        setBanner({
          kind: "error",
          text:
            err instanceof Error
              ? `Couldn't save — ${err.message}`
              : "Couldn't save your requests.",
        }),
    });
  };

  // ---------- loading ----------
  if (isLoading || (!data && !isError)) {
    return (
      <>
        <PortalHeader
          title="Logistics"
          subtitle="Coordinate your campus visit details with the placement cell."
          innerClassName="max-w-container-max mx-auto w-full"
        />
        <div className="px-gutter-mobile md:px-gutter-desktop py-8 md:py-10 max-w-container-max mx-auto w-full">
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-56 rounded-xl bg-surface-variant" />
            <div className="h-72 rounded-xl bg-surface-variant" />
            <div className="h-72 rounded-xl bg-surface-variant" />
            <div className="h-56 rounded-xl bg-surface-variant" />
          </div>
        </div>
      </>
    );
  }

  // ---------- error ----------
  if (isError || !data) {
    return (
      <>
        <PortalHeader
          title="Logistics"
          subtitle="Coordinate your campus visit details with the placement cell."
          innerClassName="max-w-container-max mx-auto w-full"
        />
        <div className="px-gutter-mobile md:px-gutter-desktop py-8 md:py-10 max-w-container-max mx-auto w-full">
          <div className="bg-status-error/10 border border-status-error/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-body-md font-body-md text-status-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">error</span>
              Couldn&apos;t load your logistics
              {error instanceof Error ? ` — ${error.message}` : ""}.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg border border-status-error/30 text-status-error text-label-md font-label-md hover:bg-status-error/10 transition-colors shrink-0 self-start sm:self-auto"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  const { team, schedule } = data;
  // Until the effect seeds it, mirror the loaded request so inputs stay controlled.
  const f = form ?? toForm(data.request);
  const accommodation = f.accommodationRequired;
  const saving = saveLogistics.isPending;

  return (
    <>
      <PortalHeader
        title="Logistics"
        subtitle="Coordinate your campus visit details with the placement cell."
        innerClassName="max-w-container-max mx-auto w-full"
        actions={
          <div className="flex items-center gap-2 bg-surface-container-low border border-surface-border rounded-full px-3 py-1.5">
            <span className="material-symbols-outlined text-[18px] text-gold-leaf">
              business_center
            </span>
            <span className="text-label-md font-label-md text-text-primary">
              {user?.fullName ?? "Recruiter"}
            </span>
          </div>
        }
      />

      {/* Content */}
      <div className="px-gutter-mobile md:px-gutter-desktop py-8 md:py-10 max-w-container-max mx-auto w-full animate-fadeIn">
        <div className="flex flex-col gap-6 pb-28">
          {/* 2. Visiting Team */}
          <SectionCard
            icon="groups"
            title="Visiting Team"
            description="Recruiters and panelists travelling to campus for the drive."
            action={
              <button
                type="button"
                onClick={() => setShowAddMember((v) => !v)}
                className="inline-flex items-center gap-2 bg-surface-container-lowest border border-surface-border text-text-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:border-primary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                Add Member
              </button>
            }
          >
            {showAddMember && (
              <div className="mb-5 border border-surface-border rounded-xl p-4 bg-surface-container-low/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <input
                    className={FORM_INPUT}
                    placeholder="Full name"
                    value={member.name}
                    onChange={(e) => setMember((m) => ({ ...m, name: e.target.value }))}
                  />
                  <input
                    className={FORM_INPUT}
                    placeholder="Designation"
                    value={member.designation}
                    onChange={(e) =>
                      setMember((m) => ({ ...m, designation: e.target.value }))
                    }
                  />
                  <input
                    className={FORM_INPUT}
                    placeholder="Phone"
                    value={member.phone}
                    onChange={(e) => setMember((m) => ({ ...m, phone: e.target.value }))}
                  />
                  <input
                    className={FORM_INPUT}
                    type="email"
                    placeholder="Email"
                    value={member.email}
                    onChange={(e) => setMember((m) => ({ ...m, email: e.target.value }))}
                  />
                </div>
                {addMember.isError && (
                  <p className="mt-3 text-label-sm font-label-sm text-status-error flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {addMember.error instanceof Error
                      ? addMember.error.message
                      : "Couldn't add member."}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMember(false);
                      setMember(EMPTY_MEMBER);
                    }}
                    className="px-4 py-2 rounded-lg border border-surface-border text-text-secondary text-label-md font-label-md hover:bg-surface-container-low transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitMember}
                    disabled={!member.name.trim() || addMember.isPending}
                    className="px-4 py-2 rounded-lg btn-gradient text-on-primary text-label-md font-label-md disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    {addMember.isPending ? "Adding…" : "Add Member"}
                  </button>
                </div>
              </div>
            )}

            {team.length === 0 ? (
              <div className="border border-dashed border-surface-border rounded-xl bg-surface/50 p-8 text-center">
                <span className="material-symbols-outlined text-[28px] text-text-secondary block mb-2">
                  groups
                </span>
                <p className="text-body-md font-body-md text-text-primary">
                  No team members added yet
                </p>
                <p className="text-label-sm font-label-sm text-text-secondary mt-1">
                  Add the recruiters and panelists travelling to campus.
                </p>
              </div>
            ) : (
              <div className="border border-surface-border rounded-xl overflow-hidden">
                <DataTable
                  columns={teamColumns(removeMember.mutate, removeMember.isPending)}
                  rows={team}
                  theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                  thClassName="px-4 py-3 font-semibold text-left"
                  rowClassName={() =>
                    "border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md"
                  }
                />
              </div>
            )}
            {removeMember.isError && (
              <p className="mt-3 text-label-sm font-label-sm text-status-error flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {removeMember.error instanceof Error
                  ? removeMember.error.message
                  : "Couldn't remove member."}
              </p>
            )}
          </SectionCard>

          {/* 3. Hospitality & Dietary Requests */}
          <SectionCard
            icon="hotel"
            title="Hospitality & Dietary Requests"
            description="Accommodation and catering preferences for the visiting team."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <div className="md:col-span-2 flex items-center justify-between border border-surface-border rounded-lg px-4 py-3.5 bg-surface-container-low/50">
                <div>
                  <p className="text-body-md font-body-md text-text-primary font-medium">
                    Accommodation Required
                  </p>
                  <p className="text-label-sm font-label-sm text-text-secondary">
                    Guest house / hotel arranged via the placement cell.
                  </p>
                </div>
                <Toggle
                  on={accommodation}
                  onChange={(v) => patch({ accommodationRequired: v })}
                  label="Accommodation required"
                />
              </div>

              <div className="relative input-glow">
                <label className={FLOATING_LABEL} htmlFor="rooms">
                  Number of Rooms
                </label>
                <input
                  className={FORM_INPUT}
                  id="rooms"
                  type="number"
                  min={0}
                  placeholder="e.g. 3"
                  value={f.roomsRequired ?? ""}
                  onChange={(e) =>
                    patch({
                      roomsRequired: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  disabled={!accommodation}
                />
              </div>

              <div className="relative input-glow">
                <label className={FLOATING_LABEL} htmlFor="diet">
                  Dietary Preference
                </label>
                <select
                  className={cn(FORM_INPUT, SELECT_CHEVRON)}
                  id="diet"
                  value={f.dietaryPreference ?? ""}
                  onChange={(e) =>
                    patch({ dietaryPreference: e.target.value || null })
                  }
                >
                  <option disabled value="">
                    Select preference
                  </option>
                  {DIETARY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative input-glow">
                <label className={FLOATING_LABEL} htmlFor="checkin">
                  Check-in Date
                </label>
                <input
                  className={FORM_INPUT}
                  id="checkin"
                  type="date"
                  value={toDateInput(f.checkIn)}
                  onChange={(e) => patch({ checkIn: e.target.value || null })}
                  disabled={!accommodation}
                />
              </div>

              <div className="relative input-glow">
                <label className={FLOATING_LABEL} htmlFor="checkout">
                  Check-out Date
                </label>
                <input
                  className={FORM_INPUT}
                  id="checkout"
                  type="date"
                  value={toDateInput(f.checkOut)}
                  onChange={(e) => patch({ checkOut: e.target.value || null })}
                  disabled={!accommodation}
                />
              </div>

              <div className="relative input-glow md:col-span-2">
                <label className={FLOATING_LABEL} htmlFor="special_requests">
                  Special Requests
                </label>
                <textarea
                  className={FORM_TEXTAREA}
                  id="special_requests"
                  rows={3}
                  placeholder="Airport pickup, early check-in, allergy notes, etc."
                  value={f.specialRequests ?? ""}
                  onChange={(e) => patch({ specialRequests: e.target.value || null })}
                />
              </div>
            </div>
          </SectionCard>

          {/* 4. Technical & Venue Requests */}
          <SectionCard
            icon="settings_input_hdmi"
            title="Technical & Venue Requests"
            description="Venue, systems, and AV requirements for on-campus rounds."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <div className="relative input-glow">
                <label className={FLOATING_LABEL} htmlFor="venue">
                  Venue Preference
                </label>
                <select
                  className={cn(FORM_INPUT, SELECT_CHEVRON)}
                  id="venue"
                  value={f.venuePreference ?? ""}
                  onChange={(e) => patch({ venuePreference: e.target.value || null })}
                >
                  <option disabled value="">
                    Select venue
                  </option>
                  {VENUE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative input-glow">
                <label className={FLOATING_LABEL} htmlFor="systems">
                  Systems Needed
                </label>
                <input
                  className={FORM_INPUT}
                  id="systems"
                  type="number"
                  min={0}
                  placeholder="e.g. 60"
                  value={f.systemsRequired ?? ""}
                  onChange={(e) =>
                    patch({
                      systemsRequired:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between border border-surface-border rounded-lg px-4 py-3.5 bg-surface-container-low/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-text-secondary">
                    cast
                  </span>
                  <span className="text-body-md font-body-md text-text-primary font-medium">
                    Projector / AV
                  </span>
                </div>
                <Toggle
                  on={f.projectorRequired}
                  onChange={(v) => patch({ projectorRequired: v })}
                  label="Projector / AV"
                />
              </div>

              <div className="flex items-center justify-between border border-surface-border rounded-lg px-4 py-3.5 bg-surface-container-low/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-text-secondary">
                    lan
                  </span>
                  <span className="text-body-md font-body-md text-text-primary font-medium">
                    Internet / LAN
                  </span>
                </div>
                <Toggle
                  on={f.internetRequired}
                  onChange={(v) => patch({ internetRequired: v })}
                  label="Internet / LAN"
                />
              </div>

              <div className="relative input-glow md:col-span-2">
                <label className={FLOATING_LABEL} htmlFor="tech_notes">
                  Additional Technical Notes
                </label>
                <textarea
                  className={FORM_TEXTAREA}
                  id="tech_notes"
                  rows={3}
                  placeholder="Specific software, OS, network whitelisting, seating layout, etc."
                  value={f.technicalNotes ?? ""}
                  onChange={(e) => patch({ technicalNotes: e.target.value || null })}
                />
              </div>
            </div>
          </SectionCard>

          {/* 5. Finalised Schedule Viewer (read-only) */}
          <SectionCard
            icon="event_available"
            title="Finalised Schedule"
            description="Confirmed by the placement cell. Read-only."
            action={
              <StatusBadge tone="success" icon="lock" className="px-2 py-1 rounded">
                Locked
              </StatusBadge>
            }
          >
            {schedule.length === 0 ? (
              <div className="border border-dashed border-surface-border rounded-xl bg-surface/50 p-8 text-center">
                <span className="material-symbols-outlined text-[28px] text-text-secondary block mb-2">
                  event_busy
                </span>
                <p className="text-body-md font-body-md text-text-primary">
                  No schedule finalised yet
                </p>
                <p className="text-label-sm font-label-sm text-text-secondary mt-1">
                  The placement cell will publish your confirmed campus-visit
                  slots here.
                </p>
              </div>
            ) : (
              <div className="border border-surface-border rounded-xl overflow-hidden">
                <DataTable
                  columns={SCHEDULE_COLUMNS}
                  rows={schedule}
                  theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                  thClassName="px-4 py-3 font-semibold text-left"
                  rowClassName={() =>
                    "border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md"
                  }
                />
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Sticky footer action row */}
      <div className="sticky bottom-0 z-20 border-t border-surface-border bg-surface/90 backdrop-blur-md px-gutter-mobile md:px-gutter-desktop py-4">
        <div className="max-w-container-max mx-auto w-full flex flex-wrap items-center justify-end gap-3">
          {banner && (
            <p
              className={cn(
                "mr-auto flex items-center gap-1.5 text-label-md font-label-md",
                banner.kind === "success" ? "text-status-success" : "text-status-error"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">
                {banner.kind === "success" ? "check_circle" : "error"}
              </span>
              {banner.text}
            </p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg border border-surface-border text-text-primary text-title-md font-title-md hover:bg-surface-container-low hover:border-outline-variant transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-gradient text-on-primary text-title-md font-title-md px-7 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            {saving ? "Submitting…" : "Submit Requests"}
          </button>
        </div>
      </div>
    </>
  );
};

/** Visiting-team columns, parameterised by the remove mutation. */
function teamColumns(
  remove: (id: string) => void,
  removing: boolean
): Column<VisitingMemberApi>[] {
  return [
    {
      header: "Member",
      className: "px-4 py-3",
      render: (m, i) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-label-sm font-label-sm font-semibold shrink-0",
              AVATAR_TONES[i % AVATAR_TONES.length]
            )}
          >
            {initialsOf(m.name)}
          </div>
          <span className="font-medium text-text-primary">{m.name}</span>
        </div>
      ),
    },
    {
      header: "Designation",
      className: "px-4 py-3 text-text-secondary",
      render: (m) => m.designation ?? "—",
    },
    {
      header: "Phone",
      className: "px-4 py-3 text-text-secondary whitespace-nowrap",
      render: (m) => m.phone ?? "—",
    },
    {
      header: "Email",
      className: "px-4 py-3 text-text-secondary",
      render: (m) =>
        m.email ? (
          <a
            href={`mailto:${m.email}`}
            className="text-primary hover:text-navy-vibrant hover:underline transition-colors"
          >
            {m.email}
          </a>
        ) : (
          "—"
        ),
    },
    {
      header: "",
      headerClassName: "text-right",
      className: "px-4 py-3 text-right",
      render: (m) => (
        <button
          type="button"
          onClick={() => remove(m.id)}
          disabled={removing}
          aria-label={`Remove ${m.name}`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-text-secondary hover:text-status-error hover:bg-status-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      ),
    },
  ];
}

export default LogisticsPage;
