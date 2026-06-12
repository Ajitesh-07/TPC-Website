// Mock data for the Super Admin "Global Database & Export" page.

export interface ExportStudent {
  id: string;
  roll: string;
  name: string;
  initials: string;
  branch: string;
  /** CPI out of 10, formatted (e.g. "8.92"). */
  cpi: string;
  placementStatus: string;
  blocked: boolean;
}

export const EXPORT_STUDENTS: ExportStudent[] = [
  { id: "s1", roll: "2101CS02", name: "Aarav Sharma", initials: "AS", branch: "CSE", cpi: "8.92", placementStatus: "Placed", blocked: false },
  { id: "s2", roll: "2101EE14", name: "Diya Patel", initials: "DP", branch: "EE", cpi: "9.14", placementStatus: "Placed", blocked: false },
  { id: "s3", roll: "2101CS27", name: "Rohan Verma", initials: "RV", branch: "CSE", cpi: "8.45", placementStatus: "Unplaced", blocked: false },
  { id: "s4", roll: "2101ME08", name: "Ananya Iyer", initials: "AI", branch: "ME", cpi: "7.98", placementStatus: "Higher Studies", blocked: false },
  { id: "s5", roll: "2101EC19", name: "Kabir Singh", initials: "KS", branch: "ECE", cpi: "8.71", placementStatus: "Placed", blocked: false },
  { id: "s6", roll: "2101CS41", name: "Meera Nair", initials: "MN", branch: "CSE", cpi: "9.32", placementStatus: "Placed", blocked: false },
  { id: "s7", roll: "2101CE05", name: "Arjun Reddy", initials: "AR", branch: "CE", cpi: "8.10", placementStatus: "Unplaced", blocked: false },
  { id: "s8", roll: "2101EE31", name: "Sara Khan", initials: "SK", branch: "EE", cpi: "7.62", placementStatus: "Unplaced", blocked: true },
  { id: "s9", roll: "2101ME22", name: "Vikram Joshi", initials: "VJ", branch: "ME", cpi: "8.34", placementStatus: "Placed", blocked: false },
  { id: "s10", roll: "2101EC11", name: "Priya Menon", initials: "PM", branch: "ECE", cpi: "9.01", placementStatus: "Higher Studies", blocked: false },
  { id: "s11", roll: "2101CS18", name: "Aditya Rao", initials: "AR", branch: "CSE", cpi: "7.85", placementStatus: "Unplaced", blocked: false },
  { id: "s12", roll: "2101CE21", name: "Nisha Gupta", initials: "NG", branch: "CE", cpi: "8.56", placementStatus: "Placed", blocked: false },
  { id: "s13", roll: "2101EE09", name: "Karan Malhotra", initials: "KM", branch: "EE", cpi: "8.03", placementStatus: "Unplaced", blocked: true },
  { id: "s14", roll: "2101ME15", name: "Riya Desai", initials: "RD", branch: "ME", cpi: "8.79", placementStatus: "Placed", blocked: false },
  { id: "s15", roll: "2101EC34", name: "Sanjay Pillai", initials: "SP", branch: "ECE", cpi: "7.45", placementStatus: "Unplaced", blocked: false },
  { id: "s16", roll: "2101CS50", name: "Ishita Bose", initials: "IB", branch: "CSE", cpi: "9.21", placementStatus: "Higher Studies", blocked: false },
];

export interface CorrectionRequest {
  id: string;
  student: string;
  roll: string;
  /** The profile field the student wants changed. */
  field: string;
  /** A short description of the requested change. */
  change: string;
  submitted: string;
}

export const PENDING_CORRECTIONS: CorrectionRequest[] = [
  { id: "c1", student: "Rohan Verma", roll: "2101CS27", field: "CPI", change: "8.45 → 8.54 (revaluation result)", submitted: "2 days ago" },
  { id: "c2", student: "Ananya Iyer", roll: "2101ME08", field: "Branch", change: "ME → MEMS (program correction)", submitted: "3 days ago" },
  { id: "c3", student: "Sara Khan", roll: "2101EE31", field: "Email", change: "sara_2101ee31@iitp.ac.in → sara.khan@iitp.ac.in", submitted: "4 days ago" },
  { id: "c4", student: "Aditya Rao", roll: "2101CS18", field: "Name", change: "Aditya Rao → Aditya Narayan Rao", submitted: "5 days ago" },
  { id: "c5", student: "Sanjay Pillai", roll: "2101EC34", field: "Placement Status", change: "Unplaced → Placed (offer accepted)", submitted: "6 days ago" },
];

/** Branch options for filters/selects ("All" sentinel included). */
export const BRANCHES = ["All", "CSE", "ECE", "EE", "ME", "CE"] as const;

/** Placement status options for filters/selects ("All" sentinel included). */
export const PLACEMENT_STATUSES = ["All", "Placed", "Unplaced", "Higher Studies"] as const;

/** Export file formats. */
export const EXPORT_FORMATS = ["CSV", "XLSX"] as const;

/** Dataset choices for the export panel. */
export const EXPORT_DATASETS = ["Students", "Companies"] as const;
