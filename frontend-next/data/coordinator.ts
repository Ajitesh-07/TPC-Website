// Mock data for the coordinator dashboard.
import type { BadgeTone } from "@/components/ui/StatusBadge";
import type { MetricDelta } from "@/components/ui/MetricCard";

export interface CoordinatorMetric {
  label: string;
  value: string;
  icon: string;
  iconClassName: string;
  blobClassName: string;
  delta?: MetricDelta;
}

export const COORDINATOR_METRICS: CoordinatorMetric[] = [
  {
    label: "Active Drives",
    value: "24",
    icon: "work",
    iconClassName: "text-primary",
    blobClassName: "top-0 right-0 w-24 h-24 bg-primary-fixed-dim/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
    delta: { text: "+3 this week", tone: "success", icon: "arrow_upward" },
  },
  {
    label: "Pending Apps",
    value: "156",
    icon: "pending_actions",
    iconClassName: "text-status-warning",
    blobClassName: "top-0 right-0 w-24 h-24 bg-secondary-container/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
    delta: { text: "Across 8 companies", tone: "neutral" },
  },
  {
    label: "Offers Made",
    value: "342",
    icon: "verified",
    iconClassName: "text-status-success",
    blobClassName: "top-0 right-0 w-24 h-24 bg-status-success/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
    delta: { text: "YTD 2024", tone: "neutral" },
  },
  {
    label: "Upcoming Int.",
    value: "12",
    icon: "event_upcoming",
    iconClassName: "text-navy-vibrant",
    blobClassName: "top-0 right-0 w-24 h-24 bg-navy-vibrant/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110",
    delta: { text: "Next 48 hours", tone: "neutral" },
  },
];

export interface CoordinatorDrive {
  company: string;
  role: string;
  status: { label: string; tone: BadgeTone };
  applicants: string;
}

export const COORDINATOR_DRIVES: CoordinatorDrive[] = [
  { company: "Google", role: "Software Engineer", status: { label: "Shortlisting", tone: "warning" }, applicants: "450" },
  { company: "Microsoft", role: "Data Scientist", status: { label: "Interviews", tone: "info" }, applicants: "120" },
  { company: "Amazon", role: "SDE-1", status: { label: "Offers Rolled", tone: "success" }, applicants: "300" },
  { company: "Goldman Sachs", role: "Analyst", status: { label: "Registration", tone: "neutral" }, applicants: "55" },
];

export interface CoordinatorEvent {
  time: string;
  title: string;
  location: string;
  dotClassName: string;
  timeClassName: string;
}

export const COORDINATOR_SCHEDULE: CoordinatorEvent[] = [
  {
    time: "Today, 10:00 AM",
    title: "Microsoft PPT",
    location: "Senate Hall",
    dotClassName: "bg-primary",
    timeClassName: "text-primary",
  },
  {
    time: "Tomorrow, 09:00 AM",
    title: "Amazon OA",
    location: "Computer Center",
    dotClassName: "bg-navy-vibrant",
    timeClassName: "text-navy-vibrant",
  },
  {
    time: "Oct 25, 14:00 PM",
    title: "Goldman Sachs Interviews",
    location: "Virtual",
    dotClassName: "bg-surface-variant border border-outline-variant",
    timeClassName: "text-text-secondary",
  },
];

export interface QuickAction {
  icon: string;
  label: string;
}

export const COORDINATOR_QUICK_ACTIONS: QuickAction[] = [
  { icon: "group_add", label: "Add Student" },
  { icon: "domain_add", label: "Add Company" },
  { icon: "mail", label: "Send Email" },
  { icon: "insert_chart", label: "Generate Stats" },
];
