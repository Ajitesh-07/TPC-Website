// Mock data for the recruiter "My Drives" page: the company's own drives, each
// with its important dates and the full applicant roster (incl. enough profile
// detail to preview a candidate + their resume). Replace with the API later.
import type { BadgeTone } from "@/components/ui/StatusBadge";

export type ImportantDateType = "ppt" | "oa" | "interview" | "deadline" | "result";

export interface ImportantDate {
  label: string;
  date: string;
  type: ImportantDateType;
  /** Already passed / completed. */
  done?: boolean;
}

export interface DriveApplicant {
  id: string;
  name: string;
  initials: string;
  roll: string;
  branch: string;
  cpi: string; // out of 10
  email: string;
  phone: string;
  appliedOn: string;
  status: { label: string; tone: BadgeTone };
  skills: string[];
  linkedin?: string;
  github?: string;
  preferredLocation?: string;
  resumeUrl: string;
}

export interface CompanyDrive {
  id: string;
  role: string;
  processType: string;
  ctc: string;
  location: string;
  status: { label: string; tone: BadgeTone };
  postedOn: string;
  deadline: string;
  description: string;
  dates: ImportantDate[];
  applicants: DriveApplicant[];
}

/** The signed-in recruiter's company. */
export const COMPANY_NAME = "TechFlow Solutions Inc.";

export const COMPANY_DRIVES: CompanyDrive[] = [
  {
    id: "drv-sde",
    role: "Software Development Engineer",
    processType: "FTE",
    ctc: "₹32.5 LPA",
    location: "Bangalore",
    status: { label: "Open", tone: "success" },
    postedOn: "Oct 02, 2024",
    deadline: "Oct 20, 2024",
    description:
      "Full-time SDE role across backend and platform teams. Strong DSA, system design, and one production-grade project expected.",
    dates: [
      { label: "Pre-Placement Talk", date: "Oct 15, 2024", type: "ppt", done: true },
      { label: "Online Assessment", date: "Oct 16, 2024", type: "oa", done: true },
      { label: "Application Deadline", date: "Oct 20, 2024", type: "deadline" },
      { label: "Technical Interviews", date: "Oct 24, 2024", type: "interview" },
      { label: "Results", date: "Oct 28, 2024", type: "result" },
    ],
    applicants: [
      {
        id: "stu-1",
        name: "Aarav Sharma",
        initials: "AS",
        roll: "2101CS02",
        branch: "CSE",
        cpi: "8.7",
        email: "aarav_2101cs02@iitp.ac.in",
        phone: "+91 98765 43210",
        appliedOn: "Oct 12, 2024",
        status: { label: "Shortlisted", tone: "shortlisted" },
        skills: ["C++", "System Design", "React", "PostgreSQL"],
        linkedin: "linkedin.com/in/aaravsharma",
        github: "github.com/aaravsharma",
        preferredLocation: "Bangalore",
        resumeUrl: "#",
      },
      {
        id: "stu-2",
        name: "Priya Nair",
        initials: "PN",
        roll: "2101CS18",
        branch: "CSE",
        cpi: "9.1",
        email: "priya_2101cs18@iitp.ac.in",
        phone: "+91 99887 76655",
        appliedOn: "Oct 11, 2024",
        status: { label: "Interview", tone: "warning" },
        skills: ["Java", "Spring", "Kafka", "AWS"],
        linkedin: "linkedin.com/in/priyanair",
        github: "github.com/priyanair",
        preferredLocation: "Hyderabad",
        resumeUrl: "#",
      },
      {
        id: "stu-3",
        name: "Rohan Verma",
        initials: "RV",
        roll: "2101EC11",
        branch: "ECE",
        cpi: "8.2",
        email: "rohan_2101ec11@iitp.ac.in",
        phone: "+91 91234 56780",
        appliedOn: "Oct 13, 2024",
        status: { label: "Under Review", tone: "info" },
        skills: ["Python", "ML", "PyTorch"],
        linkedin: "linkedin.com/in/rohanverma",
        github: "github.com/rohanverma",
        preferredLocation: "Bangalore",
        resumeUrl: "#",
      },
      {
        id: "stu-4",
        name: "Ananya Iyer",
        initials: "AI",
        roll: "2101CS27",
        branch: "CSE",
        cpi: "8.9",
        email: "ananya_2101cs27@iitp.ac.in",
        phone: "+91 90011 22334",
        appliedOn: "Oct 10, 2024",
        status: { label: "Applied", tone: "applied" },
        skills: ["Go", "Kubernetes", "gRPC", "Redis"],
        linkedin: "linkedin.com/in/ananyaiyer",
        github: "github.com/ananyaiyer",
        preferredLocation: "Pune",
        resumeUrl: "#",
      },
      {
        id: "stu-5",
        name: "Karthik Reddy",
        initials: "KR",
        roll: "2101EE05",
        branch: "EE",
        cpi: "7.8",
        email: "karthik_2101ee05@iitp.ac.in",
        phone: "+91 98123 45670",
        appliedOn: "Oct 14, 2024",
        status: { label: "Rejected", tone: "rejected" },
        skills: ["C", "Embedded", "RTOS"],
        linkedin: "linkedin.com/in/karthikreddy",
        preferredLocation: "Bangalore",
        resumeUrl: "#",
      },
    ],
  },
  {
    id: "drv-da",
    role: "Data Analyst",
    processType: "6M + FTE",
    ctc: "₹18.0 LPA",
    location: "Gurugram",
    status: { label: "Shortlisting", tone: "warning" },
    postedOn: "Oct 05, 2024",
    deadline: "Oct 18, 2024",
    description:
      "Internship-to-FTE analyst role. SQL, statistics, and a strong analytical mindset. Experience with dashboards is a plus.",
    dates: [
      { label: "Pre-Placement Talk", date: "Oct 14, 2024", type: "ppt", done: true },
      { label: "Application Deadline", date: "Oct 18, 2024", type: "deadline", done: true },
      { label: "Online Assessment", date: "Oct 19, 2024", type: "oa" },
      { label: "Interviews", date: "Oct 25, 2024", type: "interview" },
      { label: "Results", date: "Oct 30, 2024", type: "result" },
    ],
    applicants: [
      {
        id: "stu-6",
        name: "Sneha Gupta",
        initials: "SG",
        roll: "2101MM09",
        branch: "MME",
        cpi: "8.4",
        email: "sneha_2101mm09@iitp.ac.in",
        phone: "+91 99000 11223",
        appliedOn: "Oct 09, 2024",
        status: { label: "Shortlisted", tone: "shortlisted" },
        skills: ["SQL", "Tableau", "Excel", "Python"],
        linkedin: "linkedin.com/in/snehagupta",
        preferredLocation: "Gurugram",
        resumeUrl: "#",
      },
      {
        id: "stu-7",
        name: "Vikram Singh",
        initials: "VS",
        roll: "2101CE14",
        branch: "CE",
        cpi: "7.6",
        email: "vikram_2101ce14@iitp.ac.in",
        phone: "+91 98765 00112",
        appliedOn: "Oct 12, 2024",
        status: { label: "Under Review", tone: "info" },
        skills: ["SQL", "PowerBI", "Statistics"],
        linkedin: "linkedin.com/in/vikramsingh",
        github: "github.com/vikramsingh",
        preferredLocation: "Delhi",
        resumeUrl: "#",
      },
      {
        id: "stu-8",
        name: "Meera Joshi",
        initials: "MJ",
        roll: "2101CH07",
        branch: "Chemical",
        cpi: "8.0",
        email: "meera_2101ch07@iitp.ac.in",
        phone: "+91 90909 80807",
        appliedOn: "Oct 13, 2024",
        status: { label: "Applied", tone: "applied" },
        skills: ["Python", "Pandas", "SQL"],
        linkedin: "linkedin.com/in/meerajoshi",
        preferredLocation: "Mumbai",
        resumeUrl: "#",
      },
    ],
  },
];
