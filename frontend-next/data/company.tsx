// Mock data for the company (recruiter) dashboard.
// .tsx because activity entries embed small rich-text fragments.
import type { ReactNode } from "react";

export interface ItineraryItem {
  title: string;
  location: string;
  date: string;
  time: string;
  tag?: string;
  /** First item is the active (filled) timeline node. */
  active?: boolean;
}

export const COMPANY_ITINERARY: ItineraryItem[] = [
  {
    title: "Pre-Placement Talk (PPT)",
    location: "Senate Hall, Admin Block",
    date: "Oct 15, 2024",
    time: "10:00 AM - 11:30 AM",
    tag: "SDE Role",
    active: true,
  },
  {
    title: "Online Assessment",
    location: "Computer Center Lab 1 & 2",
    date: "Oct 16, 2024",
    time: "09:00 AM - 12:00 PM",
  },
  {
    title: "Technical Interviews (Round 1)",
    location: "Virtual / Block 3 Rooms",
    date: "Oct 18, 2024",
    time: "Starts at 10:00 AM",
  },
];

export interface ActivityItem {
  icon: string;
  iconWrapClassName: string;
  text: ReactNode;
  time: string;
}

/** Live applicant counts per open role — feeds the dashboard metrics strip. */
export interface RoleApplicantStat {
  role: string;
  applicants: number;
  shortlisted: number;
}

export const LIVE_APPLICANT_STATS: RoleApplicantStat[] = [
  { role: "Software Engineer (SDE)", applicants: 642, shortlisted: 48 },
  { role: "Data Analyst", applicants: 411, shortlisted: 30 },
  { role: "Product Manager", applicants: 195, shortlisted: 12 },
];

/** Placement-cell points of contact for quick communication. */
export interface ContactPerson {
  name: string;
  role: string;
  phone: string;
  email: string;
  initials: string;
}

export const COMPANY_POCS: ContactPerson[] = [
  {
    name: "Aarav Mehta",
    role: "Placement Coordinator",
    phone: "+91 98765 43210",
    email: "coordinator.tpc@iitp.ac.in",
    initials: "AM",
  },
  {
    name: "Dr. R. K. Singh",
    role: "Faculty In-charge, TPC",
    phone: "+91 91234 56789",
    email: "tpc@iitp.ac.in",
    initials: "RS",
  },
];

export const COMPANY_ACTIVITY: ActivityItem[] = [
  {
    icon: "check_circle",
    iconWrapClassName: "bg-primary-fixed text-on-primary-fixed",
    text: (
      <>
        <span className="font-semibold">SDE Role</span> JD approved by CDC.
      </>
    ),
    time: "2 hours ago",
  },
  {
    icon: "person_add",
    iconWrapClassName: "bg-surface-container-high text-on-surface",
    text: (
      <>
        New student registered for{" "}
        <span className="font-semibold">Data Analyst</span>.
      </>
    ),
    time: "5 hours ago",
  },
  {
    icon: "warning",
    iconWrapClassName: "bg-error-container text-on-error-container",
    text: "Action required: Confirm PPT slot for Oct 15.",
    time: "1 day ago",
  },
];
