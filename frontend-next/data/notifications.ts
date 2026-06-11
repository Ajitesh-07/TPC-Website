// Mock data for the student Notifications page. Replace with live data later.

export type NotifCategory = "drive" | "status" | "deadline" | "schedule" | "profile";

export const CATEGORY_CONFIG: Record<
  NotifCategory,
  { label: string; icon: string; iconBg: string; iconText: string }
> = {
  drive: { label: "Drive Alerts", icon: "campaign", iconBg: "bg-primary-fixed/40", iconText: "text-primary" },
  status: { label: "Status Updates", icon: "fact_check", iconBg: "bg-status-success/20", iconText: "text-status-success" },
  deadline: { label: "Deadlines", icon: "timer", iconBg: "bg-status-error/20", iconText: "text-status-error" },
  schedule: { label: "Schedule Pings", icon: "event", iconBg: "bg-navy-vibrant/15", iconText: "text-navy-vibrant" },
  profile: { label: "Profile Actions", icon: "badge", iconBg: "bg-status-warning/20", iconText: "text-status-warning" },
};

export const NOTIF_CATEGORIES = Object.keys(CATEGORY_CONFIG) as NotifCategory[];

export interface NotificationItem {
  id: string;
  category: NotifCategory;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", category: "status", title: "Shortlist Announced", message: "The shortlist for the DE Shaw online assessment has been published. Check the Applications tab.", time: "10 mins ago", read: false },
  { id: "n2", category: "deadline", title: "Deadline Approaching", message: "Application for Oracle India closes tonight at 11:59 PM. Ensure your resume is updated.", time: "2 hours ago", read: false },
  { id: "n3", category: "drive", title: "New Drive Added", message: "Samsung R&D Institute has opened applications for B.Tech CSE/EE 2025 batch.", time: "5 hours ago", read: false },
  { id: "n4", category: "schedule", title: "PPT Rescheduled", message: "The Pre-Placement Talk for Goldman Sachs is moved to 4:00 PM today in virtual mode.", time: "Yesterday", read: true },
  { id: "n5", category: "profile", title: "Document Verified", message: "Your 6th semester grade sheet has been successfully verified by the CDC office.", time: "Nov 12", read: true },
  { id: "n6", category: "schedule", title: "Interview Slot Assigned", message: "Your Atlassian technical interview is scheduled for Nov 18, 9:00 AM. Check email for the link.", time: "Nov 11", read: true },
  { id: "n7", category: "status", title: "Application Rejected", message: "Your application for the Morgan Stanley Technology Analyst role was not shortlisted.", time: "Nov 10", read: true },
];

export const NOTIF_FILTERS: { key: NotifCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drive", label: "Drives" },
  { key: "status", label: "Status" },
  { key: "deadline", label: "Deadlines" },
  { key: "schedule", label: "Schedule" },
  { key: "profile", label: "Profile" },
];
