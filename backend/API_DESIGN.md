# TPC Backend — API Design Contract (core placement flow)

This is the implementation contract for backend modules and frontend hooks.
Scope: **core placement flow** (auth ✓, profiles, drives, applications, credits,
calendar, directory, corrections, user management, dashboards, uploads).
Phase 2 (out of scope here): forms engine, logistics, notifications fan-out,
CSV/XLSX export jobs, audit-log UI, contact-log UI, master-data processing.

## Conventions

- JSON, camelCase. Dates/times ISO 8601 (timestamptz → `2026-06-12T09:00:00Z`, date → `2026-06-12`).
- IDs are UUID strings. Prisma `Decimal` (cpi, ctcLpa, stipendPerMonth) serialises as **number**.
- Lists are paginated: query `page` (1-based, default 1), `pageSize` (default 20, max 100);
  response `{ items: T[], total: number, page: number, pageSize: number }`.
- Errors (existing handler): `{ error: string, message?: string }`; zod failures →
  400 `{ error: "validation_error", issues }`.
- Roles (backend enum): `student | company | coordinator | admin | super_admin`.
  Frontend uses `super-admin` (hyphen) — **the FE maps** `_`↔`-`; API always uses underscore.
- Every route validates params/body with **zod**. UUID params validated as uuid.
- **Row-level authz lives in services** (pattern: `modules/drives/service.ts`):
  recruiter → own company only; coordinator → assigned drives only; student → self only.
  `requireRole(...)` is only the coarse gate.

## Cross-cutting infrastructure (built first, in `src/lib` / `src/middleware`)

### Cache (`lib/cache.ts`) — version-counter cache-aside, O(1) invalidation
- `cached<T>(entity: string, suffix: string, ttlSec: number, fn: () => Promise<T>): Promise<T>`
  - version = `GET v:<entity>` (default "1"); key = `c:<entity>:<version>:<suffix>`;
    hit → parse; miss → `fn()`, `SETEX`.
- `bump(entity: string)` → `INCR v:<entity>` (invalidates all keys of that entity instantly; no SCAN).
- Entities + TTLs (TTL is a backstop; bumps do the real invalidation):
  | entity | what | TTL | bumped by |
  |---|---|---|---|
  | `drives` | catalogue lists, per-role | 60s | drive create/update/submit/decision/stage change |
  | `drive:<id>` | detail incl stages/docs/applicant counts | 120s | same, + application changes for that drive |
  | `students` | directory lists | 60s | student PATCH/block, master changes |
  | `student:<id>` | profile, dashboard | 30s | profile PATCH, application create, credit adjust, correction review |
  | `events` | calendar reads | 60s | event create/update/delete |
  | `credits` | admin credit lists | 30s | credit adjust |
  | `users` | admin user lists | 60s | user PATCH, recruiter provision, approved-email change |
  | `dash:<role>` (+`:<userId>` for company/coordinator) | dashboards | 30s | relevant entity bumps (cheap: also bump on the same writes) |
- Cache failures (Redis down) must **fall through to the DB**, never error the request.

### CSRF / Origin guard (`middleware/originCheck.ts`)
Session cookie is `SameSite=None` (cross-origin SPA), so ambient-cookie CSRF is real.
Global `onRequest` hook: for `POST|PATCH|PUT|DELETE`, if an `Origin` header is present
and not in `env.corsOrigins` → 403. (Absent Origin = non-browser client = no ambient-cookie risk.)
Exempt: `/auth/callback`, `/auth/recruiter/verify` (top-level GET navigations anyway).

### Security headers
`@fastify/helmet` (new dep) with sensible API defaults (no CSP needed for a JSON API;
keep `crossOriginResourcePolicy: { policy: "cross-origin" }` off — API not serving assets).

### Audit (`lib/audit.ts`)
`audit(actor: AuthUser, action: AuditAction, opts: { targetTable?, targetId?, targetLabel?, details?, ip? })`
→ inserts `audit_logs` (fire-and-forget with `.catch(log)`; never blocks the response).
**Mandatory call sites:** credit adjust (`credit_adjustment`), role/status change (`role_change`),
block/unblock (`policy`), drive decision + correction review (`approval`), admin edits of
student academics (`data_edit`), presign issuance for sensitive files (`upload`),
logins (`login` — both flows).

### Rate limits
Global 100/min (exists). Tighter per-route configs: `POST /auth/recruiter/request` 5 / 15 min/IP;
`POST /api/drives/:id/apply` 20/min; `POST /api/uploads/presign` 20/min.

### Role cookie for the Next router guard
On successful login (both flows) ALSO set non-httpOnly cookie `tpc-role=<role>`
(same attributes as session, but readable). It is **UX routing only — never authz**.
`POST /auth/logout` clears both. Optional `COOKIE_DOMAIN` env for prod (AWS: set to the
parent domain so the FE host can read it; on localhost ports share the cookie jar).

### Credit-ledger trigger (manual SQL migration)
`prisma/migrations/<ts>_credit_trigger/migration.sql` (created via `prisma migrate dev --create-only`):
re-add `apply_credit_transaction()` BEFORE INSERT trigger on `credit_transactions`
(updates `students.credit_balance`, snapshots `balance_after`) — exactly as in `schema.sql` §15.2.

### Eligibility engine (`modules/eligibility/service.ts` + worker)
`computeForDrive(driveId)`: load drive (minCpi, allowBacklog, eligible branches/programs);
for every non-blocked student evaluate → upsert `drive_eligibility { isEligible, reasons[] }`.
Reasons (exact strings): `below-min-cpi`, `active-backlog`, `branch-not-eligible`,
`program-not-eligible`, `blocked`, `already-placed` (placementStatus=placed excluded when drive is FTE-type).
`computeForStudent(studentId)`: same evaluation across all `open|pending_approval` drives.
Enqueue BullMQ `eligibility` job on: drive decision=approve, drive eligibility-rule PATCH,
admin PATCH of student academics, block/unblock. Worker implements the processor (replaces stub).

### Uploads (`modules/uploads/routes.ts`)
- `POST /api/uploads/presign` (auth) `{ purpose: "resume"|"jd"|"logo", fileName, contentType }`
  - allowlist: resume → `application/pdf`; jd → pdf/docx; logo → png/jpeg/webp/svg.
  - student may presign `resume` only; company/coordinator/admin may presign `jd`/`logo`.
  - key = `<purpose>/<userId>/<uuid>-<sanitised fileName>`; respond `{ uploadUrl, key, expiresIn }`. Audit `upload`.
- `GET /api/files/presign?key=` (auth) → `{ url }` after authz:
  - `resume/*`: owner student; coordinator/admin/super_admin; recruiter **only if** an application
    links that student to one of the recruiter's company drives.
  - `jd/*`, `logo/*`: any authenticated user who can view the linked drive (simplify: any authed user).

## Requirements-audit deltas (from docs/frontend-data-requirements.md)

- **Schema additions** (migration `drive_openings_company_location`): `drives.openings int?`,
  `companies.location text?` — both appear in the UI and had no column.
- **Credit note** (W6): `POST /api/credits/:id/adjust` accepts optional `note`; stored appended
  to `reason` ("reason — note"). Ledger allows negative balances (admin UI may clamp display).
- **Derived display fields stay in FE mappers** (W3/W4/W13/W17): application "Assessment" ←
  `currentStage.type === "online_assessment"`; directory composite status ← placementStatus +
  isBlocked + application aggregates; catalogue tabs upcoming/ongoing/closed ← DriveStatus +
  deadline + ongoing stage; `ineligibleReason` ← `reasons.join("; ")`.
- **Reminders/activity feeds** (W11): student reminders derived in FE from dashboard
  `upcomingEvents` + deadlines; company activity feed deferred to phase 2 (notifications);
  admin "recent role changes" served from `audit_logs` (we now write `role_change`).
- **Event meeting links** (W9): URLs go in `events.location`; FE renders as link when `http*`.
- Out of scope (display-only / phase 2): recruiter avatars (W8), admin department (W10),
  placement trajectory chart (W18), master-upload processing (W15).

## Endpoints

### Me / student self-service (`modules/students`)
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/me` | any (exists) | extend student profile to include `branch {id,code,name}`, `program {…}`, `skills: string[]` |
| PATCH | `/api/me/profile` | student | body: `phone?, altEmail?, resumeKey?, linkedinUrl?, githubUrl?, preferredLocation?, skills?: string[]` (skills replace-set; unknown names created in `skills` table). Locked fields rejected. Bump `student:<id>` |
| GET | `/api/me/dashboard` | student | cached `student:<id>:dash`. Returns: `{ profile: {…flags, completeness}, counts {applied, shortlisted}, eligibleDrives: DriveCard[≤6], applications: ApplicationRow[≤8], upcomingEvents: Event[≤5] }`. `completeness` computed: % of [phone, altEmail, resumeKey, linkedinUrl, githubUrl, preferredLocation, ≥3 skills] present |
| POST | `/api/corrections` | student | `{ fieldName ∈ [cpi, branch, program, batchYear, name, rollNo], requestedValue, reason? }` |
| GET | `/api/corrections/mine` | student | |

### Directory & admin over students (`modules/students`)
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/students` | coordinator, admin, super_admin | `search` (name/roll/email), `branch` (code), `placementStatus`, pagination. Cached `students` |
| GET | `/api/students/:id` | coordinator, admin, super_admin | full profile + skills + creditBalance |
| PATCH | `/api/students/:id` | admin, super_admin | academic fields: `cpi?, branchId?, programId?, batchYear?, activeBacklogs?, placementStatus?, btechVerified?`. Audit `data_edit`; enqueue eligibility; bump `students`, `student:<id>` |
| POST | `/api/students/:id/block` | admin, super_admin | `{ blocked: boolean, reason? }`. Audit `policy`; eligibility job |
| GET | `/api/corrections` | admin, super_admin | `status` filter, pagination |
| POST | `/api/corrections/:id/review` | admin, super_admin | `{ approve: boolean, note? }`. On approve: if fieldName ∈ {cpi, batchYear} apply numeric value; else leave manual. Audit `approval`; bump `student:<id>` |

### Drives (`modules/drives`, extends existing)
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/drives` | any authed | role-scoped (existing logic) + filters `status, processType, search, sort ∈ [deadline, ctc, company]`, pagination. **Student**: only `open`, each item includes `eligibility { isEligible, reasons }` from cache table + `hasApplied`. Cached `drives:<role-scope-hash>` |
| GET | `/api/drives/:id` | any authed (service-checked) | + `stages[] (ordered)`, `documents[]`, `company {id,name,logoUrl,industry}`, student extras as above. Cached `drive:<id>` |
| POST | `/api/drives` | company, coordinator, admin | create **draft**. Body: `title, description?, processType, location?, ctcLpa?, stipendPerMonth?, minCpi?, allowBacklog, customRules?, applicationDeadline?, branchIds[], programIds[], skillNames[], stages: [{type, label?, sequence, scheduledAt?, location?}], companyId` (recruiter: forced to own company) |
| PATCH | `/api/drives/:id` | owner recruiter (draft/pending), assigned coordinator, admin | partial of the create body. If eligibility-rule fields change on an open drive → eligibility job. Bump `drives`, `drive:<id>` |
| POST | `/api/drives/:id/submit` | owner recruiter, assigned coordinator | draft → pending_approval |
| POST | `/api/drives/:id/decision` | admin, super_admin | `{ approve: boolean, note? }` → `open` / `cancelled`. Audit `approval`. On approve: eligibility job. Bumps |
| PATCH | `/api/drives/:id/stages/:stageId` | assigned coordinator, admin | `{ status }`; setting `ongoing` demotes any other ongoing stage to `completed` if earlier / leaves later ones. Bump `drive:<id>` |
| GET | `/api/drives/:id/applicants` | company (own), coordinator (assigned), admin | extend existing: `search`, `status` filter, pagination; rows include student `{id, rollNo, user.fullName, branch.code, cpi, resumeUrl?}` + application `{id, status, isShortlisted, appliedAt, currentStageId}` |

### Applications (`modules/applications`)
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/api/drives/:id/apply` | student | Guards: drive open, deadline not passed, not blocked, `drive_eligibility.isEligible`, no existing application. Creates application + history row. Bump `drive:<id>`, `student:<sid>` |
| GET | `/api/applications/mine` | student | with `drive { id, title, company { name } , status }` |
| PATCH | `/api/applications/:id` | student (own: only `{status: "withdrawn"}`), company (own company), coordinator (assigned), admin | `{ status?, isShortlisted?, currentStageId?, note? }` → history row on status change. Bumps |

### Credits (`modules/credits`)
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/credits` | admin, super_admin | list students with `creditBalance`, last transaction `{delta, reason, createdAt}`; `search`, `reason` filter, `band ∈ [healthy, low, critical]` (≥40 / 16–40 / ≤15). Cached `credits` |
| GET | `/api/credits/:studentId/history` | admin, super_admin | ledger rows desc + `createdByUser.fullName` |
| POST | `/api/credits/:studentId/adjust` | admin, super_admin | `{ delta: int ≠ 0, reason: nonempty }`. Insert ledger row (DB trigger maintains balance). Audit `credit_adjustment`. Bump `credits`, `student:<id>` |

### Calendar (`modules/events`)
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/events?from&to` | any authed | role-scoped visibility: student → `global` + `branch`(their branch) + `drive`(drives they applied to or are eligible for) + `personal`(own); company → global + own-company drive events; staff → all. Cached `events:<role>:<uid>:<from>:<to>` |
| POST | `/api/events` | any authed | student/company: `scope: "personal"` forced, owner=self. coordinator/admin: also `global`/`branch`(branchIds[])/`drive`(driveId). super_admin: any |
| PATCH | `/api/events/:id` | owner (personal), creator/staff (org), super_admin | |
| DELETE | `/api/events/:id` | same as PATCH | |

### Dashboards (`modules/dashboards`) — read-only aggregates, all cached 30s
| Path | Role | Payload |
|---|---|---|
| `/api/dashboards/company` | company | `{ company {name, logoUrl, industry, location?}, drives: [{id, title, status, applicants, shortlisted}], itinerary: Event[≤6], pocs: CompanyPoc[] }` |
| `/api/dashboards/coordinator` | coordinator | `{ metrics { activeDrives, pendingApplications, offersMade, upcomingInterviews }, drives: [{id, company, title, status, applicants}], schedule: Event[≤6] }` |
| `/api/dashboards/admin` | admin, super_admin | `{ stats { totalPlacements, activeCompanies, registeredStudents, pendingApprovals }, pendingDrives: [{id, company, title, submittedAt}], upcomingEvents: Event[≤6], recentRoleChanges: AuditRow[≤5] }` |

### User management (`modules/adminUsers`)
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/admin/users` | super_admin | `search`, `role` filter, pagination. Cached `users` |
| PATCH | `/api/admin/users/:id` | super_admin | `{ role?, status? ∈ [active, revoked] }`; role→company requires `companyId` (creates recruiter profile); role→student requires existing student row else 409. Audit `role_change`. Bump `users` |
| POST | `/api/admin/recruiters` | admin, super_admin | provision: `{ email, fullName, designation?, companyId }` XOR `{ …, newCompany: { name, website?, industry? } }` → user(role=company, provider=email) + recruiter. Audit `role_change` |
| GET/POST | `/api/admin/approved-emails` | super_admin | POST `{ kind, value, roleHint? }` |
| DELETE | `/api/admin/approved-emails/:id` | super_admin | |
| GET | `/api/companies` | company sees own; coordinator/admin/super_admin all | for Add-Drive select |
| POST | `/api/companies` | coordinator, admin, super_admin | `{ name, website?, industry?, logoKey? }` |

## Frontend integration contract

- `frontend-next/lib/api.ts`: `apiFetch<T>(path, init?)` — base `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"`,
  always `credentials: "include"`, JSON in/out, throws `ApiError { status, message }`.
- `frontend-next/lib/hooks/*.ts`: TanStack Query hooks per endpoint; query keys mirror cache entities
  (`["drives", params]`, `["drive", id]`, `["me"]`, …); mutations invalidate the matching keys.
- `RoleProvider`: on mount call `/api/me`; map `super_admin → "super-admin"`. States:
  `loading | authed(user) | guest`. Guest in dev keeps the mock cookie role (RoleSwitcher stays,
  dev-only); guest in prod → portal routes redirect to `/` (sign-in).
- Login: student/staff buttons → `window.location = API/auth/login`; recruiter card → email form
  → `POST /auth/recruiter/request` → "check your email". Logout → `POST /auth/logout` then clear local role.
- `proxy.ts` keeps reading `tpc-role` (now also set by the backend at login).

## Security checklist

1. All mutations behind `requireAuth`+`requireRole` AND service-level ownership.
2. Origin-check hook on mutating methods (CSRF for SameSite=None).
3. zod on every body/param/query; uuid params; pageSize ≤ 100; payload ≤ 1 MB (fastify default).
4. No enumeration: recruiter request always 200; corrections/users return 404 (not 403) for foreign IDs where existence itself is sensitive.
5. Rate-limit tiers (auth-request, apply, presign).
6. Presign: content-type allowlist, purpose×role matrix, unguessable keys, short expiry (300s), audit.
7. Audit log on all sensitive actions (list above).
8. helmet headers; CORS restricted to env origins; cookies httpOnly (session) + Secure.
9. No raw SQL outside the trigger migration; Prisma parameterised everywhere.
10. Errors: no stack traces in prod (existing handler); logs must not contain tokens/secrets.
11. Redis down ⇒ degrade to DB, never 500 from the cache layer.
