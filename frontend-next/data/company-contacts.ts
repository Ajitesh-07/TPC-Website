// Mock data for the admin "Company Contacts" page.
// Tracks who last spoke with each recruiter and the interaction history.

export type ContactChannel = "Email" | "Call" | "Visit";

export interface ContactEntry {
  date: string;
  person: string;
  designation: string;
  channel: ContactChannel;
  note: string;
}

export interface CompanyContact {
  id: string;
  company: string;
  initials: string;
  industry: string;
  /** Display date of the most recent interaction. */
  lastContacted: string;
  /** Name of the point-of-contact for the most recent interaction. */
  poc: string;
  history: ContactEntry[];
}

export const CHANNELS: ContactChannel[] = ["Email", "Call", "Visit"];

export const INDUSTRIES: string[] = [
  "Software & Internet",
  "Finance & Banking",
  "Semiconductors",
  "Consulting",
  "Core Engineering",
];

export const COMPANY_CONTACTS: CompanyContact[] = [
  {
    id: "google",
    company: "Google",
    initials: "GO",
    industry: "Software & Internet",
    lastContacted: "Jun 06, 2026",
    poc: "Ananya Krishnan",
    history: [
      {
        date: "Jun 06, 2026",
        person: "Ananya Krishnan",
        designation: "University Programs Lead",
        channel: "Call",
        note: "Confirmed SDE-1 PPT slot for the 2026 autumn drive. Awaiting JAF sign-off.",
      },
      {
        date: "May 22, 2026",
        person: "Ananya Krishnan",
        designation: "University Programs Lead",
        channel: "Email",
        note: "Shared updated student CTC expectations and CGPA distribution sheet.",
      },
      {
        date: "Apr 30, 2026",
        person: "David Mensah",
        designation: "Recruiting Manager",
        channel: "Visit",
        note: "Campus visit to finalise interview infrastructure and slot count.",
      },
    ],
  },
  {
    id: "microsoft",
    company: "Microsoft",
    initials: "MS",
    industry: "Software & Internet",
    lastContacted: "Jun 02, 2026",
    poc: "Rohan Iyer",
    history: [
      {
        date: "Jun 02, 2026",
        person: "Rohan Iyer",
        designation: "Talent Acquisition Partner",
        channel: "Email",
        note: "Sent the finalised JAF for IDC SDE role; offered two PPT date options.",
      },
      {
        date: "May 18, 2026",
        person: "Rohan Iyer",
        designation: "Talent Acquisition Partner",
        channel: "Call",
        note: "Discussed intern-to-FTE conversion numbers from last cycle.",
      },
    ],
  },
  {
    id: "goldman-sachs",
    company: "Goldman Sachs",
    initials: "GS",
    industry: "Finance & Banking",
    lastContacted: "May 28, 2026",
    poc: "Priya Nair",
    history: [
      {
        date: "May 28, 2026",
        person: "Priya Nair",
        designation: "Campus Recruiting VP",
        channel: "Visit",
        note: "On-campus sync to scope Engineering + Strats analyst roles for the December slot.",
      },
      {
        date: "May 10, 2026",
        person: "Karan Malhotra",
        designation: "HR Associate",
        channel: "Email",
        note: "Requested branch-wise eligibility list and prior-year placement stats.",
      },
      {
        date: "Apr 25, 2026",
        person: "Priya Nair",
        designation: "Campus Recruiting VP",
        channel: "Call",
        note: "Introductory call for the 2026-27 placement season.",
      },
    ],
  },
  {
    id: "qualcomm",
    company: "Qualcomm",
    initials: "QC",
    industry: "Semiconductors",
    lastContacted: "May 20, 2026",
    poc: "Sanjay Verma",
    history: [
      {
        date: "May 20, 2026",
        person: "Sanjay Verma",
        designation: "Engineering Hiring Lead",
        channel: "Call",
        note: "Aligned on hardware/modem roles; wants a pre-final year intern cohort too.",
      },
      {
        date: "Apr 28, 2026",
        person: "Meera Joshi",
        designation: "University Recruiter",
        channel: "Email",
        note: "Shared role JD drafts for VLSI and embedded systems profiles.",
      },
    ],
  },
  {
    id: "texas-instruments",
    company: "Texas Instruments",
    initials: "TI",
    industry: "Semiconductors",
    lastContacted: "May 14, 2026",
    poc: "Aditi Rao",
    history: [
      {
        date: "May 14, 2026",
        person: "Aditi Rao",
        designation: "Campus Relations Manager",
        channel: "Email",
        note: "Confirmed participation; awaiting our preferred PPT week.",
      },
      {
        date: "Apr 20, 2026",
        person: "Aditi Rao",
        designation: "Campus Relations Manager",
        channel: "Visit",
        note: "Lab tour and analog design role discussion with EE department.",
      },
      {
        date: "Mar 30, 2026",
        person: "Vikram Desai",
        designation: "Senior Recruiter",
        channel: "Call",
        note: "Season kickoff call; flagged interest in dual-degree candidates.",
      },
    ],
  },
  {
    id: "adobe",
    company: "Adobe",
    initials: "AD",
    industry: "Software & Internet",
    lastContacted: "May 08, 2026",
    poc: "Neha Bansal",
    history: [
      {
        date: "May 08, 2026",
        person: "Neha Bansal",
        designation: "University Programs Specialist",
        channel: "Email",
        note: "Proposed a combined product + research internship track for the summer.",
      },
      {
        date: "Apr 15, 2026",
        person: "Neha Bansal",
        designation: "University Programs Specialist",
        channel: "Call",
        note: "Reviewed previous cohort feedback and offer-acceptance ratio.",
      },
    ],
  },
  {
    id: "mckinsey",
    company: "McKinsey & Company",
    initials: "MC",
    industry: "Consulting",
    lastContacted: "Apr 30, 2026",
    poc: "Arjun Reddy",
    history: [
      {
        date: "Apr 30, 2026",
        person: "Arjun Reddy",
        designation: "Recruiting Coordinator",
        channel: "Email",
        note: "Sent case-prep workshop proposal ahead of the analyst hiring round.",
      },
      {
        date: "Apr 02, 2026",
        person: "Arjun Reddy",
        designation: "Recruiting Coordinator",
        channel: "Call",
        note: "Confirmed Business Analyst role and open-to-all-branches eligibility.",
      },
    ],
  },
  {
    id: "larsen-toubro",
    company: "Larsen & Toubro",
    initials: "LT",
    industry: "Core Engineering",
    lastContacted: "Apr 18, 2026",
    poc: "Suresh Pillai",
    history: [
      {
        date: "Apr 18, 2026",
        person: "Suresh Pillai",
        designation: "Talent Acquisition Head",
        channel: "Visit",
        note: "Campus visit to discuss GET roles across civil, mechanical and electrical.",
      },
      {
        date: "Mar 25, 2026",
        person: "Suresh Pillai",
        designation: "Talent Acquisition Head",
        channel: "Email",
        note: "Shared role brochure and CTC bands for the graduate engineer trainee program.",
      },
    ],
  },
];
