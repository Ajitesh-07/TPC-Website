# Frontend Data Requirements — Consolidated API Design Input

Consolidated from per-page extractions of the four portal role groups in `frontend-next/app/(portal)` (student, company, coordinator, admin/super-admin) cross-referenced against the backend inventory (`backend/prisma/schema.prisma`, `backend/src/routes`, existing endpoints).

**Kind legend**
- **API** — real data the API must return (backed by a Prisma field or join).
- **server-computed** — must be computed by the API (aggregate, eligibility, completeness); no stored column.
- **derived (client)** — display-only; the frontend derives it from API data (initials, tones, icons, formatted dates, class names). The API must NOT ship CSS tokens, icon names, or preformatted strings.

---

## 1. Entity field tables

### 1.1 student (Prisma: `Student` + `User`)

| Field | Kind | Backing / notes | Used by |
|---|---|---|---|
| id | API | `Student.id` — stable key for view/edit rows (mocks key on roll/index) | all student-referencing pages |
| name | API | `User.fullName` | all |
| rollNo | API | `Student.rollNo` | dashboard, profile, directories, applicant views |
| officialEmail / email | API | `User.email` | profile locked panel, directories, applicant modal |
| program | API | `Program` via `Student.programId` (e.g. "B.Tech") | profile, drive tags |
| branch | API | `Branch` via `Student.branchId` (code + name) | profile, directories, applicant tables |
| batchYear | API | `Student.batchYear`; "2021 – 2025" display derived | profile |
| cpi | API (number) | `Student.cpi` — directories' `cgpa`/string "8.92" is the same field; send number | profile, directories, applicant tables, workspace |
| activeBacklogs | API | `Student.activeBacklogs`; "No Active Backlogs" label derived | profile locked panel |
| emailVerified | API | `Student.emailVerified`; chip text derived | student-dashboard |
| btechVerified | API | `Student.btechVerified`; "Verified" badge/tone derived | student-dashboard, profile |
| placementStatus | API (enum) | `PlacementStatus(unplaced\|placed\|higher_studies\|opted_out\|debarred)` | dashboard, profile, directories |
| isBlocked (+blockedReason) | API | `Student.isBlocked` — frontend "restricted"/"Restricted" status | dashboard banner, directories |
| creditBalance | API (number) | `Student.creditBalance` — see warning W5 (ledger vs balance, sign, clamping) | profile ("placementCredits"), credit-management, super-admin directory |
| completeness (0–100) | server-computed | **no Prisma field** — compute from profile-field fill state (W1) | student-dashboard |
| hasUnreadNotifications | server-computed | aggregate over `Notification.isRead` for the user | student-dashboard bell dot |
| directoryStatus (Placed\|Unplaced\|Shortlisted\|Assessment\|Restricted) | server-computed | composite of placementStatus + isBlocked + application aggregates (W4) | coordinator student-profiles, super-admin directory |
| phone | API | `Student.phone` | profile editable, applicant modal |
| altEmail | API | `Student.altEmail` | profile editable |
| preferredLocation | API | `Student.preferredLocation` (string; UI shows comma-separated) | profile, applicant modal |
| skills | API (string[]) | normalized `StudentSkill`→`Skill`; UI joins to comma string (W14) | profile, applicant modal |
| linkedinUrl, githubUrl | API | `Student` fields; `https://` prefixing derived | profile, applicant modal |
| resumeUrl | API | `Student.resumeUrl`; serve downloads via `presignDownload` | profile, applicant modal |
| creditStatusBand (Healthy/Low/Critical) | derived (client) or server band | thresholds (<=15 critical, <=40 low) live in the page; expose as band param/field if super-admin badges must stay consistent | credit-management |
| initials, avatar/badge classNames, icons, tones | derived (client) | from name / branch / status enums | everywhere |

### 1.2 drive (Prisma: `Drive` + relations)

| Field | Kind | Backing / notes | Used by |
|---|---|---|---|
| id | API | `Drive.id` — apply target, selector value, row chevron nav (mocks omit it in coordinator lists) | all drive pages |
| title (role) | API | `Drive.title` | all |
| company {id, name, logoUrl} | API | `Company` join; monogram/initials derived | all |
| description (about / jdText) | API | `Drive.description` | catalogue modal, company-drives, JAF rehydrate |
| processType | API (enum) | `DriveProcessType(internship\|six_month_fte\|six_month_ppo\|fte)`; display labels ("6M + FTE") derived. JAF `roleType` mismatch — W12 | catalogue, company-drives, add-drive, JAF |
| ctcLpa | API (number) | `Drive.ctcLpa` — canonical numeric; "₹32.5 LPA" display + ctcValue sort key derived | catalogue, company-drives, workspace, JAF |
| stipendPerMonth | API (number, optional) | `Drive.stipendPerMonth` | add-drive, JAF |
| location | API | `Drive.location` | catalogue modal, company-drives |
| applicationDeadline | API (ISO) | `Drive.applicationDeadline`; deadline display, daysLeft, closingSoon, deadlineTone all derived | catalogue, company-drives, workspace, dashboards |
| status | API (enum) | `DriveStatus(draft\|pending_approval\|open\|closed\|completed\|cancelled)`; frontend tabs upcoming/ongoing/closed and labels like "Shortlisting" need an explicit mapping (W13). JAF 4-stage tracker index derived from this enum | catalogue tabs, company-drives badge, JAF tracker |
| minCpi, allowBacklog, customRules | API | `Drive` fields; modal "eligibility" criteria list derived from these + branches/programs | catalogue modal, add-drive, JAF |
| eligibleBranches / eligiblePrograms | API | `DriveEligibleBranch` / `DriveEligibleProgram`; card `tags` (['B.Tech','CSE']) derived | catalogue, add-drive |
| eligible (per current student) | API | `DriveEligibility.isEligible` (server-evaluated) | catalogue, student-dashboard eligible drives |
| ineligibleReason | API | `DriveEligibility.reasons` is `String[]`; UI renders one string — join/pick (W17) | catalogue |
| hasApplied (per student) | server-computed | existence of `Application[driveId,studentId]` — not in mock but required for the Apply button | catalogue |
| applicantsCount / inProcessCount / shortlistedCount | server-computed | aggregates over `Application` | company-drives, coordinator dashboard, workspace |
| timeline / dates | API | `DriveStage` rows — see §1.3 | catalogue modal, company-drives milestones, workspace |
| documents | API | `DriveDocument` {id, name, url (presigned), mimeType, sizeBytes}; `meta`/`icon` derived. Mock has `url='#'` — API must supply real URLs (W15) | catalogue modal |
| openings | **MISSING** | add-drive collects it; `Drive` has no column (W2) | add-drive |
| seasonId, createdBy, approvedBy/approvedAt | API | `Drive` fields | scoping, JAF/add-drive lifecycle |
| postedOn | API (optional) | `Drive.createdAt`; never rendered on company-drives today | company-drives type |
| hrContact (name/email/phone) | API | `CompanyPoc` or `Recruiter` (add-drive collects per-drive HR contact — decide where it persists) | add-drive |

### 1.3 stage (Prisma: `DriveStage`)

| Field | Kind | Backing / notes |
|---|---|---|
| id, driveId | API | `DriveStage` — mock milestone cards key on label; API must send id |
| type | API (enum) | `StageType(registration\|ppt\|online_assessment\|group_discussion\|shortlisting\|interview\|offer)`; `DATE_ICON` mapping derived |
| label | API | `DriveStage.label` (e.g. "Online Assessment") |
| sequence | API | `[driveId, sequence]` unique — ordering for the workspace pipeline |
| status | API (enum) | `StageStatus(upcoming\|ongoing\|completed\|skipped)`; badge tone/label (`STAGE_TONE`/`STAGE_LABEL`) derived |
| scheduledAt | API (ISO) | display date strings derived |
| location | API | optional |
| done | derived (client) | `status === 'completed'` |
| completedStageCount ("X of Y") | derived (client) | count over stages |

### 1.4 application (Prisma: `Application`)

| Field | Kind | Backing / notes |
|---|---|---|
| id, driveId, studentId | API | `Application`; unique `[driveId, studentId]` |
| status | API (enum) | `ApplicationStatus(applied\|under_review\|shortlisted\|interview\|offered\|accepted\|rejected\|withdrawn)`; label/tone (BadgeTone) derived. Frontend also renders **"Assessment"** — no enum value (W3) |
| isShortlisted | API | `Application.isShortlisted` — workspace toggle; must stay consistent with status (treat shortlisting as a status transition) |
| currentStage / currentStageId | API | source for stage-derived display statuses (e.g. "Assessment") |
| appliedAt | API (ISO) | "Applied" column / "Oct 12, 2024" display derived |
| drive {company, title} | API join | student-dashboard recent applications |
| student embed | API join | name, rollNo, branch, cpi, email, phone, preferredLocation, skills[], linkedinUrl, githubUrl, resumeUrl — company-drives applicant modal, workspace table |
| statusHistory | API | `ApplicationStatusHistory` (implied; keeps badge consistent after transitions) |

### 1.5 event (Prisma: `Event`)

| Field | Kind | Backing / notes |
|---|---|---|
| id | API | `Event.id`; ICS UID `<id>@tpc.iitp.ac.in` derived. Company itinerary keys on title today — needs id |
| type | API (enum) | `EventType(ppt\|oa\|interview\|deadline\|result\|other)`; `typeLabel`, dot/badge colours, legend mapping derived |
| scope | API (enum) | `EventScope(global\|branch\|drive\|personal)` — personal events from Add Event; feed merges institutional + personal |
| title, detail | API | `detail` is not rendered in the calendar list UI but IS consumed by ICS/Google-Calendar export — must be in the read payload |
| eventDate, startTime, endTime | API | ISO date + optional HH:MM; "All day", "start – end", prettyDate, relative labels ("Today, 10:00 AM"), `active`/proximity dot colours all derived |
| location (venue) | API | also used as Google Cal location / ICS LOCATION; admin `venue` is the same field |
| driveId, ownerUserId, createdBy | API | scoping; itinerary role-tag chip derived from drive join |
| meetingLink | **MISSING** | student-dashboard "Join Meeting Link" needs a URL; `Event` only has `location` (W9) |

### 1.6 creditTransaction (Prisma: `CreditTransaction`)

| Field | Kind | Backing / notes |
|---|---|---|
| id, studentId, seasonId | API | append-only ledger |
| delta | API (signed number) | +prefix formatting, success/error tone, timeline dot colour all derived |
| balanceAfter | API | server-derived on write; `Student.creditBalance` has **no trigger** — service must maintain it (W5) |
| reason | API | required, from the reason catalog — catalog itself has no model (W6) |
| note | **MISSING** | collected by the credit-management form, dropped by the mock; `CreditTransaction` has no column (W6) |
| createdBy | API | actor; display "Dr. Mehta (Admin)" derived from User join (name + role) |
| createdAt | API (ISO) | "2026-05-28" display derived |

### 1.7 correctionRequest (Prisma: `DataCorrectionRequest`)

| Field | Kind | Backing / notes |
|---|---|---|
| id, studentId | API | |
| fieldName | API | frontend "field" (e.g. "CPI Update Request" → target locked field) |
| currentValue, requestedValue, reason | API | frontend "detail" maps to requestedValue + reason |
| status | API (enum) | `CorrectionStatus(pending\|approved\|rejected)`; badge style (`REQUEST_STYLES`) derived |
| createdAt | API (ISO) | "submitted" display (relative/absolute) derived |
| reviewedBy, reviewedAt | API | server-set on coordinator/admin decision |

### 1.8 user (Prisma: `User` + `ApprovedEmail` + `MasterDataUpload` + `AuditLog`)

| Field | Kind | Backing / notes |
|---|---|---|
| id, email, fullName, role, status | API | `UserRole(student\|company\|coordinator\|admin\|super_admin)`, `UserStatus(active\|revoked\|pending)` — UI only handles Active/Revoked (W16); status badge icon/tone derived |
| lastLoginAt | API | available if user-management wants it |
| adminProfile.department | **MISSING** | admin-dashboard shows it; `User` has no department and there is no Admin profile model (W10) |
| roleOption catalog | API or shared module | duplicate of `lib/roles.ts` ROLE_META — single-source |
| roleChangeAudit {user, actionType, newRole, timestamp} | API | needs `AuditLog` rows written on role mutations — **no audit-log writes exist yet** (W11) |
| approvedEmail {id, kind, value, roleHint} | API | `ApprovedEmail`; mock derives kind from `'@'` prefix — Prisma stores the enum; normalize lowercase + dedupe server-side |
| uploadRecord {id, fileName, type, uploadedBy, date, rows} | API | `MasterDataUpload` — fields unverified in inventory (W15); upload form has no type selector but every record has one |
| initials, status/avatar classNames | derived (client) | |

### 1.9 company (Prisma: `Company` + `CompanyPoc`)

| Field | Kind | Backing / notes |
|---|---|---|
| id, name, slug | API | banner h1, PortalHeader subtitle |
| website, industry, logoUrl, description | API | banner subtitle, add-drive basic info |
| location | **MISSING** | banner shows "Bangalore, India"; `Company` has no location/HQ field (W7) |
| pocs [{id, name, designation, phone, email}] | API | `CompanyPoc` (TPC points of contact); initials, `tel:`/`mailto:` hrefs derived |

### 1.10 recruiter (Prisma: `Recruiter`)

| Field | Kind | Backing / notes |
|---|---|---|
| id, userId, companyId | API | |
| designation, phone | API | |
| name, email | API join | via `User` |
| hrAvatarUrl | **MISSING** | HR profile photo rendered on company-dashboard; no avatar field on Recruiter or User (W8) |

---

## 2. Required mutations (all pages)

| # | Action | Actor role(s) | Payload | Backing / notes |
|---|---|---|---|---|
| M1 | save-student-profile | student | phone, altEmail, preferredLocation, skills[], linkedinUrl, githubUrl, resumeUrl | PATCH on `Student`; skills upserted into `StudentSkill` (W14). One write for the whole Professional Details section |
| M2 | upload-resume | student | file (PDF) | `presignUpload` flow → save `resumeUrl` (storage lib exists; no upload endpoint yet) |
| M3 | create-correction-request | student | fieldName, requestedValue/detail (+reason) | `DataCorrectionRequest`; status/createdAt server-set |
| M4 | apply-to-drive | student | driveId (student from auth) | creates `Application`; enforce unique [driveId, studentId], status=open, isEligible |
| M5 | add-personal-event | student (any portal user) | title, type, date, start?, end?, location? | `Event` scope=personal, ownerUserId=auth; return server id (mock generates client ids) |
| M6 | update-company-profile | company | name, location*, industry, hrAvatar* | *no `Company.location` / avatar columns — W7/W8 |
| M7 | save-jaf-draft | company | jobTitle, roleType, workLocation, baseCtcLpa, stipendPerMonth?, jdText, jdFileRef?, minCgpa, applicationDeadline, oaDate, interviewDate, resultDate | `Drive` status=draft; also where the dashboard "Upload New JD" quick action lands. roleType enum mismatch — W12 |
| M8 | upload-jd-document | company | file (PDF/DOCX ≤5MB), driveId | `DriveDocument` via `presignUpload`; returns jdFileRef/url |
| M9 | publish-announcement | company | announcementId (or full field set) | `Drive.status` draft → pending_approval |
| M10 | save-drive-draft | coordinator | full add-drive payload: company info (name/industry/logoUrl/website), hrContact{name,email,phone}, jobTitle, roleDescription, openings*, location, baseCtcLpa, stipendPerMonth?, processType, eligibility{branches[], minCpi, allowActiveBacklog, degreeTypes[], customRules}, timeline{4 dates} | status=draft; must accept partial payloads (Save as Draft on step 1 and step 5). *openings has no column — W2 |
| M11 | submit-drive-for-approval | coordinator | same payload as M10 | status=pending_approval; draft editable until approved ⇒ also an update-draft (PUT) variant |
| M12 | set-drive-stage-status | coordinator | driveId, stageId/sequence, status (completed \| ongoing) | `DriveStage.status`; setting ongoing demotes any other ongoing stage server-side |
| M13 | toggle-applicant-shortlist | coordinator | driveId, applicationId, shortlisted:boolean | implement as `Application` status transition (+ `isShortlisted`) so the badge stays consistent (mock diverges) |
| M14 | publish-results | coordinator | driveId, stage, publish:true | shortlist publication ("Review & Publish") |
| M15 | verify-student-profile | coordinator/admin | studentId, decision (approve \| reject) | verification queue; sets btechVerified / review state |
| M16 | adjust-credits | admin, super_admin | studentId (or rollNo), delta (signed int), reason (required, catalog), note? | one endpoint serves both the credit-management modal and the super-admin quick widget (widget collects no reason — API should still require one). Server-derived: createdBy, createdAt, balanceAfter; service must update `Student.creditBalance` (no trigger). Response: updated student + created `CreditTransaction` (W5/W6) |
| M17 | change-user-role | super_admin (admin?) | userId, role | user-management inline select + super-admin "+" button; must write `AuditLog` to feed the role-change panel (W11) |
| M18 | toggle-user-status (revoke/restore) | super_admin/admin | userId, status (active \| revoked) | `User.status` |
| M19 | edit-student-directory-row | super_admin | studentId, changed fields (status, credits — unspecified in mock) | per-row pencil stub |
| M20 | add-approved-email | admin/super_admin | value (exact email or '@domain'), roleHint? | `ApprovedEmail`; normalize lowercase, reject duplicates server-side |
| M21 | remove-approved-email | admin/super_admin | id (or value) | DELETE |
| M22 | upload-master-data | admin/super_admin | multipart file (CSV/XLSX ≤10MB), type (Student/Company/Credit-Ledger/Staff Master) | `MasterDataUpload`; server-derived uploadedBy/date/rows; type must be explicit or inferred (form lacks a selector) |
| M23 | export-report | coordinator, admin | season, reportType/format | GET file download (coordinator "Export Report" + admin "export-operations-report"); exports queue/worker is a stub |
| M24 | export-student-directory | super_admin | current filters/search, format (csv) | GET file download |

**Total: 24 distinct mutations** (22 writes + 2 export downloads; M16/M17/M23 each consolidate duplicate page-level actions).

---

## 3. Aggregate / dashboard reads (non-single-entity → dashboard endpoints)

Common metric contract: `{ key, value:number, delta:{ value, direction, contextText } }` — icons, classNames, tones are client-side mappings from `key` + `direction`.

| Endpoint (suggested) | Aggregates |
|---|---|
| `GET /api/dashboard/student` | appliedCount, shortlistedCount (counts over own applications — hardcoded '12'/'03' today); profile completeness; hasUnreadNotifications; nextInterview {eventId, drive/company+role, scheduledAt ISO, meetingLink}; eligible-drives top-3; reminders[] (semantic kind + urgency enum, not icons/CSS — no backing model, see W11-adjacent note); upcoming schedule top-3 events |
| `GET /api/dashboard/company` | totalApplicants + week-over-week %, ongoingDrives {count, roleNames[]}, per-role live stats [{driveId, role, applicants, shortlisted}] (progressPct derived), campus itinerary (events for company's drives), activity feed [{id, type enum (jd_approved \| new_registration \| action_required), message, subject, createdAt}] |
| `GET /api/dashboard/coordinator` | activeDrives count; pendingApplications {count, companyCount} ("Across 8 companies"); offersMade YTD; upcomingInterviews (next-48h window); ongoing drives top-N {id, company, role, status, applicantsCount}; upcoming events top-N; pendingActions {shortlistsReadyToPublish [{driveId, company}], verificationQueueCount} |
| `GET /api/dashboard/admin` | ongoingDrives, activeCompanies, registeredStudents (+"% of batch"), pendingApprovals; this-week events (same `Event` entity — serve via events endpoint with date-range params); seasonSnapshot {drivesCompleted, offersRolledOut, seasonLabel} |
| `GET /api/dashboard/super-admin` | totalPlacements, activeCompanies, flaggedProfiles, avgCredits (+deltas); recentRoleChanges top-N (AuditLog-backed, "View All Roles" ⇒ paginated list endpoint); placementTrajectory series (?academicYear=) — no stats model, aggregate from Offer/Application (W18) |
| Folded into drive endpoints | per-drive: applicantsCount, inProcessCount, shortlistedCount, hasApplied (per student), completedStageCount; per-role applicant stats |
| List metadata (all directories) | totalCount + pagination ("{n} total", "Showing X–Y of N", "Showing X of Y users") and server-side `?q=` search for: student directories (name/roll[/branch]), user management (name/email), credit table (name/roll + reason + band filters), applicant tables (name/roll/branch), drive catalogue (company/role + status tab + eligibleOnly + sort) |

---

## 4. Mismatch warnings vs backend inventory

- **W1**: Student profile `completeness` (0–100) has no Prisma field — must be computed server-side from profile-field fill state.
- **W2**: `Drive.openings` (add-drive collects number ≥1) has no column on the Drive model.
- **W3**: Frontend application status "Assessment" has no `ApplicationStatus` enum value — derive from `currentStage.type=online_assessment` or extend the enum.
- **W4**: Directory student status (Placed|Unplaced|Shortlisted|Assessment|Restricted) is a composite with no single field — placementStatus + isBlocked + application aggregates.
- **W5**: Credit models disagree: super-admin directory shows negative credits ('-150') while credit-management clamps balance at 0; `Student.creditBalance` is not auto-maintained (no trigger) — CreditsService must own one canonical numeric model.
- **W6**: `CreditTransaction` has no `note` column (form collects reason AND optional note; mock drops note), and the credit reason catalog (CREDIT_REASONS) has no model/enum.
- **W7**: `Company` has no `location` field, but the company-dashboard banner displays one.
- **W8**: No avatar field on Recruiter or User for the rendered HR avatar (`hrAvatarUrl`).
- **W9**: `Event` has no `meetingLink`; the student-dashboard "Join Meeting Link" must overload `Event.location` or a new column is needed.
- **W10**: Admin profile shows `department`, but `User` has no department and there is no Admin profile model (only `Coordinator.department`).
- **W11**: Student-dashboard reminders, company-dashboard activity feed, and super-admin role-change feed have no source model — need Notification/AuditLog derivation, but the inventory says no audit-log writes exist yet.
- **W12**: JAF `roleType` (ft|intern|intern_ft) does not match `DriveProcessType` (internship|six_month_fte|six_month_ppo|fte) — align enums (coordinator add-drive already mirrors the 4-value enum).
- **W13**: Frontend drive tabs upcoming|ongoing|closed and labels like "Shortlisting"/"Open" don't map 1:1 to `DriveStatus` — need an explicit status mapping plus a stage-derived display status.
- **W14**: Skills are edited as a comma-separated string but stored normalized (`StudentSkill`/`Skill`) — API must accept `string[]` and upsert.
- **W15**: `DriveDocument` and `MasterDataUpload` field lists are unverified in the inventory — confirm they carry name/mimeType/sizeBytes/storage-key (mock document URLs are `href='#'`) and fileName/type/uploadedBy/rows respectively; serve files via `presignDownload`.
- **W16**: `UserStatus` includes `pending`, which the user-management UI doesn't handle (strict Active|Revoked).
- **W17**: `DriveEligibility.reasons` is `String[]` but drive-catalogue renders a single `ineligibleReason` string — join or pick server-side.
- **W18**: Placement trajectory chart has no stats model — aggregate from Offer/Application at query time (or add a snapshot table).
