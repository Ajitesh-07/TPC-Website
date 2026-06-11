// Mock data for the student dashboard.
import type { BadgeTone } from "@/components/ui/StatusBadge";

/** The signed-in student. Replace with the authed user once the API exists. */
export const STUDENT = {
  name: "Aarav Sharma",
  roll: "2101CS02",
  initials: "AS",
  placementStatus: "Unplaced",
  restricted: false,
  emailVerified: true,
  btechVerified: true,
  completeness: 85,
};

export interface EligibleDrive {
  company: string;
  initials: string;
  role: string;
  ctc: string;
  deadline: string;
  /** Highlight the deadline when it is closing soon. */
  closingSoon?: boolean;
  tags: string[];
}

export const ELIGIBLE_DRIVES: EligibleDrive[] = [
  {
    company: "Google",
    initials: "G",
    role: "Software Engineer (SDE I)",
    ctc: "₹32.5 LPA",
    deadline: "Oct 24",
    closingSoon: true,
    tags: ["B.Tech", "CSE"],
  },
  {
    company: "Adobe",
    initials: "A",
    role: "Member of Technical Staff",
    ctc: "₹28.0 LPA",
    deadline: "Oct 28",
    tags: ["B.Tech", "CSE/EE"],
  },
  {
    company: "Texas Instruments",
    initials: "TI",
    role: "Analog Design Intern",
    ctc: "₹1.2L /mo",
    deadline: "Nov 02",
    tags: ["B.Tech", "EE/ECE"],
  },
];

export interface Reminder {
  icon: string;
  /** Text-colour token for the icon (e.g. "text-status-warning"). */
  tone: string;
  text: string;
}

export const REMINDERS: Reminder[] = [
  { icon: "timer", tone: "text-status-warning", text: "Microsoft OA closes in 2 days" },
  { icon: "description", tone: "text-primary", text: "Update your resume for upcoming drives" },
];

export interface Application {
  company: string;
  role: string;
  appliedOn: string;
  status: { label: string; tone: BadgeTone };
}

export const STUDENT_APPLICATIONS: Application[] = [
  { company: "Microsoft", role: "SDE Intern", appliedOn: "Oct 12, 2024", status: { label: "Assessment", tone: "assessment" } },
  { company: "Goldman Sachs", role: "Analyst", appliedOn: "Oct 10, 2024", status: { label: "Shortlisted", tone: "shortlisted" } },
  { company: "Amazon", role: "SDE 1", appliedOn: "Oct 05, 2024", status: { label: "Applied", tone: "applied" } },
  { company: "Atlassian", role: "Product Engineer", appliedOn: "Sep 28, 2024", status: { label: "Rejected", tone: "rejected" } },
];

export interface ScheduleEntry {
  time: string;
  title: string;
  desc: string;
  /** First entry is the highlighted "next" item. */
  active?: boolean;
  /** Render the title inside a bordered card (as in the mock). */
  boxed?: boolean;
}

export const STUDENT_SCHEDULE: ScheduleEntry[] = [
  {
    time: "TOMORROW, 10:00 AM",
    title: "Google Tech Interview",
    desc: "Round 1 - Algorithms & Data Structures. Ensure stable internet.",
    active: true,
    boxed: true,
  },
  {
    time: "OCT 18, 2:00 PM",
    title: "Microsoft Online Assessment",
    desc: "Link will be activated 10 mins prior.",
  },
  {
    time: "OCT 22, 9:00 AM",
    title: "Pre-Placement Talk: Jaguar Land Rover",
    desc: "Venue: Main Auditorium",
  },
];
