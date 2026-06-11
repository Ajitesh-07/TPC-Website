// Mock data for the super-admin global dashboard.
import type { MetricDelta } from "@/components/ui/MetricCard";

export interface AdminStat {
  label: string;
  value: string;
  icon: string;
  iconClassName: string;
  blobClassName: string;
  delta?: MetricDelta;
}

export const ADMIN_STATS: AdminStat[] = [
  {
    label: "Total Placements",
    value: "1,248",
    icon: "school",
    iconClassName: "text-primary-fixed-dim",
    blobClassName: "-right-4 -top-4 w-16 h-16 bg-primary-container/5 rounded-full group-hover:scale-150 transition-transform duration-500",
    delta: { text: "+12% yoy", tone: "success", icon: "arrow_upward" },
  },
  {
    label: "Active Companies",
    value: "156",
    icon: "domain",
    iconClassName: "text-secondary-fixed-dim",
    blobClassName: "-right-4 -top-4 w-16 h-16 bg-secondary-container/10 rounded-full group-hover:scale-150 transition-transform duration-500",
    delta: { text: "+5 new this week", tone: "success", icon: "arrow_upward" },
  },
  {
    label: "Flagged Profiles",
    value: "24",
    icon: "flag",
    iconClassName: "text-status-error",
    blobClassName: "-right-4 -top-4 w-16 h-16 bg-error-container/20 rounded-full group-hover:scale-150 transition-transform duration-500",
    delta: { text: "Requires review", tone: "neutral" },
  },
  {
    label: "Avg Credits",
    value: "850",
    icon: "toll",
    iconClassName: "text-tertiary-container",
    blobClassName: "-right-4 -top-4 w-16 h-16 bg-tertiary-fixed-dim/20 rounded-full group-hover:scale-150 transition-transform duration-500",
    delta: { text: "-5% from avg", tone: "warning", icon: "arrow_downward" },
  },
];

export interface RoleChange {
  initials: string;
  avatarClassName: string;
  name: string;
  change: string;
  time: string;
}

export const ADMIN_ROLE_CHANGES: RoleChange[] = [
  { initials: "AK", avatarClassName: "bg-tertiary-container text-on-tertiary-container", name: "Amit Kumar", change: "Promoted to Coordinator", time: "2h ago" },
  { initials: "SR", avatarClassName: "bg-secondary-container text-on-secondary-fixed-variant", name: "Sneha Reddy", change: "Access Revoked", time: "5h ago" },
  { initials: "VP", avatarClassName: "bg-surface-variant text-text-secondary", name: "Vikram Patel", change: "Added as Volunteer", time: "1d ago" },
];

export interface DirectoryRow {
  badge: string;
  badgeClassName: string;
  rollNo: string;
  name: string;
  department: string;
  credits: string;
  creditsClassName?: string;
  status: { label: string; className: string };
}

export const ADMIN_DIRECTORY: DirectoryRow[] = [
  {
    badge: "21CS",
    badgeClassName: "bg-primary-fixed text-on-primary-fixed",
    rollNo: "2101CS01",
    name: "Aarav Sharma",
    department: "Computer Science",
    credits: "1,200",
    status: { label: "Placed", className: "bg-status-success/10 text-status-success border border-status-success/20" },
  },
  {
    badge: "21EE",
    badgeClassName: "bg-secondary-fixed text-on-secondary-fixed",
    rollNo: "2101EE45",
    name: "Diya Patel",
    department: "Electrical Eng.",
    credits: "850",
    status: { label: "Eligible", className: "bg-status-warning/10 text-status-warning border border-status-warning/20" },
  },
  {
    badge: "21ME",
    badgeClassName: "bg-error-container text-on-error-container",
    rollNo: "2101ME12",
    name: "Rohan Gupta",
    department: "Mechanical Eng.",
    credits: "-150",
    creditsClassName: "text-status-error font-medium",
    status: { label: "Blocked", className: "bg-error-container text-on-error-container border border-error/20" },
  },
];
