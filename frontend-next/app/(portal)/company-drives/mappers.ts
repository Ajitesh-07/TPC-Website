// Display mappers for the recruiter "My Drives" page: API enums → badge
// tones/labels/icons, plus tiny formatting helpers. Derived display fields
// live here per the API contract ("Requirements-audit deltas").
import type { BadgeTone } from "@/components/ui/StatusBadge";
import type {
  ApplicationStatusApi,
  DriveStatusApi,
  ProcessTypeApi,
  StageTypeApi,
} from "@/lib/api-types";

export const APP_STATUS_TONE: Record<ApplicationStatusApi, BadgeTone> = {
  applied: "applied",
  under_review: "info",
  shortlisted: "shortlisted",
  interview: "warning",
  offered: "success",
  accepted: "success",
  rejected: "rejected",
  withdrawn: "neutral",
};

export const APP_STATUS_LABEL: Record<ApplicationStatusApi, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/** Statuses a recruiter can set from the roster row. */
export const RECRUITER_SETTABLE_STATUSES: ApplicationStatusApi[] = [
  "applied",
  "under_review",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
];

export const DRIVE_STATUS_TONE: Record<DriveStatusApi, BadgeTone> = {
  open: "success",
  pending_approval: "warning",
  draft: "neutral",
  closed: "info",
  completed: "info",
  cancelled: "error",
};

export const DRIVE_STATUS_LABEL: Record<DriveStatusApi, string> = {
  open: "Open",
  pending_approval: "Pending Approval",
  draft: "Draft",
  closed: "Closed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROCESS_TYPE_LABEL: Record<ProcessTypeApi, string> = {
  internship: "Internship",
  six_month_fte: "6M + FTE",
  six_month_ppo: "6M + PPO",
  fte: "FTE",
};

/** Stage type → display label + Material Symbols icon for the dates grid. */
export const STAGE_META: Record<StageTypeApi, { label: string; icon: string }> = {
  registration: { label: "Registration", icon: "how_to_reg" },
  ppt: { label: "Pre-Placement Talk", icon: "co_present" },
  online_assessment: { label: "Online Assessment", icon: "quiz" },
  group_discussion: { label: "Group Discussion", icon: "forum" },
  shortlisting: { label: "Shortlisting", icon: "checklist" },
  interview: { label: "Interviews", icon: "groups" },
  offer: { label: "Results / Offers", icon: "emoji_events" },
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** ISO date/timestamp → "Oct 15, 2024". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

/** "Aarav Sharma" → "AS". */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}

/** CTC / stipend display for the summary grid. */
export function formatPay(ctcLpa: number | null, stipendPerMonth: number | null): string {
  if (ctcLpa != null) return `₹${ctcLpa} LPA`;
  if (stipendPerMonth != null)
    return `₹${stipendPerMonth.toLocaleString("en-IN")}/month`;
  return "—";
}
