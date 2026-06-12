// Mock data for the admin "Manage Companies" page (ongoing season MVP).
import type { BadgeTone } from "@/components/ui/StatusBadge";

export interface CompanyRegistration {
  id: string;
  company: string;
  industry: string;
  processType: string;
  status: { label: string; tone: BadgeTone };
  responses: number;
  createdOn: string;
}

export const COMPANY_REGISTRATIONS: CompanyRegistration[] = [
  {
    id: "reg-001",
    company: "Microsoft",
    industry: "Software / IT",
    processType: "Full-Time + Internship",
    status: { label: "Open", tone: "success" },
    responses: 4,
    createdOn: "02 Jun 2026",
  },
  {
    id: "reg-002",
    company: "Goldman Sachs",
    industry: "Finance / Fintech",
    processType: "Full-Time",
    status: { label: "Open", tone: "success" },
    responses: 3,
    createdOn: "29 May 2026",
  },
  {
    id: "reg-003",
    company: "Qualcomm",
    industry: "Semiconductors / Hardware",
    processType: "Internship (6 Months)",
    status: { label: "Pending", tone: "warning" },
    responses: 2,
    createdOn: "27 May 2026",
  },
  {
    id: "reg-004",
    company: "Tata Steel",
    industry: "Core / Manufacturing",
    processType: "Full-Time",
    status: { label: "Closed", tone: "neutral" },
    responses: 2,
    createdOn: "18 May 2026",
  },
  {
    id: "reg-005",
    company: "Flipkart",
    industry: "E-Commerce / Retail",
    processType: "Full-Time + Internship",
    status: { label: "Open", tone: "success" },
    responses: 1,
    createdOn: "08 Jun 2026",
  },
];

export interface FormResponse {
  id: string;
  name: string;
  initials: string;
  roll: string;
  branch: string;
  cpi: number;
  email: string;
  submittedOn: string;
  company: string;
}

export const FORM_RESPONSES: FormResponse[] = [
  {
    id: "fr-001",
    name: "Aarav Sharma",
    initials: "AS",
    roll: "2101CS01",
    branch: "CSE",
    cpi: 9.1,
    email: "aarav_2101cs01@iitp.ac.in",
    submittedOn: "03 Jun 2026",
    company: "Microsoft",
  },
  {
    id: "fr-002",
    name: "Diya Patel",
    initials: "DP",
    roll: "2101CS18",
    branch: "CSE",
    cpi: 8.7,
    email: "diya_2101cs18@iitp.ac.in",
    submittedOn: "03 Jun 2026",
    company: "Microsoft",
  },
  {
    id: "fr-003",
    name: "Rohan Gupta",
    initials: "RG",
    roll: "2101EC22",
    branch: "ECE",
    cpi: 8.2,
    email: "rohan_2101ec22@iitp.ac.in",
    submittedOn: "04 Jun 2026",
    company: "Microsoft",
  },
  {
    id: "fr-004",
    name: "Ananya Iyer",
    initials: "AI",
    roll: "2101EE07",
    branch: "EE",
    cpi: 9.4,
    email: "ananya_2101ee07@iitp.ac.in",
    submittedOn: "05 Jun 2026",
    company: "Microsoft",
  },
  {
    id: "fr-005",
    name: "Karthik Nair",
    initials: "KN",
    roll: "2101CS33",
    branch: "CSE",
    cpi: 8.9,
    email: "karthik_2101cs33@iitp.ac.in",
    submittedOn: "30 May 2026",
    company: "Goldman Sachs",
  },
  {
    id: "fr-006",
    name: "Sneha Reddy",
    initials: "SR",
    roll: "2101EE19",
    branch: "EE",
    cpi: 8.5,
    email: "sneha_2101ee19@iitp.ac.in",
    submittedOn: "30 May 2026",
    company: "Goldman Sachs",
  },
  {
    id: "fr-007",
    name: "Vikram Singh",
    initials: "VS",
    roll: "2101CS44",
    branch: "CSE",
    cpi: 8.0,
    email: "vikram_2101cs44@iitp.ac.in",
    submittedOn: "31 May 2026",
    company: "Goldman Sachs",
  },
  {
    id: "fr-008",
    name: "Priya Menon",
    initials: "PM",
    roll: "2101EC09",
    branch: "ECE",
    cpi: 9.0,
    email: "priya_2101ec09@iitp.ac.in",
    submittedOn: "28 May 2026",
    company: "Qualcomm",
  },
  {
    id: "fr-009",
    name: "Arjun Desai",
    initials: "AD",
    roll: "2101EC31",
    branch: "ECE",
    cpi: 8.4,
    email: "arjun_2101ec31@iitp.ac.in",
    submittedOn: "28 May 2026",
    company: "Qualcomm",
  },
  {
    id: "fr-010",
    name: "Meera Joshi",
    initials: "MJ",
    roll: "2101ME05",
    branch: "ME",
    cpi: 8.3,
    email: "meera_2101me05@iitp.ac.in",
    submittedOn: "19 May 2026",
    company: "Tata Steel",
  },
  {
    id: "fr-011",
    name: "Aditya Verma",
    initials: "AV",
    roll: "2101ME27",
    branch: "ME",
    cpi: 7.8,
    email: "aditya_2101me27@iitp.ac.in",
    submittedOn: "20 May 2026",
    company: "Tata Steel",
  },
  {
    id: "fr-012",
    name: "Ishaan Rao",
    initials: "IR",
    roll: "2101CS56",
    branch: "CSE",
    cpi: 8.8,
    email: "ishaan_2101cs56@iitp.ac.in",
    submittedOn: "09 Jun 2026",
    company: "Flipkart",
  },
];

export const INDUSTRIES: string[] = [
  "Software / IT",
  "Finance / Fintech",
  "Semiconductors / Hardware",
  "Core / Manufacturing",
  "E-Commerce / Retail",
  "Consulting",
  "Analytics / Data Science",
];

export const BRANCHES: string[] = ["CSE", "ECE", "EE", "ME"];

export const PROCESS_TYPES: string[] = [
  "Full-Time",
  "Internship (2 Months)",
  "Internship (6 Months)",
  "Full-Time + Internship",
];
