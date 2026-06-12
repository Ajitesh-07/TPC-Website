# IIT Patna CCDC / TPC Platform

Web platform for IIT Patna's **Career Development Centre / Training & Placement Cell** — a
public marketing site plus a role-scoped portal for **students, company recruiters,
coordinators, admins, and super-admins**, backed by a real REST API.

## Repository layout

| Directory            | What it is                                                                   |
| -------------------- | ---------------------------------------------------------------------------- |
| **`frontend-next/`** | The app — Next.js 16 + Tailwind v4 (marketing site + portal), TanStack Query |
| **`backend/`**       | REST API — Fastify + Prisma (PostgreSQL) + Redis, Microsoft SSO + RBAC        |
| `ccdc-site(old)/`    | The original app, kept **read-only** as a design reference                    |

The two run as **separate services**: frontend on `:3000`, API on `:4000`.

## Prerequisites

- **Node.js 20+** (LTS) and npm
- **Docker Desktop** — must be **running** before backend setup (it provides Postgres, Redis, MinIO)
- **Google Chrome** recommended for testing (see [Gotchas](#gotchas--things-that-will-trip-you-up))

## Ports

| Service             | URL                          |
| ------------------- | ---------------------------- |
| Frontend (Next)     | http://localhost:3000        |
| Backend API         | http://localhost:4000        |
| API docs (Swagger)  | http://localhost:4000/docs   |
| PostgreSQL          | localhost:5432               |
| Redis               | localhost:6379               |
| MinIO (S3) console  | http://localhost:9001        |

---

## How to run it

You need **3 terminals**: backend API, backend worker, frontend.

### Terminal 1 — backend API
```bash
cd backend
docker compose up -d        # Postgres + Redis + MinIO (Docker Desktop must be running)
npm install
# Copy the env file if you don't have one yet:
#   Windows:  copy .env.example .env
#   macOS/Linux:  cp .env.example .env
npm run prisma:migrate      # create the schema
npm run db:seed             # seed users, companies, drives, + phase-2 data
npm run dev                 # API on http://localhost:4000  (Swagger at /docs)
```

### Terminal 2 — background worker
```bash
cd backend
npm run worker              # recomputes drive eligibility, etc.
```
> The worker is **needed** so that newly-created/approved drives become eligible for students.

### Terminal 3 — frontend
```bash
cd frontend-next
npm install --legacy-peer-deps     # the flag IS required (ESLint peer-dep conflict)
npm run dev                        # http://localhost:3000
```

Open **http://localhost:3000** in **Chrome**.

> The provided `backend/.env` already points at the Docker services and has
> `ENABLE_DEV_LOGIN=true` so you can log in as any role locally (see below).

---

## How to log in & test

The portal **requires a real session** — there is no anonymous browsing. The fastest way
to sign in as any role in development is the **dev-login link**: paste it into Chrome's
address bar and it drops you straight onto that role's dashboard.

| Role             | Paste this into the browser                                                      |
| ---------------- | ------------------------------------------------------------------------------- |
| **Student**      | `http://localhost:4000/auth/dev/login?email=aarav_2101cs02@iitp.ac.in`          |
| **Recruiter**    | `http://localhost:4000/auth/dev/login?email=hr@techflow.com`                    |
| **Coordinator**  | `http://localhost:4000/auth/dev/login?email=coordinator@iitp.ac.in`             |
| **Admin**        | `http://localhost:4000/auth/dev/login?email=admin@iitp.ac.in`                   |
| **Super-admin**  | `http://localhost:4000/auth/dev/login?email=ajitesh7011@outlook.com`            |

- **To switch roles:** paste a different link (it overwrites the session). **Logout:** sidebar → Logout.
- `aarav_2101cs02@iitp.ac.in` is the **fully-populated** student (CPI, branch, applications, credits). Other students exist but may be sparse.

### Real authentication (also works)
- **Microsoft SSO** → landing page → "Continue with College Email" → sign in with `ajitesh7011@outlook.com`
  (the only account wired to the dev Azure app). Requires the `AZURE_*` vars in `backend/.env`.
- **Recruiter magic link** → landing page → "Recruiter Sign-in" → enter `hr@techflow.com` →
  the one-time link is **printed in the backend (Terminal 1) console** → open it.

---

## What's been built (and how to test each)

### Core placement flow (Phase 1)
| Role | Pages | Try this |
| --- | --- | --- |
| **Student** | Dashboard, My Profile, Drives, Calendar | Browse **Drives** → **Apply** to an eligible one; edit **My Profile** (upload a resume PDF, file a correction request) |
| **Recruiter** | Dashboard, My Drives, Job Announcement, Logistics | **Job Announcement** → publish a drive; **My Drives** → applicant roster → shortlist / change status |
| **Coordinator** | Dashboard, Add Drive, Drive Workspace, Student Directory | **Add Drive** → submit for approval; **Drive Workspace** → advance process stages |
| **Admin** | Dashboard, Credit Management, Student Directory, Manage Companies, Company Contacts | **Pending Drive Approvals** card → Approve/Reject; **Credit Management** → adjust a student's credits |
| **Super-admin** | All admin pages + User Management, Audit Log, Global Export | **User Management** → reassign roles / approved emails |

### Phase 2 features
| Feature | Role | Flow in one line |
| --- | --- | --- |
| **Company Contacts** | admin | List companies → open one → see contact history → **Save Contact** persists a log entry |
| **Manage Companies** | admin | **Register New Company** with eligibility → students respond → view/export responses |
| **Logistics** | recruiter | Edit hospitality/technical needs + visiting team; view the confirmed schedule (own company only) |
| **Audit Log** | super-admin | Read-only trail of every sensitive action (filter by type/actor) + summary tiles |
| **Global Export** | super-admin | Export students/companies to CSV; approve correction requests; block/unblock students |
| **Notifications** | all | Bell + `/notifications`; generated automatically by real events (see below) |

### The best end-to-end test (exercises every role)
Use **separate Chrome profiles** (see Gotchas) so you can stay logged in as several roles at once:
1. **Recruiter** → Job Announcement → **Publish** a drive (status → *Pending TPC Approval*).
2. **Admin** → Dashboard → **Pending Drive Approvals** → **Approve** it.
3. *(worker recomputes eligibility)* **Student** → Drives → the new drive appears → **Apply**.
4. **Recruiter** → My Drives → the student is in the roster → **shortlist** / change status.
5. **Admin** → Credit Management → adjust the student's credits.
6. Watch the **Notifications** bell update across roles (approval → recruiter; status change & credits → student).

---

## Gotchas — things that will trip you up

- **You must be logged in.** Visiting any portal URL without a session redirects you to the
  landing page. There's no guest/mock browsing (it was intentionally disabled).
- **Use Chrome.** The session cookie is `SameSite=None; Secure`. Chrome (and Firefox) allow
  Secure cookies over `http://localhost`; some browsers/contexts refuse them, which makes
  `/api/me` return 401 and you can't get in.
- **Multiple roles at once → use separate Chrome _profiles_, NOT incognito windows.**
  All of Chrome's incognito windows **share one cookie jar**, so logging in as a second role
  in a "separate" incognito window silently **overwrites** the first window's session — both
  become the new role. For genuinely independent sessions: Chrome → profile menu → **Add**
  one profile per role (or use one normal window + one incognito, or different browsers).
- **Run the worker** (Terminal 2). Without it, eligibility isn't recomputed, so freshly
  approved/created drives won't show up for students.
- **Windows + Postgres:** if Prisma fails with `P1001 can't reach localhost:5432`, it's the
  IPv6 `localhost`. The provided `.env` already uses **`127.0.0.1`** in `DATABASE_URL` — keep it.
- **Frontend install** must use `--legacy-peer-deps`.
- **`ENABLE_DEV_LOGIN=true`** (in `backend/.env`) powers the dev-login links — it's **local only**
  and must **never** be set in production (it would be an unauthenticated account-takeover route;
  it's hard-gated to development).
- **Docker Desktop must be running** before `docker compose up`.

---

## Useful commands

**Backend**
| Command | Description |
| --- | --- |
| `npm run dev` | API in watch mode |
| `npm run worker` | background job worker (eligibility recompute) |
| `npm run prisma:migrate` | apply DB migrations |
| `npm run db:seed` | (re)seed all demo data |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` / `start` | compile + run production build |

**Frontend**
| Command | Description |
| --- | --- |
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build (also typechecks) |
| `npm run lint` | ESLint |

---

## Going to production

See **`backend/docs/PRODUCTION.md`** for the AWS hardening checklist. The non-negotiables:
set `NODE_ENV=production`, leave `ENABLE_DEV_LOGIN` unset, set `TRUST_PROXY` to the ALB hop
count, put secrets in a secret manager, switch Azure to single-tenant, and run
`prisma migrate deploy`. Design docs: `backend/API_DESIGN.md`, `backend/PHASE2_DESIGN.md`,
`backend/schema.sql` + `backend/erd.mmd`.
