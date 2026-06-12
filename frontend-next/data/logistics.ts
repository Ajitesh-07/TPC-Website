// Mock data for the company "Logistics" portal page.
// Company recruiters coordinate their campus-visit details with the placement cell.
import type { BadgeTone } from "@/components/ui/StatusBadge";

/** A recruiter / panelist travelling to campus for the drive. */
export interface VisitingMember {
  name: string;
  designation: string;
  phone: string;
  email: string;
  /** Initials shown in the coloured avatar circle. */
  initials: string;
}

export const VISITING_TEAM: VisitingMember[] = [
  {
    name: "Ananya Krishnan",
    designation: "Senior Engineering Manager",
    phone: "+91 98450 11234",
    email: "ananya.krishnan@techflow.com",
    initials: "AK",
  },
  {
    name: "Rohan Mehta",
    designation: "Lead Technical Recruiter",
    phone: "+91 99720 55810",
    email: "rohan.mehta@techflow.com",
    initials: "RM",
  },
  {
    name: "Priya Nair",
    designation: "HR Business Partner",
    phone: "+91 97411 30298",
    email: "priya.nair@techflow.com",
    initials: "PN",
  },
  {
    name: "Vikram Desai",
    designation: "Principal Software Engineer",
    phone: "+91 90080 47762",
    email: "vikram.desai@techflow.com",
    initials: "VD",
  },
];

/** A confirmed slot in the finalised campus-visit schedule. */
export interface ScheduleEntry {
  title: string;
  date: string;
  time: string;
  venue: string;
  status: { label: string; tone: BadgeTone };
}

export const FINALISED_SCHEDULE: ScheduleEntry[] = [
  {
    title: "Pre-Placement Talk (PPT)",
    date: "Mon, 14 Jul 2026",
    time: "10:00 AM - 11:30 AM",
    venue: "Senate Hall",
    status: { label: "Confirmed", tone: "success" },
  },
  {
    title: "Online Assessment (OA)",
    date: "Mon, 14 Jul 2026",
    time: "02:00 PM - 04:00 PM",
    venue: "Computer Centre",
    status: { label: "Confirmed", tone: "success" },
  },
  {
    title: "Technical & HR Interviews",
    date: "Tue, 15 Jul 2026",
    time: "09:30 AM onwards",
    venue: "Auditorium",
    status: { label: "Confirmed", tone: "info" },
  },
];

/** Venue choices offered for technical / venue requests. */
export const VENUE_OPTIONS: string[] = [
  "Senate Hall",
  "Computer Centre",
  "Auditorium",
];

/** Dietary preference choices for the hospitality request. */
export const DIETARY_OPTIONS: string[] = ["Vegetarian", "Non-Vegetarian", "Jain"];
