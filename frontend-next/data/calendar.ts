// Mock data for the student Calendar page.
// The calendar UI is shared across roles (see components/calendar/CalendarView);
// only this event set differs per user (filtered server-side later).
import type { CalendarEvent } from "@/components/calendar/CalendarView";

export type { CalendarEvent };

export const STUDENT_EVENTS: CalendarEvent[] = [
  { id: "google-oa", type: "OA", title: "Google — Online Assessment", date: "2024-11-15", start: "14:00", end: "15:30", location: "HackerEarth (online)", detail: "Ensure webcam and microphone are working." },
  { id: "microsoft-ppt", type: "PPT", title: "Microsoft — Pre-Placement Talk", date: "2024-11-16", start: "10:00", end: "11:00", location: "Senate Hall, Main Building" },
  { id: "atlassian-interview", type: "Interview", title: "Atlassian — Technical Interview", date: "2024-11-18", start: "09:00", location: "Check email for exact slot timings." },
  { id: "oracle-deadline", type: "Deadline", title: "Oracle — Application Deadline", date: "2024-11-20", detail: "Applications close 11:59 PM. Update your resume first." },
  { id: "goldman-result", type: "Result", title: "Goldman Sachs — Shortlist Announcement", date: "2024-11-22" },
  { id: "deshaw-oa", type: "OA", title: "DE Shaw — Online Assessment", date: "2024-11-25", start: "16:00", end: "17:30", location: "Online" },
];
