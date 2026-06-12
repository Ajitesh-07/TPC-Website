// Mock data for the Super Admin "Audit Security Log" page. Read-only.
// Replace with live audit-trail data later.
import type { BadgeTone } from "@/components/ui/StatusBadge";

export type AuditType = "Data Edit" | "Export" | "Role Change" | "Login" | "Policy";

export interface AuditEntry {
  id: string;
  /** ISO-ish timestamp, e.g. "2026-06-12 14:32". Rendered as date + time. */
  timestamp: string;
  actorName: string;
  actorInitials: string;
  actorRole: string;
  type: AuditType;
  /** The affected record / entity. */
  target: string;
  /** Short human-readable description of the action. */
  details: string;
  /** Origin of the action (IP / app surface). */
  source?: string;
}

/** Each audit type mapped to a StatusBadge tone for colour-coding. */
export const AUDIT_TYPE_TONE: Record<AuditType, BadgeTone> = {
  "Data Edit": "warning",
  Export: "info",
  "Role Change": "shortlisted",
  Login: "neutral",
  Policy: "error",
};

/** Material Symbols icon per audit type (used in the table chip). */
export const AUDIT_TYPE_ICON: Record<AuditType, string> = {
  "Data Edit": "edit_note",
  Export: "download",
  "Role Change": "manage_accounts",
  Login: "login",
  Policy: "policy",
};

export const AUDIT_FILTERS: { key: AuditType | "all"; label: string }[] = [
  { key: "all", label: "All Actions" },
  { key: "Data Edit", label: "Data Edit" },
  { key: "Export", label: "Export" },
  { key: "Role Change", label: "Role Change" },
  { key: "Login", label: "Login" },
  { key: "Policy", label: "Policy" },
];

// Newest first.
export const AUDIT_LOGS: AuditEntry[] = [
  {
    id: "a01",
    timestamp: "2026-06-12 14:32",
    actorName: "Priya Nair",
    actorInitials: "PN",
    actorRole: "Super Admin",
    type: "Export",
    target: "Student Master Sheet (2025 batch)",
    details: "Exported full placement dataset (842 rows) to XLSX.",
    source: "10.12.4.21",
  },
  {
    id: "a02",
    timestamp: "2026-06-12 13:58",
    actorName: "Arjun Mehta",
    actorInitials: "AM",
    actorRole: "Admin",
    type: "Role Change",
    target: "Sneha Reddy (2101CS44)",
    details: "Promoted Student to Placement Coordinator.",
    source: "10.12.4.08",
  },
  {
    id: "a03",
    timestamp: "2026-06-12 13:40",
    actorName: "Kavya Iyer",
    actorInitials: "KI",
    actorRole: "Coordinator",
    type: "Data Edit",
    target: "Drive #DV-204 (DE Shaw)",
    details: "Updated shortlist for online assessment round.",
    source: "10.12.5.17",
  },
  {
    id: "a04",
    timestamp: "2026-06-12 12:15",
    actorName: "Rohan Gupta",
    actorInitials: "RG",
    actorRole: "Admin",
    type: "Policy",
    target: "Rahul Verma (2101ME12)",
    details: "Blocked profile for unauthorised CGPA edit attempt.",
    source: "10.12.4.08",
  },
  {
    id: "a05",
    timestamp: "2026-06-12 11:47",
    actorName: "Priya Nair",
    actorInitials: "PN",
    actorRole: "Super Admin",
    type: "Login",
    target: "Admin Console",
    details: "Successful login via institute SSO.",
    source: "10.12.4.21",
  },
  {
    id: "a06",
    timestamp: "2026-06-12 10:22",
    actorName: "Ananya Singh",
    actorInitials: "AS",
    actorRole: "Coordinator",
    type: "Data Edit",
    target: "Aarav Sharma (2101CS01)",
    details: "Verified 6th semester grade sheet and unlocked profile.",
    source: "10.12.5.04",
  },
  {
    id: "a07",
    timestamp: "2026-06-12 09:55",
    actorName: "Vikram Patel",
    actorInitials: "VP",
    actorRole: "Admin",
    type: "Export",
    target: "Company Contacts (Q2 2026)",
    details: "Exported recruiter HR contact list (156 rows) to CSV.",
    source: "10.12.4.11",
  },
  {
    id: "a08",
    timestamp: "2026-06-11 18:09",
    actorName: "Meera Krishnan",
    actorInitials: "MK",
    actorRole: "Admin",
    type: "Role Change",
    target: "Vikram Patel",
    details: "Granted Export permission to Admin role.",
    source: "10.12.4.11",
  },
  {
    id: "a09",
    timestamp: "2026-06-11 16:41",
    actorName: "Aditya Rao",
    actorInitials: "AR",
    actorRole: "Coordinator",
    type: "Data Edit",
    target: "Drive #DV-198 (Oracle India)",
    details: "Edited application deadline from 11 Jun to 13 Jun.",
    source: "10.12.5.22",
  },
  {
    id: "a10",
    timestamp: "2026-06-11 15:03",
    actorName: "Sneha Reddy",
    actorInitials: "SR",
    actorRole: "Coordinator",
    type: "Login",
    target: "Coordinator Portal",
    details: "Login from new device (flagged for review).",
    source: "10.12.5.44",
  },
  {
    id: "a11",
    timestamp: "2026-06-11 12:30",
    actorName: "Priya Nair",
    actorInitials: "PN",
    actorRole: "Super Admin",
    type: "Policy",
    target: "Data Retention Policy",
    details: "Updated student data retention window to 24 months.",
    source: "10.12.4.21",
  },
  {
    id: "a12",
    timestamp: "2026-06-11 11:12",
    actorName: "Arjun Mehta",
    actorInitials: "AM",
    actorRole: "Admin",
    type: "Data Edit",
    target: "Diya Patel (2101EE45)",
    details: "Adjusted placement credits (+150) after appeal.",
    source: "10.12.4.08",
  },
  {
    id: "a13",
    timestamp: "2026-06-11 09:48",
    actorName: "Karthik Menon",
    actorInitials: "KM",
    actorRole: "Admin",
    type: "Export",
    target: "Offer Letters Archive",
    details: "Downloaded 38 verified offer letters as ZIP.",
    source: "10.12.4.19",
  },
  {
    id: "a14",
    timestamp: "2026-06-10 17:26",
    actorName: "Meera Krishnan",
    actorInitials: "MK",
    actorRole: "Admin",
    type: "Login",
    target: "Admin Console",
    details: "Failed login attempt (incorrect OTP), then succeeded.",
    source: "10.12.4.15",
  },
  {
    id: "a15",
    timestamp: "2026-06-10 14:50",
    actorName: "Priya Nair",
    actorInitials: "PN",
    actorRole: "Super Admin",
    type: "Role Change",
    target: "Ishaan Joshi",
    details: "Revoked Coordinator access (semester rotation ended).",
    source: "10.12.4.21",
  },
  {
    id: "a16",
    timestamp: "2026-06-10 13:14",
    actorName: "Ananya Singh",
    actorInitials: "AS",
    actorRole: "Coordinator",
    type: "Policy",
    target: "Drive #DV-187 (Samsung R&D)",
    details: "Locked drive applications after eligibility breach reported.",
    source: "10.12.5.04",
  },
  {
    id: "a17",
    timestamp: "2026-06-10 10:02",
    actorName: "Vikram Patel",
    actorInitials: "VP",
    actorRole: "Admin",
    type: "Data Edit",
    target: "Recruiter: Atlassian",
    details: "Updated primary HR contact and JAF status.",
    source: "10.12.4.11",
  },
];
