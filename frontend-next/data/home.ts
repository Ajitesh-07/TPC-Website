// Content for the public homepage sections. Pure data — edit copy here.
import type { BadgeTone } from "@/components/ui/StatusBadge";

/** About TPC — three value pillars. */
export interface Pillar {
  icon: string;
  title: string;
  desc: string;
}

export const PILLARS: Pillar[] = [
  {
    icon: "workspace_premium",
    title: "Industry Partnerships",
    desc: "Long-standing relationships with 300+ recruiters spanning technology, core engineering, finance, and analytics.",
  },
  {
    icon: "groups",
    title: "Holistic Training",
    desc: "Structured aptitude, technical, and soft-skill programmes that prepare students for competitive selection processes.",
  },
  {
    icon: "insights",
    title: "Transparent Process",
    desc: "A single, verified platform for eligibility, drives, schedules, and results — replacing scattered forms and sheets.",
  },
];

/** Homepage announcements feed. */
export interface Announcement {
  date: string;
  tag: string;
  tone: BadgeTone;
  title: string;
  desc: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    date: "Jun 05, 2026",
    tag: "Timeline",
    tone: "timeline",
    title: "Placement Season 2026-27 registration opens",
    desc: "Eligible B.Tech, M.Tech, and PhD students must complete profile verification before the first drive.",
  },
  {
    date: "May 28, 2026",
    tag: "Notice",
    tone: "notice",
    title: "Resume submission deadline extended",
    desc: "The portal will accept verified resumes until June 15. Late submissions affect drive eligibility.",
  },
  {
    date: "May 20, 2026",
    tag: "Event",
    tone: "event",
    title: "Pre-placement bootcamp schedule released",
    desc: "Aptitude and technical preparation sessions begin from the first week of July.",
  },
];

/** Public, no-login downloads.
 *  INF = Internship Notification Form, JNF = Job Notification Form. */
export interface Download {
  icon: string;
  title: string;
  desc: string;
  action: string;
  href: string;
}

export const DOWNLOADS: Download[] = [
  {
    icon: "description",
    title: "Internship Notification Form (INF)",
    desc: "For recruiters offering internship roles to IIT Patna students.",
    action: "Download INF",
    href: "#",
  },
  {
    icon: "work",
    title: "Job Notification Form (JNF)",
    desc: "For recruiters offering full-time / PPO positions.",
    action: "Download JNF",
    href: "#",
  },
  {
    icon: "auto_stories",
    title: "Placement Brochure 2024-25",
    desc: "Complete overview of programmes, statistics, and student profiles.",
    action: "View Brochure",
    href: "#",
  },
  {
    icon: "gavel",
    title: "Placement Policy",
    desc: "Rules, eligibility norms, and the code of conduct for the placement season.",
    action: "Read Policy",
    href: "#",
  },
];
