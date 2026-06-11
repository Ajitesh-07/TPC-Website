// Mock data for the My Profile page. Replace with TanStack Query hooks later.

export interface LockedField {
  label: string;
  value: string;
  icon?: string;
  /** Text-colour token for the value (e.g. "text-status-success"). */
  tone?: string;
}

// Admin-controlled, read-only. Sourced from the verified master dataset.
export const LOCKED_FIELDS: LockedField[] = [
  { label: "Official Email", value: "aarav_2101cs02@iitp.ac.in" },
  { label: "Program", value: "B.Tech" },
  { label: "Branch", value: "Computer Science & Engineering" },
  { label: "Batch", value: "2021 – 2025" },
  { label: "CPI (Current)", value: "8.92" },
  { label: "Backlog Status", value: "No Active Backlogs", icon: "check_circle", tone: "text-status-success" },
  { label: "Placement Status", value: "Unplaced" },
  { label: "Placement Credits", value: "100", icon: "toll", tone: "text-primary" },
  { label: "B.Tech Status", value: "Verified", icon: "verified", tone: "text-status-success" },
];

export type RequestStatus = "Pending" | "Approved" | "Rejected";

export const REQUEST_STYLES: Record<RequestStatus, string> = {
  Pending: "bg-status-warning/10 text-status-warning border-status-warning/20",
  Approved: "bg-status-success/10 text-status-success border-status-success/20",
  Rejected: "bg-error-container text-on-error-container border-error/20",
};

export interface CorrectionRequest {
  field: string;
  detail: string;
  status: RequestStatus;
  submitted: string;
}

export const CORRECTION_REQUESTS: CorrectionRequest[] = [
  { field: "CPI Update Request", detail: "Requested change from 8.85 to 8.92 based on sem 5 results.", status: "Pending", submitted: "2 days ago" },
  { field: "Branch Correction", detail: "Corrected branch label to Computer Science & Engineering.", status: "Approved", submitted: "Sep 20, 2024" },
];

export interface EditableField {
  id: string;
  label: string;
  type: string;
  defaultValue?: string;
  placeholder?: string;
}

export const CONTACT_FIELDS: EditableField[] = [
  { id: "phone", label: "Phone Number", type: "tel", defaultValue: "+91 98765 43210" },
  { id: "alt-email", label: "Alternate Email", type: "email", defaultValue: "aarav.sharma@example.com" },
  { id: "location", label: "Preferred Location", type: "text", defaultValue: "Bangalore, Hyderabad, Remote" },
];

export const LINK_FIELDS: EditableField[] = [
  { id: "linkedin", label: "LinkedIn Profile URL", type: "url", defaultValue: "https://linkedin.com/in/aaravsharma" },
  { id: "github", label: "GitHub / Portfolio URL", type: "url", defaultValue: "https://github.com/aaravsharma" },
];
