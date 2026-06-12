"use client";

import { useState } from "react";
import PortalHeader from "@/components/ui/PortalHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";
import {
  VISITING_TEAM,
  FINALISED_SCHEDULE,
  VENUE_OPTIONS,
  DIETARY_OPTIONS,
  type VisitingMember,
  type ScheduleEntry,
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

/** Reusable on/off pill toggle (mock state only). */
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

const TEAM_COLUMNS: Column<VisitingMember>[] = [
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
          {m.initials}
        </div>
        <span className="font-medium text-text-primary">{m.name}</span>
      </div>
    ),
  },
  {
    header: "Designation",
    className: "px-4 py-3 text-text-secondary",
    render: (m) => m.designation,
  },
  {
    header: "Phone",
    className: "px-4 py-3 text-text-secondary whitespace-nowrap",
    render: (m) => m.phone,
  },
  {
    header: "Email",
    className: "px-4 py-3 text-text-secondary",
    render: (m) => (
      <a
        href={`mailto:${m.email}`}
        className="text-primary hover:text-navy-vibrant hover:underline transition-colors"
      >
        {m.email}
      </a>
    ),
  },
];

const SCHEDULE_COLUMNS: Column<ScheduleEntry>[] = [
  {
    header: "Event",
    className: "px-4 py-3 font-medium text-text-primary",
    render: (s) => s.title,
  },
  {
    header: "Date",
    className: "px-4 py-3 text-text-secondary whitespace-nowrap",
    render: (s) => s.date,
  },
  {
    header: "Time",
    className: "px-4 py-3 text-text-secondary whitespace-nowrap",
    render: (s) => s.time,
  },
  {
    header: "Venue",
    className: "px-4 py-3 text-text-secondary",
    render: (s) => s.venue,
  },
  {
    header: "Status",
    headerClassName: "text-right",
    className: "px-4 py-3 text-right",
    render: (s) => (
      <StatusBadge tone={s.status.tone} icon="check_circle" className="px-2 py-1 rounded">
        {s.status.label}
      </StatusBadge>
    ),
  },
];

const LogisticsPage = () => {
  const [accommodation, setAccommodation] = useState(true);
  const [projector, setProjector] = useState(true);
  const [lan, setLan] = useState(false);

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
              TechFlow Solutions Inc.
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
                className="inline-flex items-center gap-2 bg-surface-container-lowest border border-surface-border text-text-primary px-4 py-2 rounded-lg text-label-md font-label-md hover:border-primary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                Add Member
              </button>
            }
          >
            <div className="border border-surface-border rounded-xl overflow-hidden">
              <DataTable
                columns={TEAM_COLUMNS}
                rows={VISITING_TEAM}
                theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                thClassName="px-4 py-3 font-semibold text-left"
                rowClassName={() =>
                  "border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md"
                }
              />
            </div>
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
                  onChange={setAccommodation}
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
                  defaultValue={3}
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
                  defaultValue=""
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
                  defaultValue="2026-07-13"
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
                  defaultValue="2026-07-15"
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
                  defaultValue={VENUE_OPTIONS[0]}
                >
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
                  defaultValue={60}
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
                <Toggle on={projector} onChange={setProjector} label="Projector / AV" />
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
                <Toggle on={lan} onChange={setLan} label="Internet / LAN" />
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
            <div className="border border-surface-border rounded-xl overflow-hidden">
              <DataTable
                columns={SCHEDULE_COLUMNS}
                rows={FINALISED_SCHEDULE}
                theadClassName="bg-surface-container-low text-label-sm font-label-sm text-text-secondary uppercase tracking-wider"
                thClassName="px-4 py-3 font-semibold text-left"
                rowClassName={() =>
                  "border-b border-surface-variant last:border-b-0 hover:bg-surface-container-low transition-colors text-body-md font-body-md"
                }
              />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Sticky footer action row */}
      <div className="sticky bottom-0 z-20 border-t border-surface-border bg-surface/90 backdrop-blur-md px-gutter-mobile md:px-gutter-desktop py-4">
        <div className="max-w-container-max mx-auto w-full flex items-center justify-end gap-3">
          <button
            type="button"
            className="px-5 py-2.5 rounded-lg border border-surface-border text-text-primary text-title-md font-title-md hover:bg-surface-container-low hover:border-outline-variant transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Draft
          </button>
          <button
            type="button"
            className="btn-gradient text-on-primary text-title-md font-title-md px-7 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            Submit Requests
          </button>
        </div>
      </div>
    </>
  );
};

export default LogisticsPage;
