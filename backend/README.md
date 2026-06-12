# CCDC / TPC Backend

REST API for the IIT Patna Career Development Centre / Training & Placement Cell platform.
**Node.js + Fastify + Prisma (PostgreSQL) + Redis**, with Microsoft (Outlook) SSO and role-based access control.

## Stack

| Concern        | Tool                                                            |
| -------------- | --------------------------------------------------------------- |
| HTTP framework | Fastify 5                                                       |
| ORM / DB       | Prisma + PostgreSQL (`prisma/schema.prisma` is source of truth) |
| Cache / queues | Redis (ioredis) + BullMQ                                        |
| Auth           | Microsoft Entra ID (OAuth) → session JWT in an httpOnly cookie  |
| Validation/docs| Zod + Swagger/OpenAPI at `/docs`                                |
| File storage   | S3-compatible (MinIO local / R2 / S3) via presigned URLs        |

## Setup

```bash
cd backend
docker compose up -d                 # Postgres + Redis + MinIO
npm install                          # NOTE: switched from Express → Fastify, reinstall
cp .env.example .env                 # (Windows: copy .env.example .env) then edit secrets
npm run prisma:migrate               # create the schema in Postgres
npm run db:seed                      # season, branches, programs, approved emails
npm run dev                          # API on http://localhost:4000, docs at /docs
npm run worker                       # (separate terminal) background job worker
```

## Commands

```bash
npm run dev              # watch mode (tsx)
npm run build / start    # compile to dist/ and run
npm run typecheck        # tsc --noEmit
npm run worker           # BullMQ worker (eligibility / exports / email)
npm run prisma:migrate   # prisma migrate dev
npm run prisma:generate  # regenerate the client after schema edits
npm run db:seed          # seed reference data
```

## Endpoints (so far)

| Method | Path                       | Access                                  |
| ------ | -------------------------- | --------------------------------------- |
| GET    | `/auth/login`              | start Microsoft SSO                     |
| GET    | `/auth/callback`           | OAuth callback → sets session cookie    |
| POST   | `/auth/logout`             | clear session                           |
| GET    | `/api/health`              | liveness probe                          |
| GET    | `/api/me`                  | current user + role profile             |
| GET    | `/api/drives`              | drives scoped to the caller's role      |
| GET    | `/api/drives/:id`          | one drive (ownership-checked)           |
| GET    | `/api/drives/:id/applicants` | recruiter (own company) / coordinator / admin |

## Structure

```
prisma/
  schema.prisma       # 38 models / 21 enums — SOURCE OF TRUTH (use prisma migrate)
  seed.ts             # reference data
src/
  index.ts            # entry — starts the server (graceful shutdown)
  app.ts              # Fastify app factory (plugins, swagger, routes)
  config/env.ts       # zod-validated environment
  lib/
    prisma.ts redis.ts storage.ts queue.ts
  middleware/
    auth.ts           # requireAuth / requireRole (RBAC preHandlers)
    errorHandler.ts   # HttpError + central handler
    notFound.ts
  auth/
    microsoft.ts      # MSAL config + resolveUser (approved-email gate)
    routes.ts         # /auth/login, /callback, /logout
  routes/
    index.ts          # /api root — registers feature modules
    health.routes.ts
  modules/
    users/routes.ts   # /me
    drives/           # reference module: routes + service (row-level RBAC)
  jobs/worker.ts      # BullMQ processors (eligibility, exports)
```

## Two-layer RBAC (important)

1. **Route-level** — `requireRole('admin','super_admin')` preHandlers, a port of the
   frontend `lib/roles.ts` matrix. Coarse gate only.
2. **Row-level ownership** — enforced in services (see `modules/drives/service.ts`):
   a recruiter sees only their company's drives, a coordinator only their assigned
   drives, a student only drives they're eligible for. **Never trust an id from the
   client** — always scope by `req.authUser`.

## Notes / TODO

- **Express → Fastify:** the earlier Express skeleton was converted. Run `npm install`
  to pick up the new dependencies (the old `cors/express/helmet/morgan` are gone).
- **Prisma caveats:** `updated_at` is handled by `@updatedAt`. The **credit-ledger
  trigger** (`students.credit_balance`) is not representable in Prisma — add it back as
  a manual SQL migration, or do the increment inside a `CreditsService` transaction.
  `citext`/`pgcrypto` are declared via the `postgresqlExtensions` preview.
- Feature modules still to add: applications, forms engine, credits, calendar,
  registrations, logistics, notifications, exports, audit. Mirror the `drives` module.
- The audit log should be written by a Fastify `onResponse` hook on mutating routes.
```
