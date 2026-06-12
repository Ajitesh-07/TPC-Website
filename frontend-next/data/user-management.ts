// Mock data for the super-admin "User Role Management" page.
//
// Role option labels are hardcoded here (mirroring lib/roles.ts ROLE_META) so
// this module stays self-contained — when real auth/roles land, source these
// from the central role model instead.

export interface RoleOption {
  value: string;
  label: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { value: "student", label: "Student" },
  { value: "company", label: "Company" },
  { value: "coordinator", label: "Coordinator" },
  { value: "admin", label: "Admin" },
  { value: "super-admin", label: "Super Admin" },
];

export interface ManagedUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  status: "Active" | "Revoked";
}

export const MANAGED_USERS: ManagedUser[] = [
  { id: "u1", name: "Aarav Sharma", initials: "AS", email: "aarav.sharma@iitp.ac.in", role: "student", status: "Active" },
  { id: "u2", name: "Diya Patel", initials: "DP", email: "diya.patel@iitp.ac.in", role: "coordinator", status: "Active" },
  { id: "u3", name: "Rohan Gupta", initials: "RG", email: "rohan.gupta@iitp.ac.in", role: "student", status: "Revoked" },
  { id: "u4", name: "Ananya Iyer", initials: "AI", email: "ananya.iyer@iitp.ac.in", role: "admin", status: "Active" },
  { id: "u5", name: "Vikram Reddy", initials: "VR", email: "hr@infosys.com", role: "company", status: "Active" },
  { id: "u6", name: "Sneha Nair", initials: "SN", email: "sneha.nair@iitp.ac.in", role: "coordinator", status: "Active" },
  { id: "u7", name: "Arjun Mehta", initials: "AM", email: "arjun.mehta@iitp.ac.in", role: "student", status: "Active" },
  { id: "u8", name: "Priya Singh", initials: "PS", email: "priya.singh@iitp.ac.in", role: "super-admin", status: "Active" },
  { id: "u9", name: "Karthik Rao", initials: "KR", email: "talent@tcs.com", role: "company", status: "Revoked" },
  { id: "u10", name: "Meera Joshi", initials: "MJ", email: "meera.joshi@iitp.ac.in", role: "admin", status: "Active" },
];

export const APPROVED_EMAILS: string[] = [
  "@iitp.ac.in",
  "@students.iitp.ac.in",
  "placement@iitp.ac.in",
  "ccdc@iitp.ac.in",
  "web_ccdc@iitp.ac.in",
  "tpc.coordinators@iitp.ac.in",
];

export interface UploadRecord {
  id: string;
  fileName: string;
  type: string;
  uploadedBy: string;
  date: string;
  rows: number;
}

export const UPLOAD_HISTORY: UploadRecord[] = [
  { id: "f1", fileName: "students_2025_batch.csv", type: "Student Master", uploadedBy: "Priya Singh", date: "10 Jun 2026", rows: 842 },
  { id: "f2", fileName: "recruiters_active.xlsx", type: "Company Master", uploadedBy: "Ananya Iyer", date: "08 Jun 2026", rows: 156 },
  { id: "f3", fileName: "credit_ledger_q2.csv", type: "Credit Ledger", uploadedBy: "Meera Joshi", date: "01 Jun 2026", rows: 1248 },
  { id: "f4", fileName: "coordinators_list.csv", type: "Staff Master", uploadedBy: "Priya Singh", date: "28 May 2026", rows: 24 },
];
