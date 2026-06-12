/**
 * Response/payload types for the TPC API (mirrors backend/API_DESIGN.md).
 * The API uses underscore role slugs (super_admin); the frontend uses
 * hyphenated slugs (super-admin) — convert at the RoleProvider boundary only.
 */

// ---------- shared ----------

export type ApiRole = "student" | "company" | "coordinator" | "admin" | "super_admin";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type DriveStatusApi =
  | "draft"
  | "pending_approval"
  | "open"
  | "closed"
  | "completed"
  | "cancelled";

export type ProcessTypeApi = "internship" | "six_month_fte" | "six_month_ppo" | "fte";

export type ApplicationStatusApi =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "offered"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type StageTypeApi =
  | "registration"
  | "ppt"
  | "online_assessment"
  | "group_discussion"
  | "shortlisting"
  | "interview"
  | "offer";

export type StageStatusApi = "upcoming" | "ongoing" | "completed" | "skipped";

export type EventTypeApi = "ppt" | "oa" | "interview" | "deadline" | "result" | "other";

// ---------- me ----------

export interface MeResponse {
  user: { id: string; email: string; role: ApiRole; fullName: string };
  profile: StudentProfile | RecruiterProfile | CoordinatorProfile | null;
}

export interface StudentProfile {
  id: string;
  rollNo: string;
  cpi: number | null;
  batchYear: number | null;
  activeBacklogs: number;
  btechVerified: boolean;
  emailVerified: boolean;
  placementStatus: string;
  isBlocked: boolean;
  creditBalance: number;
  phone: string | null;
  altEmail: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  preferredLocation: string | null;
  branch: { id: string; code: string; name: string } | null;
  program: { id: string; code: string; name: string } | null;
  skills: string[];
}

export interface RecruiterProfile {
  id: string;
  companyId: string;
  designation: string | null;
  phone: string | null;
}

export interface CoordinatorProfile {
  id: string;
  department: string | null;
  phone: string | null;
}

// ---------- drives ----------

export interface DriveCard {
  id: string;
  title: string;
  processType: ProcessTypeApi;
  status: DriveStatusApi;
  location: string | null;
  ctcLpa: number | null;
  stipendPerMonth: number | null;
  openings: number | null;
  applicationDeadline: string | null; // ISO
  company: { id: string; name: string; logoUrl: string | null; industry: string | null };
  skills: string[];
  currentStage: { type: StageTypeApi; status: StageStatusApi } | null;
  // student scope only:
  eligibility?: { isEligible: boolean; reasons: string[] };
  hasApplied?: boolean;
}

export interface DriveDetail extends DriveCard {
  description: string | null;
  minCpi: number | null;
  allowBacklog: boolean;
  customRules: string | null;
  stages: DriveStage[];
  documents: { id: string; type: string; name: string; fileUrl: string }[];
  eligibleBranches: string[]; // codes
  eligiblePrograms: string[];
}

export interface DriveStage {
  id: string;
  type: StageTypeApi;
  label: string | null;
  sequence: number;
  status: StageStatusApi;
  scheduledAt: string | null;
  location: string | null;
}

export interface CreateDrivePayload {
  title: string;
  description?: string;
  processType: ProcessTypeApi;
  location?: string;
  ctcLpa?: number;
  stipendPerMonth?: number;
  openings?: number;
  minCpi?: number;
  allowBacklog: boolean;
  customRules?: string;
  applicationDeadline?: string;
  branchIds: string[];
  programIds: string[];
  skillNames: string[];
  stages: { type: StageTypeApi; label?: string; sequence: number; scheduledAt?: string; location?: string }[];
  companyId?: string;
}

export interface ApplicantRow {
  id: string; // application id
  status: ApplicationStatusApi;
  isShortlisted: boolean;
  appliedAt: string;
  currentStageId: string | null;
  student: {
    id: string;
    rollNo: string;
    fullName: string;
    branchCode: string | null;
    cpi: number | null;
    resumeUrl: string | null;
  };
}

// ---------- applications ----------

export interface MyApplication {
  id: string;
  status: ApplicationStatusApi;
  isShortlisted: boolean;
  appliedAt: string;
  currentStage: { type: StageTypeApi; status: StageStatusApi } | null;
  drive: {
    id: string;
    title: string;
    status: DriveStatusApi;
    company: { name: string; logoUrl: string | null };
  };
}

// ---------- student dashboard ----------

export interface StudentDashboard {
  profile: {
    completeness: number;
    emailVerified: boolean;
    btechVerified: boolean;
    isBlocked: boolean;
    blockedReason: string | null;
    placementStatus: string;
  };
  counts: { applied: number; shortlisted: number };
  eligibleDrives: DriveCard[];
  applications: MyApplication[];
  upcomingEvents: ApiEvent[];
}

// ---------- directory ----------

export interface DirectoryStudentRow {
  id: string;
  rollNo: string;
  fullName: string;
  email: string;
  branch: { code: string; name: string } | null;
  cpi: number | null;
  placementStatus: string;
  isBlocked: boolean;
  creditBalance: number;
  batchYear: number | null;
}

// ---------- corrections ----------

export interface CorrectionRequest {
  id: string;
  fieldName: string;
  currentValue: string | null;
  requestedValue: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  student?: { rollNo: string; fullName: string };
}

// ---------- credits ----------

export interface CreditRow {
  studentId: string;
  rollNo: string;
  fullName: string;
  branchCode: string | null;
  creditBalance: number;
  lastTransaction: { delta: number; reason: string; createdAt: string } | null;
}

export interface CreditEntry {
  id: string;
  delta: number;
  balanceAfter: number | null;
  reason: string;
  createdAt: string;
  createdByName: string | null;
}

// ---------- events ----------

export interface ApiEvent {
  id: string;
  type: EventTypeApi;
  scope: "global" | "branch" | "drive" | "personal";
  title: string;
  detail: string | null;
  eventDate: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM
  endTime: string | null;
  location: string | null;
  driveId: string | null;
}

// ---------- dashboards ----------

export interface CompanyDashboard {
  company: { name: string; logoUrl: string | null; industry: string | null; location: string | null };
  drives: { id: string; title: string; status: DriveStatusApi; applicants: number; shortlisted: number }[];
  itinerary: ApiEvent[];
  pocs: { id: string; name: string; designation: string | null; phone: string | null; email: string | null }[];
}

export interface CoordinatorDashboard {
  metrics: {
    activeDrives: number;
    pendingApplications: number;
    offersMade: number;
    upcomingInterviews: number;
  };
  drives: { id: string; company: string; title: string; status: DriveStatusApi; applicants: number }[];
  schedule: ApiEvent[];
}

export interface AdminDashboard {
  stats: {
    totalPlacements: number;
    activeCompanies: number;
    registeredStudents: number;
    pendingApprovals: number;
  };
  pendingDrives: { id: string; company: string; title: string; submittedAt: string }[];
  upcomingEvents: ApiEvent[];
  recentRoleChanges: { actorRole: string | null; targetLabel: string | null; details: string | null; createdAt: string }[];
}

// ---------- admin users ----------

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  role: ApiRole;
  status: "active" | "revoked" | "pending";
  lastLoginAt: string | null;
}

export interface ApprovedEmailRow {
  id: string;
  kind: "exact" | "domain";
  value: string;
  roleHint: ApiRole | null;
}

export interface CompanyRow {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  logoUrl: string | null;
  website: string | null;
}

// ===================== Phase 2 =====================

// ---------- notifications ----------

export type NotificationCategoryApi =
  | "drive"
  | "status"
  | "deadline"
  | "schedule"
  | "profile"
  | "system";

export interface NotificationItem {
  id: string;
  category: NotificationCategoryApi;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  category: NotificationCategoryApi;
  enabled: boolean;
}

// ---------- audit log ----------

export type AuditActionApi =
  | "data_edit"
  | "export"
  | "role_change"
  | "login"
  | "logout"
  | "policy"
  | "approval"
  | "credit_adjustment"
  | "upload"
  | "other";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorName: string | null;
  actorRole: ApiRole | null;
  action: AuditActionApi;
  targetTable: string | null;
  targetLabel: string | null;
  details: string | null;
  source: string | null;
}

export interface AuditSummary {
  total: number;
  exportsToday: number;
  roleChanges: number;
  policyActions: number;
}

// ---------- company contacts ----------

export type ContactChannelApi = "email" | "call" | "visit" | "other";

export interface ContactCompanyRow {
  id: string;
  name: string;
  industry: string | null;
  lastContacted: string | null;
  poc: { name: string; designation: string | null } | null;
  logCount: number;
}

export interface ContactEntry {
  id: string;
  contactName: string;
  designation: string | null;
  channel: ContactChannelApi;
  note: string | null;
  contactedOn: string;
}

export interface ContactDetail {
  company: { id: string; name: string; industry: string | null };
  pocs: { id: string; name: string; designation: string | null; phone: string | null; email: string | null }[];
  history: ContactEntry[];
}

// ---------- registrations (manage companies) ----------

export type RegistrationStatusApi = "open" | "closed" | "pending";

export interface RegistrationRow {
  id: string;
  companyName: string;
  industry: string | null;
  processType: ProcessTypeApi | null;
  minCpi: number | null;
  registrationDeadline: string | null;
  status: RegistrationStatusApi;
  responseCount: number;
  createdAt: string;
  eligibleBranchCodes: string[];
}

export interface RegistrationResponseRow {
  id: string;
  submittedAt: string;
  student: { rollNo: string; fullName: string; branchCode: string | null; cpi: number | null; email: string };
}

export interface CreateRegistrationPayload {
  companyName: string;
  companyId?: string;
  industry?: string;
  processType?: ProcessTypeApi;
  minCpi?: number;
  registrationDeadline?: string;
  eligibleBranchCodes: string[];
}

// ---------- logistics ----------

export interface LogisticsRequestApi {
  id: string | null;
  accommodationRequired: boolean;
  roomsRequired: number | null;
  checkIn: string | null;
  checkOut: string | null;
  dietaryPreference: string | null;
  specialRequests: string | null;
  venuePreference: string | null;
  systemsRequired: number | null;
  projectorRequired: boolean;
  internetRequired: boolean;
  technicalNotes: string | null;
}

export interface VisitingMemberApi {
  id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  email: string | null;
}

export interface LogisticsResponse {
  request: LogisticsRequestApi;
  team: VisitingMemberApi[];
  schedule: { id: string; title: string; type: EventTypeApi; eventDate: string; startTime: string | null; endTime: string | null; location: string | null }[];
}

export type LogisticsUpdatePayload = Omit<LogisticsRequestApi, "id">;

// ---------- export ----------

export interface ExportStudentRow {
  id: string;
  rollNo: string;
  fullName: string;
  email: string;
  branchCode: string | null;
  cpi: number | null;
  placementStatus: string;
  isBlocked: boolean;
  creditBalance: number;
}
