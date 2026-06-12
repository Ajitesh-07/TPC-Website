# TPC Backend — Phase 2 API Design

Extends API_DESIGN.md. Same conventions (zod everywhere, pagination, row-level
authz in services, audit on sensitive actions, cache-aside with `bump`).
Roles backend enum: `student|company|coordinator|admin|super_admin`.

## Modules

### 1. Notifications (`modules/notifications`) — all authed users, own data only
| Method | Path | Notes |
|---|---|---|
| GET | `/api/notifications?category&unreadOnly&page&pageSize` | own rows, newest first |
| GET | `/api/notifications/unread-count` | `{ count }` |
| POST | `/api/notifications/:id/read` | mark one (own) read; 404 if not own |
| POST | `/api/notifications/read-all` | mark all own read; `{ updated }` |
| GET | `/api/notifications/preferences` | `[{category, enabled}]` for all 6 categories (default enabled) |
| PATCH | `/api/notifications/preferences` | `{ category, enabled }` upsert |
- Categories: `drive|status|deadline|schedule|profile|system`.
- Not cached (high write rate; indexed by `(userId,isRead,createdAt)`).

**`lib/notify.ts`** (shared helper, fire-and-forget):
- `notify(userId, category, title, message?, link?)` — skips if the user disabled
  that category in `notification_preferences`; otherwise inserts a `notifications` row.
- `notifyMany(userIds[], category, title, message?, link?)` — bulk (respects prefs in a single query).
- `notifyRole(role, ...)` — to every active user of a role (admins).

**Emission points** (added to existing services):
- drive **submit** → `notifyRole('admin'|'super_admin', 'drive', "<company> – <title> awaiting approval", link=/admin-dashboard)`
- drive **decision** → notify `drive.createdBy` (`'drive'`, approved/rejected, link=/company-drives)
- application **status change** → notify the student (`'status'`, link=/student-dashboard)
- correction **review** → notify the student (`'profile'`)
- credit **adjust** → notify the student (`'profile'`)

### 2. Audit Log (`modules/auditlog`) — super_admin only, READ-only
| Method | Path | Notes |
|---|---|---|
| GET | `/api/audit?type&actorRole&search&page&pageSize` | paginated, newest first |
| GET | `/api/audit/summary` | `{ total, exportsToday, roleChanges, policyActions }` |
- Row: `{ id, timestamp(createdAt), actorName(actor.fullName|null), actorRole, action, targetTable, targetLabel, details, source(ipAddress) }`.
- `type` filters `action`; `search` over `targetLabel`/`details`/actor name.

### 3. Company Contacts (`modules/contacts`) — admin/super_admin
| Method | Path | Notes |
|---|---|---|
| GET | `/api/contacts?search&industry` | companies w/ `{id,name,industry,lastContacted,poc:{name,designation},logCount}` |
| GET | `/api/contacts/:companyId` | `{ company, pocs[], history: ContactEntry[] desc }` |
| POST | `/api/contacts/:companyId` | `{ contactName, designation?, channel(email|call|visit|other), note?, contactedOn(date) }` → `company_contact_log` row, `recordedBy`=actor. Audit `data_edit`. |
- `lastContacted` = max(`contactedOn`); `poc` = primary `company_poc` or null.

### 4. Manage Companies / Registrations (`modules/registrations`) — admin/super_admin (+ student respond)
New table **`registration_responses`** (migration): `{id, registrationId, studentId, answers jsonb, submittedAt, unique(registrationId,studentId)}`.

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/registrations?search&status&page&pageSize` | admin | list + `responseCount`, status, processType, createdAt |
| POST | `/api/registrations` | admin | `{ companyName, companyId?, industry?, processType?, minCpi?, registrationDeadline?, eligibleBranchCodes[] }` |
| PATCH | `/api/registrations/:id` | admin | `{ status: open|closed|pending }` |
| GET | `/api/registrations/:id/responses` | admin | rows: `{ id, student:{rollNo,fullName,branchCode,cpi,email}, submittedAt }` (for the table + CSV) |
| GET | `/api/registrations/open` | student | open registrations the student is eligible for + `hasResponded` |
| POST | `/api/registrations/:id/respond` | student | `{ answers? }` → creates a `registration_response` (snapshot via studentId); 409 if already responded |
- Audit `data_edit` on create/patch.

### 5. Logistics (`modules/logistics`) — company recruiter (own company)
A single logistics request per company (latest), plus visiting team + a read-only confirmed schedule (the company's drive events).
| Method | Path | Notes |
|---|---|---|
| GET | `/api/logistics` | recruiter's company logistics (hospitality+technical fields) or `null`; + `team[]` + `schedule[]`(events of own drives) |
| PUT | `/api/logistics` | upsert the company's logistics request `{accommodationRequired, roomsRequired?, checkIn?, checkOut?, dietaryPreference?, specialRequests?, venuePreference?, systemsRequired?, projectorRequired, internetRequired, technicalNotes?}` |
| POST | `/api/logistics/team` | `{ name, designation?, phone?, email? }` add a visiting member |
| DELETE | `/api/logistics/team/:id` | remove a member (own) |
- Recruiter resolved via `prisma.recruiter.findUnique({where:{userId}})`; companyId forced.

### 6. Global Export (`modules/exports`) — super_admin (reuses existing where possible)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/export/students?branch&placementStatus&format(json|csv)` | all matching students (capped 5000), as JSON rows or a `text/csv` download. Audit `export`. |
| GET | `/api/export/companies?format` | companies export. Audit `export`. |
- The Global-Export PAGE also reuses: `/api/students` (directory), `/api/corrections` + `/api/corrections/:id/review` (pending approvals), `/api/students/:id/block` (block/unblock). No new endpoints needed for those.

## Frontend
All six pages already exist on mock data — wire to `lib/hooks.ts` (new hooks added in this batch), preserve design, add loading/error/empty + mutation states. The header **bell** shows `useUnreadCount()`; clicking goes to `/notifications`.
