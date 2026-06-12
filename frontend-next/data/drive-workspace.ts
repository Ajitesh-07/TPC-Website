// Mock data for the coordinator "Drive Workspace" page.
import type { BadgeTone } from "@/components/ui/StatusBadge";

export type StageStatus = "completed" | "ongoing" | "upcoming";

export interface WorkspaceStage {
  name: string;
  status: StageStatus;
}

export interface WorkspaceDrive {
  id: string;
  company: string;
  role: string;
  ctc: string;
  deadline: string;
  stages: WorkspaceStage[];
}

export const WORKSPACE_DRIVES: WorkspaceDrive[] = [
  {
    id: "google-sde",
    company: "Google",
    role: "Software Development Engineer",
    ctc: "₹ 51.2 LPA",
    deadline: "20 Jun 2026",
    stages: [
      { name: "Registration", status: "completed" },
      { name: "Online Assessment", status: "completed" },
      { name: "Shortlisting", status: "ongoing" },
      { name: "Interviews", status: "upcoming" },
      { name: "Offers", status: "upcoming" },
    ],
  },
  {
    id: "microsoft-ds",
    company: "Microsoft",
    role: "Data Scientist",
    ctc: "₹ 44.0 LPA",
    deadline: "25 Jun 2026",
    stages: [
      { name: "Registration", status: "completed" },
      { name: "Online Assessment", status: "ongoing" },
      { name: "Shortlisting", status: "upcoming" },
      { name: "Interviews", status: "upcoming" },
      { name: "Offers", status: "upcoming" },
    ],
  },
  {
    id: "goldman-analyst",
    company: "Goldman Sachs",
    role: "Technology Analyst",
    ctc: "₹ 38.5 LPA",
    deadline: "30 Jun 2026",
    stages: [
      { name: "Registration", status: "ongoing" },
      { name: "Online Assessment", status: "upcoming" },
      { name: "Shortlisting", status: "upcoming" },
      { name: "Interviews", status: "upcoming" },
      { name: "Offers", status: "upcoming" },
    ],
  },
];

export interface WorkspaceApplicant {
  id: string;
  name: string;
  initials: string;
  roll: string;
  branch: string;
  cpi: number;
  appliedOn: string;
  status: { label: string; tone: BadgeTone };
}

export const WORKSPACE_APPLICANTS: WorkspaceApplicant[] = [
  {
    id: "a1",
    name: "Aarav Sharma",
    initials: "AS",
    roll: "2101CS01",
    branch: "CSE",
    cpi: 9.42,
    appliedOn: "08 Jun 2026",
    status: { label: "Shortlisted", tone: "shortlisted" },
  },
  {
    id: "a2",
    name: "Priya Nair",
    initials: "PN",
    roll: "2101EC14",
    branch: "ECE",
    cpi: 9.18,
    appliedOn: "08 Jun 2026",
    status: { label: "Applied", tone: "applied" },
  },
  {
    id: "a3",
    name: "Rohan Verma",
    initials: "RV",
    roll: "2101CS22",
    branch: "CSE",
    cpi: 8.76,
    appliedOn: "09 Jun 2026",
    status: { label: "Assessment", tone: "assessment" },
  },
  {
    id: "a4",
    name: "Ananya Iyer",
    initials: "AI",
    roll: "2101EE07",
    branch: "EE",
    cpi: 8.91,
    appliedOn: "09 Jun 2026",
    status: { label: "Shortlisted", tone: "shortlisted" },
  },
  {
    id: "a5",
    name: "Karthik Reddy",
    initials: "KR",
    roll: "2101CS33",
    branch: "CSE",
    cpi: 8.05,
    appliedOn: "10 Jun 2026",
    status: { label: "Applied", tone: "applied" },
  },
  {
    id: "a6",
    name: "Sneha Gupta",
    initials: "SG",
    roll: "2101EC02",
    branch: "ECE",
    cpi: 9.55,
    appliedOn: "10 Jun 2026",
    status: { label: "Shortlisted", tone: "shortlisted" },
  },
  {
    id: "a7",
    name: "Vikram Singh",
    initials: "VS",
    roll: "2101EE19",
    branch: "EE",
    cpi: 7.62,
    appliedOn: "10 Jun 2026",
    status: { label: "Rejected", tone: "rejected" },
  },
  {
    id: "a8",
    name: "Meera Joshi",
    initials: "MJ",
    roll: "2101CS45",
    branch: "CSE",
    cpi: 8.34,
    appliedOn: "11 Jun 2026",
    status: { label: "Applied", tone: "applied" },
  },
  {
    id: "a9",
    name: "Aditya Kulkarni",
    initials: "AK",
    roll: "2101EC28",
    branch: "ECE",
    cpi: 8.88,
    appliedOn: "11 Jun 2026",
    status: { label: "Assessment", tone: "assessment" },
  },
  {
    id: "a10",
    name: "Ishita Banerjee",
    initials: "IB",
    roll: "2101EE11",
    branch: "EE",
    cpi: 9.07,
    appliedOn: "11 Jun 2026",
    status: { label: "Applied", tone: "applied" },
  },
];

// StatusBadge tone for each process-stage status.
export const STAGE_TONE: Record<StageStatus, BadgeTone> = {
  completed: "success",
  ongoing: "info",
  upcoming: "neutral",
};

export const STAGE_LABEL: Record<StageStatus, string> = {
  completed: "Completed",
  ongoing: "Ongoing",
  upcoming: "Upcoming",
};
