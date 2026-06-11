// Mock data for the Student Profiles directory (admin / coordinator view).
import type { BadgeTone } from "@/components/ui/StatusBadge";

export interface DirectoryStudent {
  name: string;
  roll: string;
  initials: string;
  branch: string;
  /** Current CGPA, formatted (e.g. "8.92"). */
  cgpa: string;
  email: string;
  status: { label: string; tone: BadgeTone };
}

export const STUDENT_DIRECTORY: DirectoryStudent[] = [
  {
    name: "Aarav Sharma",
    roll: "2101CS02",
    initials: "AS",
    branch: "CSE",
    cgpa: "8.92",
    email: "aarav_2101cs02@iitp.ac.in",
    status: { label: "Unplaced", tone: "warning" },
  },
  {
    name: "Diya Patel",
    roll: "2101EE14",
    initials: "DP",
    branch: "EE",
    cgpa: "9.14",
    email: "diya_2101ee14@iitp.ac.in",
    status: { label: "Placed", tone: "success" },
  },
  {
    name: "Rohan Verma",
    roll: "2101CS27",
    initials: "RV",
    branch: "CSE",
    cgpa: "8.45",
    email: "rohan_2101cs27@iitp.ac.in",
    status: { label: "Shortlisted", tone: "shortlisted" },
  },
  {
    name: "Ananya Iyer",
    roll: "2101ME08",
    initials: "AI",
    branch: "ME",
    cgpa: "7.98",
    email: "ananya_2101me08@iitp.ac.in",
    status: { label: "Unplaced", tone: "warning" },
  },
  {
    name: "Kabir Singh",
    roll: "2101EC19",
    initials: "KS",
    branch: "ECE",
    cgpa: "8.71",
    email: "kabir_2101ec19@iitp.ac.in",
    status: { label: "Placed", tone: "success" },
  },
  {
    name: "Meera Nair",
    roll: "2101CS41",
    initials: "MN",
    branch: "CSE",
    cgpa: "9.32",
    email: "meera_2101cs41@iitp.ac.in",
    status: { label: "Placed", tone: "success" },
  },
  {
    name: "Arjun Reddy",
    roll: "2101CB05",
    initials: "AR",
    branch: "CB",
    cgpa: "8.10",
    email: "arjun_2101cb05@iitp.ac.in",
    status: { label: "Assessment", tone: "assessment" },
  },
  {
    name: "Sara Khan",
    roll: "2101EE31",
    initials: "SK",
    branch: "EE",
    cgpa: "7.62",
    email: "sara_2101ee31@iitp.ac.in",
    status: { label: "Restricted", tone: "rejected" },
  },
];
