"use client";

/**
 * TanStack Query hooks for the TPC API — the single integration surface pages
 * use. Query keys mirror the backend cache entities; every mutation invalidates
 * the keys it staled. All requests are credentialed via apiFetch.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiFetch, qs, API_URL, ApiError } from "./api";
import type {
  AdminDashboard,
  AdminUserRow,
  ApiEvent,
  ApplicantRow,
  ApplicationStatusApi,
  ApprovedEmailRow,
  AuditEntry,
  AuditSummary,
  CompanyDashboard,
  CompanyRow,
  ContactCompanyRow,
  ContactDetail,
  CoordinatorDashboard,
  CorrectionRequest,
  CreateDrivePayload,
  CreateRegistrationPayload,
  CreditEntry,
  CreditRow,
  DirectoryStudentRow,
  DriveCard,
  DriveDetail,
  LogisticsResponse,
  LogisticsUpdatePayload,
  MeResponse,
  MyApplication,
  NotificationItem,
  NotificationPreference,
  Page,
  RegistrationResponseRow,
  RegistrationRow,
  StageStatusApi,
  StudentDashboard,
} from "./api-types";

type Params = Record<string, string | number | boolean | undefined | null>;

// ---------- me / auth ----------

export function useMe(options?: Partial<UseQueryOptions<MeResponse>>) {
  return useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      phone?: string;
      altEmail?: string;
      resumeKey?: string;
      linkedinUrl?: string;
      githubUrl?: string;
      preferredLocation?: string;
      skills?: string[];
    }) => apiFetch("/api/me/profile", { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["studentDashboard"] });
    },
  });
}

export function useStudentDashboard() {
  return useQuery<StudentDashboard>({
    queryKey: ["studentDashboard"],
    queryFn: () => apiFetch<StudentDashboard>("/api/me/dashboard"),
  });
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

export async function requestRecruiterLink(email: string): Promise<void> {
  await apiFetch("/auth/recruiter/request", { method: "POST", body: { email } });
}

// ---------- drives ----------

export function useDrives(params: Params = {}) {
  return useQuery<Page<DriveCard>>({
    queryKey: ["drives", params],
    queryFn: () => apiFetch<Page<DriveCard>>(`/api/drives${qs(params)}`),
  });
}

export function useDrive(id: string | null) {
  return useQuery<DriveDetail>({
    queryKey: ["drive", id],
    queryFn: () => apiFetch<DriveDetail>(`/api/drives/${id}`),
    enabled: !!id,
  });
}

export function useCreateDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDrivePayload) =>
      apiFetch<{ id: string }>("/api/drives", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drives"] }),
  });
}

export function useUpdateDrive(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CreateDrivePayload>) =>
      apiFetch(`/api/drives/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drives"] });
      qc.invalidateQueries({ queryKey: ["drive", id] });
    },
  });
}

export function useSubmitDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/drives/${id}/submit`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drives"] }),
  });
}

export function useDriveDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      apiFetch(`/api/drives/${id}/decision`, { method: "POST", body: { approve, note } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drives"] });
      qc.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
  });
}

export function useUpdateStage(driveId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, status }: { stageId: string; status: StageStatusApi }) =>
      apiFetch(`/api/drives/${driveId}/stages/${stageId}`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drive", driveId] });
      qc.invalidateQueries({ queryKey: ["drives"] });
    },
  });
}

export function useApplicants(driveId: string | null, params: Params = {}) {
  return useQuery<Page<ApplicantRow>>({
    queryKey: ["applicants", driveId, params],
    queryFn: () => apiFetch<Page<ApplicantRow>>(`/api/drives/${driveId}/applicants${qs(params)}`),
    enabled: !!driveId,
  });
}

// ---------- applications ----------

export function useApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driveId: string) =>
      apiFetch(`/api/drives/${driveId}/apply`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drives"] });
      qc.invalidateQueries({ queryKey: ["myApplications"] });
      qc.invalidateQueries({ queryKey: ["studentDashboard"] });
    },
  });
}

export function useMyApplications() {
  return useQuery<MyApplication[]>({
    queryKey: ["myApplications"],
    queryFn: () => apiFetch<MyApplication[]>("/api/applications/mine"),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status?: ApplicationStatusApi;
      isShortlisted?: boolean;
      currentStageId?: string;
      note?: string;
    }) => apiFetch(`/api/applications/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applicants"] });
      qc.invalidateQueries({ queryKey: ["myApplications"] });
    },
  });
}

// ---------- directory / students (staff) ----------

export function useStudents(params: Params = {}) {
  return useQuery<Page<DirectoryStudentRow>>({
    queryKey: ["students", params],
    queryFn: () => apiFetch<Page<DirectoryStudentRow>>(`/api/students${qs(params)}`),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/students/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useBlockStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blocked, reason }: { id: string; blocked: boolean; reason?: string }) =>
      apiFetch(`/api/students/${id}/block`, { method: "POST", body: { blocked, reason } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });
}

// ---------- corrections ----------

export function useMyCorrections() {
  return useQuery<CorrectionRequest[]>({
    queryKey: ["corrections", "mine"],
    queryFn: () => apiFetch<CorrectionRequest[]>("/api/corrections/mine"),
  });
}

export function useCreateCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fieldName: string; requestedValue: string; reason?: string }) =>
      apiFetch("/api/corrections", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["corrections"] }),
  });
}

export function useCorrections(params: Params = {}) {
  return useQuery<Page<CorrectionRequest>>({
    queryKey: ["corrections", "all", params],
    queryFn: () => apiFetch<Page<CorrectionRequest>>(`/api/corrections${qs(params)}`),
  });
}

export function useReviewCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      apiFetch(`/api/corrections/${id}/review`, { method: "POST", body: { approve, note } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corrections"] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// ---------- credits ----------

export function useCredits(params: Params = {}) {
  return useQuery<Page<CreditRow>>({
    queryKey: ["credits", params],
    queryFn: () => apiFetch<Page<CreditRow>>(`/api/credits${qs(params)}`),
  });
}

export function useCreditHistory(studentId: string | null) {
  return useQuery<CreditEntry[]>({
    queryKey: ["creditHistory", studentId],
    queryFn: () => apiFetch<CreditEntry[]>(`/api/credits/${studentId}/history`),
    enabled: !!studentId,
  });
}

export function useAdjustCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      ...body
    }: {
      studentId: string;
      delta: number;
      reason: string;
      note?: string;
    }) => apiFetch(`/api/credits/${studentId}/adjust`, { method: "POST", body }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["creditHistory", vars.studentId] });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// ---------- events ----------

export function useEvents(params: Params = {}) {
  return useQuery<ApiEvent[]>({
    queryKey: ["events", params],
    queryFn: () => apiFetch<ApiEvent[]>(`/api/events${qs(params)}`),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/api/events", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/events/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

// ---------- dashboards ----------

export function useCompanyDashboard() {
  return useQuery<CompanyDashboard>({
    queryKey: ["companyDashboard"],
    queryFn: () => apiFetch<CompanyDashboard>("/api/dashboards/company"),
  });
}

export function useCoordinatorDashboard() {
  return useQuery<CoordinatorDashboard>({
    queryKey: ["coordinatorDashboard"],
    queryFn: () => apiFetch<CoordinatorDashboard>("/api/dashboards/coordinator"),
  });
}

export function useAdminDashboard() {
  return useQuery<AdminDashboard>({
    queryKey: ["adminDashboard"],
    queryFn: () => apiFetch<AdminDashboard>("/api/dashboards/admin"),
  });
}

// ---------- admin users / companies ----------

export function useAdminUsers(params: Params = {}) {
  return useQuery<Page<AdminUserRow>>({
    queryKey: ["adminUsers", params],
    queryFn: () => apiFetch<Page<AdminUserRow>>(`/api/admin/users${qs(params)}`),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; role?: string; status?: string; companyId?: string }) =>
      apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
}

export function useApprovedEmails() {
  return useQuery<ApprovedEmailRow[]>({
    queryKey: ["approvedEmails"],
    queryFn: () => apiFetch<ApprovedEmailRow[]>("/api/admin/approved-emails"),
  });
}

export function useAddApprovedEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { kind: "exact" | "domain"; value: string; roleHint?: string }) =>
      apiFetch("/api/admin/approved-emails", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvedEmails"] }),
  });
}

export function useDeleteApprovedEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/approved-emails/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvedEmails"] }),
  });
}

export function useCompanies() {
  return useQuery<CompanyRow[]>({
    queryKey: ["companies"],
    queryFn: () => apiFetch<CompanyRow[]>("/api/companies"),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; website?: string; industry?: string; location?: string }) =>
      apiFetch<CompanyRow>("/api/companies", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

// ---------- meta (form reference data) ----------

export interface MetaResponse {
  branches: { id: string; code: string; name: string }[];
  programs: { id: string; code: string; name: string }[];
  skills: { id: string; name: string }[];
}

export function useMeta() {
  return useQuery<MetaResponse>({
    queryKey: ["meta"],
    queryFn: () => apiFetch<MetaResponse>("/api/meta"),
    staleTime: 10 * 60 * 1000,
  });
}

// ---------- uploads ----------

/** Presign + PUT a file; resolves to the storage key to save on the record. */
export async function uploadFile(
  purpose: "resume" | "jd" | "logo",
  file: File
): Promise<string> {
  const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>(
    "/api/uploads/presign",
    { method: "POST", body: { purpose, fileName: file.name, contentType: file.type } }
  );
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  return key;
}

/** Get a short-lived download URL for a stored file key. */
export async function fileUrl(key: string): Promise<string> {
  const { url } = await apiFetch<{ url: string }>(`/api/files/presign${qs({ key })}`);
  return url;
}

// =========================== Phase 2 ===========================

// ---------- notifications ----------

export function useNotifications(params: Params = {}) {
  return useQuery<Page<NotificationItem>>({
    queryKey: ["notifications", params],
    queryFn: () => apiFetch<Page<NotificationItem>>(`/api/notifications${qs(params)}`),
  });
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiFetch<{ count: number }>("/api/notifications/unread-count"),
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useNotificationPreferences() {
  return useQuery<NotificationPreference[]>({
    queryKey: ["notificationPreferences"],
    queryFn: () => apiFetch<NotificationPreference[]>("/api/notifications/preferences"),
  });
}

export function useSetNotificationPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { category: string; enabled: boolean }) =>
      apiFetch("/api/notifications/preferences", { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificationPreferences"] }),
  });
}

// ---------- audit log ----------

export function useAuditLog(params: Params = {}) {
  return useQuery<Page<AuditEntry>>({
    queryKey: ["audit", params],
    queryFn: () => apiFetch<Page<AuditEntry>>(`/api/audit${qs(params)}`),
  });
}

export function useAuditSummary() {
  return useQuery<AuditSummary>({
    queryKey: ["auditSummary"],
    queryFn: () => apiFetch<AuditSummary>("/api/audit/summary"),
  });
}

// ---------- company contacts ----------

export function useContacts(params: Params = {}) {
  return useQuery<ContactCompanyRow[]>({
    queryKey: ["contacts", params],
    queryFn: () => apiFetch<ContactCompanyRow[]>(`/api/contacts${qs(params)}`),
  });
}

export function useContactDetail(companyId: string | null) {
  return useQuery<ContactDetail>({
    queryKey: ["contact", companyId],
    queryFn: () => apiFetch<ContactDetail>(`/api/contacts/${companyId}`),
    enabled: !!companyId,
  });
}

export function useAddContact(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      contactName: string;
      designation?: string;
      channel: string;
      note?: string;
      contactedOn: string;
    }) => apiFetch(`/api/contacts/${companyId}`, { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact", companyId] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// ---------- registrations (manage companies) ----------

export function useRegistrations(params: Params = {}) {
  return useQuery<Page<RegistrationRow>>({
    queryKey: ["registrations", params],
    queryFn: () => apiFetch<Page<RegistrationRow>>(`/api/registrations${qs(params)}`),
  });
}

export function useCreateRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRegistrationPayload) =>
      apiFetch("/api/registrations", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registrations"] }),
  });
}

export function useUpdateRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/registrations/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registrations"] }),
  });
}

export function useRegistrationResponses(registrationId: string | null) {
  return useQuery<RegistrationResponseRow[]>({
    queryKey: ["registrationResponses", registrationId],
    queryFn: () => apiFetch<RegistrationResponseRow[]>(`/api/registrations/${registrationId}/responses`),
    enabled: !!registrationId,
  });
}

// ---------- logistics ----------

export function useLogistics() {
  return useQuery<LogisticsResponse>({
    queryKey: ["logistics"],
    queryFn: () => apiFetch<LogisticsResponse>("/api/logistics"),
  });
}

export function useSaveLogistics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LogisticsUpdatePayload) =>
      apiFetch("/api/logistics", { method: "PUT", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logistics"] }),
  });
}

export function useAddVisitingMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; designation?: string; phone?: string; email?: string }) =>
      apiFetch("/api/logistics/team", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logistics"] }),
  });
}

export function useRemoveVisitingMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/logistics/team/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logistics"] }),
  });
}

// ---------- global export ----------

/** Trigger a CSV/JSON export download for a dataset. */
export async function exportDataset(
  dataset: "students" | "companies",
  params: Record<string, string | undefined> = {}
): Promise<void> {
  const url = `${API_URL}/api/export/${dataset}${qs({ ...params, format: "csv" })}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, "Export failed");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `${dataset}-export.csv`;
  a.click();
  URL.revokeObjectURL(href);
}
