// Mock data for the Coordinator "Add Drive" creation form.
// Static lookup lists + process-type vocabulary (mirrors ProcessType in data/drives.ts).
// Replace with API-backed config later.

/** Academic branches a drive can be opened to. */
export const BRANCHES: string[] = [
  "Computer Science & Engineering (CSE)",
  "Electronics & Communication Engineering (ECE)",
  "Electrical Engineering (EE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Chemical Engineering",
  "Metallurgical & Materials Engineering (MME)",
  "Engineering Physics (EP)",
  "Mathematics & Computing (MnC)",
  "Artificial Intelligence & Data Science (AI&DS)",
];

/** Hiring industry / sector of the recruiting company. */
export const INDUSTRIES: string[] = [
  "Software & IT Services",
  "Core Engineering",
  "Semiconductors & Hardware",
  "Banking & Financial Services",
  "Consulting",
  "E-Commerce & Internet",
  "Analytics & Data Science",
  "Automotive",
  "Energy & Power",
  "FMCG",
  "Telecommunications",
  "Research & Development",
];

/**
 * Drive process type. Values mirror the `ProcessType` union in `data/drives.ts`
 * so a saved drive maps cleanly onto the Drive Catalogue vocabulary.
 */
export interface ProcessTypeOption {
  value: string;
  label: string;
  hint?: string;
}

export const PROCESS_TYPES: ProcessTypeOption[] = [
  {
    value: "Internship",
    label: "Internship",
    hint: "Fixed-duration internship with a monthly stipend.",
  },
  {
    value: "6M + FTE",
    label: "6M + FTE",
    hint: "6-month internship followed by a full-time offer.",
  },
  {
    value: "6M + PPO",
    label: "6M + PPO",
    hint: "6-month internship with a pre-placement offer on performance.",
  },
  {
    value: "FTE",
    label: "FTE",
    hint: "Direct full-time employment offer.",
  },
];

/** Degree programmes eligible for the drive. */
export const DEGREE_TYPES: string[] = ["B.Tech", "M.Tech", "PhD"];
