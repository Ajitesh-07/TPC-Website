// Mock data for the Drive Catalogue. Replace with TanStack Query hooks later.

export type DriveStatus = "upcoming" | "ongoing" | "closed";
export type ProcessType = "Internship" | "6M + FTE" | "6M + PPO" | "FTE";
export type SortKey = "deadline" | "ctc" | "company";

export interface DriveDoc {
  name: string;
  meta: string;
  icon: string;
}

export interface Drive {
  id: string;
  company: string;
  /** Short logo monogram shown in the avatar box. */
  initials: string;
  role: string;
  processType: ProcessType;
  ctc: string;
  /** Numeric CTC used for sorting. */
  ctcValue: number;
  location: string;
  deadline: string;
  /** Days until the deadline; negative once it has passed. */
  daysLeft: number;
  status: DriveStatus;
  eligible: boolean;
  ineligibleReason?: string;
  tags: string[];
  about: string;
  eligibility: string[];
  timeline: { label: string; date: string }[];
  documents: DriveDoc[];
}

export const DRIVES: Drive[] = [
  {
    id: "google-sde",
    company: "Google",
    initials: "G",
    role: "Software Engineer (SDE I)",
    processType: "FTE",
    ctc: "₹32.5 LPA",
    ctcValue: 3250000,
    location: "Bangalore",
    deadline: "Oct 24, 11:59 PM",
    daysLeft: 2,
    status: "upcoming",
    eligible: true,
    tags: ["B.Tech", "CSE"],
    about:
      "Join Google as a Software Engineer working on large-scale distributed systems that serve billions of users. Strong fundamentals in algorithms and system design expected.",
    eligibility: ["CPI ≥ 7.5", "B.Tech CSE / MnC", "2025 batch", "No active backlogs"],
    timeline: [
      { label: "Applications Close", date: "Oct 24" },
      { label: "Online Assessment", date: "Oct 28" },
      { label: "Interviews", date: "Nov 04" },
      { label: "Results", date: "Nov 10" },
    ],
    documents: [
      { name: "Job Description.pdf", meta: "PDF · 240 KB", icon: "description" },
      { name: "Role Brochure.pdf", meta: "PDF · 1.1 MB", icon: "auto_stories" },
    ],
  },
  {
    id: "adobe-mts",
    company: "Adobe",
    initials: "A",
    role: "Member of Technical Staff",
    processType: "FTE",
    ctc: "₹28.0 LPA",
    ctcValue: 2800000,
    location: "Noida",
    deadline: "Oct 28, 05:00 PM",
    daysLeft: 6,
    status: "upcoming",
    eligible: true,
    tags: ["B.Tech", "CSE/EE"],
    about:
      "Build the next generation of creative and document products at Adobe. Work across the stack on performant, delightful experiences.",
    eligibility: ["CPI ≥ 7.0", "B.Tech CSE / EE", "2025 batch"],
    timeline: [
      { label: "Applications Close", date: "Oct 28" },
      { label: "Online Assessment", date: "Nov 01" },
      { label: "Interviews", date: "Nov 07" },
    ],
    documents: [{ name: "Job Description.pdf", meta: "PDF · 180 KB", icon: "description" }],
  },
  {
    id: "morgan-stanley",
    company: "Morgan Stanley",
    initials: "MS",
    role: "Technology Analyst",
    processType: "FTE",
    ctc: "₹28.0 LPA",
    ctcValue: 2800000,
    location: "Mumbai",
    deadline: "Oct 26, 05:00 PM",
    daysLeft: 4,
    status: "upcoming",
    eligible: false,
    ineligibleReason: "Your CPI is below the minimum requirement for this company (Required: 8.5).",
    tags: ["B.Tech", "All Circuital"],
    about:
      "Work at the intersection of finance and technology, building platforms that power global markets.",
    eligibility: ["CPI ≥ 8.5", "B.Tech (Circuital branches)", "2025 batch", "No active backlogs"],
    timeline: [
      { label: "Applications Close", date: "Oct 26" },
      { label: "Online Assessment", date: "Oct 30" },
      { label: "Interviews", date: "Nov 05" },
    ],
    documents: [{ name: "Job Description.pdf", meta: "PDF · 210 KB", icon: "description" }],
  },
  {
    id: "ti-intern",
    company: "Texas Instruments",
    initials: "TI",
    role: "Analog Design Intern",
    processType: "Internship",
    ctc: "₹1.2L / month",
    ctcValue: 144000,
    location: "Bangalore",
    deadline: "Nov 02, 11:59 PM",
    daysLeft: 11,
    status: "upcoming",
    eligible: true,
    tags: ["B.Tech", "EE/ECE"],
    about:
      "A 6-month internship working on analog and mixed-signal IC design with potential for a pre-placement offer.",
    eligibility: ["CPI ≥ 7.5", "B.Tech EE / ECE", "2026 batch"],
    timeline: [
      { label: "Applications Close", date: "Nov 02" },
      { label: "Online Assessment", date: "Nov 06" },
      { label: "Interviews", date: "Nov 12" },
    ],
    documents: [{ name: "Internship JD.pdf", meta: "PDF · 160 KB", icon: "description" }],
  },
  {
    id: "goldman-analyst",
    company: "Goldman Sachs",
    initials: "GS",
    role: "Analyst — Engineering",
    processType: "6M + PPO",
    ctc: "₹26.0 LPA",
    ctcValue: 2600000,
    location: "Bangalore",
    deadline: "Closed — In Process",
    daysLeft: 0,
    status: "ongoing",
    eligible: true,
    tags: ["B.Tech", "CSE/IT"],
    about:
      "Engineering at Goldman Sachs builds massively scalable software and systems for the firm and its clients.",
    eligibility: ["CPI ≥ 7.5", "B.Tech CSE / IT", "2025 batch"],
    timeline: [
      { label: "Online Assessment", date: "Oct 12 ✓" },
      { label: "Interviews", date: "Oct 20 (ongoing)" },
      { label: "Results", date: "Oct 28" },
    ],
    documents: [
      { name: "Job Description.pdf", meta: "PDF · 220 KB", icon: "description" },
      { name: "Interview Instructions.pdf", meta: "PDF · 95 KB", icon: "rule" },
    ],
  },
  {
    id: "qualcomm-intern",
    company: "Qualcomm",
    initials: "Q",
    role: "Hardware Engineering Intern",
    processType: "Internship",
    ctc: "₹1.0L / month",
    ctcValue: 100000,
    location: "Hyderabad",
    deadline: "Closed — In Process",
    daysLeft: 0,
    status: "ongoing",
    eligible: false,
    ineligibleReason: "Your branch is not included in the company eligibility list.",
    tags: ["B.Tech", "ECE only"],
    about: "Work on chipsets that power the connected world, from modems to compute.",
    eligibility: ["CPI ≥ 7.0", "B.Tech ECE", "2026 batch"],
    timeline: [
      { label: "Online Assessment", date: "Oct 10 ✓" },
      { label: "Interviews", date: "Oct 18 (ongoing)" },
    ],
    documents: [{ name: "Internship JD.pdf", meta: "PDF · 140 KB", icon: "description" }],
  },
  {
    id: "amazon-sde",
    company: "Amazon",
    initials: "AZ",
    role: "SDE I",
    processType: "FTE",
    ctc: "₹30.0 LPA",
    ctcValue: 3000000,
    location: "Bangalore",
    deadline: "Closed Oct 05",
    daysLeft: -10,
    status: "closed",
    eligible: true,
    tags: ["B.Tech", "CSE"],
    about: "Build and scale services used by millions of Amazon customers worldwide.",
    eligibility: ["CPI ≥ 7.0", "B.Tech CSE", "2025 batch"],
    timeline: [
      { label: "Applications Closed", date: "Oct 05" },
      { label: "Results Declared", date: "Oct 15" },
    ],
    documents: [{ name: "Job Description.pdf", meta: "PDF · 200 KB", icon: "description" }],
  },
];

export const DRIVE_TABS: { key: DriveStatus; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "closed", label: "Closed" },
];

export const DRIVE_SORTS: { key: SortKey; label: string }[] = [
  { key: "deadline", label: "Deadline (Soonest)" },
  { key: "ctc", label: "CTC (Highest)" },
  { key: "company", label: "Company (A–Z)" },
];
