// Mock data for the (lighter) admin dashboard — operations overview.
import type { MetricDelta } from "@/components/ui/MetricCard";

export interface AdminProfile {
  name: string;
  role: string;
  department: string;
  email: string;
  initials: string;
}

export const ADMIN_PROFILE: AdminProfile = {
  name: "Dr. R. K. Singh",
  role: "Placement Administrator",
  department: "Career Development Centre",
  email: "web_ccdc@iitp.ac.in",
  initials: "RS",
};

export interface AdminOverviewMetric {
  label: string;
  value: string;
  icon: string;
  iconClassName: string;
  blobClassName: string;
  delta?: MetricDelta;
}

export const ADMIN_OVERVIEW_METRICS: AdminOverviewMetric[] = [
  {
    label: "Ongoing Drives",
    value: "18",
    icon: "work",
    iconClassName: "text-primary",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-primary-fixed-dim/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
    delta: { text: "+3 this week", tone: "success", icon: "arrow_upward" },
  },
  {
    label: "Active Companies",
    value: "94",
    icon: "domain",
    iconClassName: "text-navy-vibrant",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-navy-vibrant/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
    delta: { text: "+6 new this week", tone: "success", icon: "arrow_upward" },
  },
  {
    label: "Registered Students",
    value: "842",
    icon: "school",
    iconClassName: "text-status-success",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-status-success/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
    delta: { text: "94% of batch", tone: "neutral" },
  },
  {
    label: "Pending Approvals",
    value: "27",
    icon: "pending_actions",
    iconClassName: "text-status-warning",
    blobClassName:
      "top-0 right-0 w-24 h-24 bg-secondary-container/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
    delta: { text: "Requires review", tone: "warning", icon: "priority_high" },
  },
];

export interface AdminOngoingEvent {
  title: string;
  date: string;
  time: string;
  venue: string;
}

export const ADMIN_ONGOING_EVENTS: AdminOngoingEvent[] = [
  {
    title: "Microsoft Pre-Placement Talk",
    date: "Mon, Jun 16",
    time: "10:00 AM",
    venue: "Senate Hall",
  },
  {
    title: "Amazon Online Assessment",
    date: "Tue, Jun 17",
    time: "09:00 AM",
    venue: "Computer Centre",
  },
  {
    title: "Goldman Sachs Technical Interviews",
    date: "Wed, Jun 18",
    time: "02:00 PM",
    venue: "Virtual (Webex)",
  },
  {
    title: "Texas Instruments Group Discussion",
    date: "Thu, Jun 19",
    time: "11:30 AM",
    venue: "Seminar Hall B",
  },
];

export interface AdminQuickLink {
  label: string;
  description: string;
  icon: string;
  href: string;
}

export const ADMIN_QUICK_LINKS: AdminQuickLink[] = [
  {
    label: "Credit Management",
    description: "Adjust and audit student placement credits.",
    icon: "toll",
    href: "/credit-management",
  },
  {
    label: "Manage Companies",
    description: "Onboard recruiters and update company records.",
    icon: "domain",
    href: "/manage-companies",
  },
  {
    label: "Company Contacts",
    description: "View HR points of contact and outreach logs.",
    icon: "contacts",
    href: "/company-contacts",
  },
  {
    label: "Student Directory",
    description: "Browse, verify and search student profiles.",
    icon: "groups",
    href: "/student-profiles",
  },
  {
    label: "Drives",
    description: "Track ongoing and upcoming placement drives.",
    icon: "work",
    href: "/drive-catalogue",
  },
  {
    label: "Calendar",
    description: "Plan PPTs, assessments and interview slots.",
    icon: "calendar_month",
    href: "/calendar",
  },
];
