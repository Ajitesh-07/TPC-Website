// Mock data for the admin Credit Management page.

export interface CreditEntry {
  /** ISO-ish display date, e.g. "2026-05-28". */
  date: string;
  /** Signed change applied to the student's credit balance. */
  delta: number;
  /** Why the adjustment happened (drawn from CREDIT_REASONS). */
  reason: string;
  /** Who made the change (coordinator / admin / system). */
  by: string;
}

export interface CreditStudent {
  id: string;
  roll: string;
  name: string;
  /** Two-letter avatar initials. */
  initials: string;
  branch: "CSE" | "ECE" | "EE" | "ME";
  /** Current credit balance (roughly 0-100). */
  credits: number;
  /** Most-recent-first audit trail. */
  history: CreditEntry[];
}

/** Reasons offered in both the filter <select> and the adjust form. */
export const CREDIT_REASONS: string[] = [
  "Missed OA",
  "Interview no-show",
  "Policy reset",
  "Manual grant",
  "Resume verification",
  "Late application withdrawal",
];

export const CREDIT_STUDENTS: CreditStudent[] = [
  {
    id: "s1",
    roll: "2101CS01",
    name: "Aarav Sharma",
    initials: "AS",
    branch: "CSE",
    credits: 92,
    history: [
      { date: "2026-05-30", delta: 10, reason: "Manual grant", by: "Dr. Mehta (Admin)" },
      { date: "2026-04-18", delta: -8, reason: "Interview no-show", by: "System" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s2",
    roll: "2101CS22",
    name: "Diya Patel",
    initials: "DP",
    branch: "CSE",
    credits: 64,
    history: [
      { date: "2026-05-22", delta: -16, reason: "Missed OA", by: "System" },
      { date: "2026-03-10", delta: -10, reason: "Interview no-show", by: "R. Iyer (Coordinator)" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s3",
    roll: "2101EC14",
    name: "Rohan Gupta",
    initials: "RG",
    branch: "ECE",
    credits: 8,
    history: [
      { date: "2026-06-02", delta: -20, reason: "Missed OA", by: "System" },
      { date: "2026-05-11", delta: -32, reason: "Interview no-show", by: "System" },
      { date: "2026-04-02", delta: -30, reason: "Missed OA", by: "System" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s4",
    roll: "2101EE07",
    name: "Sneha Reddy",
    initials: "SR",
    branch: "EE",
    credits: 78,
    history: [
      { date: "2026-05-19", delta: -12, reason: "Interview no-show", by: "R. Iyer (Coordinator)" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s5",
    roll: "2101ME31",
    name: "Vikram Singh",
    initials: "VS",
    branch: "ME",
    credits: 0,
    history: [
      { date: "2026-06-04", delta: -25, reason: "Interview no-show", by: "System" },
      { date: "2026-05-01", delta: -30, reason: "Missed OA", by: "System" },
      { date: "2026-03-15", delta: -35, reason: "Missed OA", by: "System" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s6",
    roll: "2101CS45",
    name: "Ananya Iyer",
    initials: "AI",
    branch: "CSE",
    credits: 100,
    history: [
      { date: "2026-05-27", delta: 10, reason: "Manual grant", by: "Dr. Mehta (Admin)" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s7",
    roll: "2101EC02",
    name: "Karthik Nair",
    initials: "KN",
    branch: "ECE",
    credits: 46,
    history: [
      { date: "2026-05-24", delta: -14, reason: "Missed OA", by: "System" },
      { date: "2026-04-20", delta: -30, reason: "Interview no-show", by: "R. Iyer (Coordinator)" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s8",
    roll: "2101EE19",
    name: "Priya Menon",
    initials: "PM",
    branch: "EE",
    credits: 34,
    history: [
      { date: "2026-06-01", delta: -6, reason: "Late application withdrawal", by: "R. Iyer (Coordinator)" },
      { date: "2026-05-05", delta: -50, reason: "Missed OA", by: "System" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s9",
    roll: "2101ME08",
    name: "Arjun Desai",
    initials: "AD",
    branch: "ME",
    credits: 70,
    history: [
      { date: "2026-05-16", delta: 5, reason: "Resume verification", by: "Dr. Mehta (Admin)" },
      { date: "2026-04-09", delta: -25, reason: "Interview no-show", by: "System" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
  {
    id: "s10",
    roll: "2101CS09",
    name: "Ishaan Verma",
    initials: "IV",
    branch: "CSE",
    credits: 18,
    history: [
      { date: "2026-06-03", delta: -22, reason: "Missed OA", by: "System" },
      { date: "2026-05-02", delta: -50, reason: "Interview no-show", by: "System" },
      { date: "2026-02-01", delta: 90, reason: "Policy reset", by: "System" },
    ],
  },
];
