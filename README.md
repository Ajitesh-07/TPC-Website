# IIT Patna CCDC / TPC Platform

Web platform for IIT Patna's **Career Development Centre / Training & Placement Cell** — a
public marketing site plus an authenticated portal for students, company recruiters, and
placement coordinators.

## Repository layout

| Directory          | What it is                                                                 |
| ------------------ | -------------------------------------------------------------------------- |
| **`frontend-next/`** | The active app — Next.js 16 + Tailwind v4 (site + role-scoped portal).    |
| **`backend/`**       | REST API — Fastify + Prisma (PostgreSQL) + Redis, Microsoft SSO + RBAC.   |
| `ccdc-site(old)/`    | The original Next.js app, kept **read-only** as a design reference.       |

> Develop in `frontend-next/` and `backend/`. The two run as **separate services** (frontend
> on `:3000`, API on `:4000`).

## Prerequisites

- **Node.js 20+** (LTS) and npm
- **Docker Desktop** (for Postgres, Redis, MinIO) — must be **running** before backend setup

## Ports

| Service           | URL                              |
| ----------------- | -------------------------------- |
| Frontend (Next)   | http://localhost:3000            |
| Backend API       | http://localhost:4000            |
| API docs (Swagger)| http://localhost:4000/docs       |
| PostgreSQL        | localhost:5432                   |
| Redis             | localhost:6379                   |
| MinIO (S3) console| http://localhost:9001            |

---

## Quick start (TL;DR)

Two terminals.

**Terminal 1 — backend**
```bash
cd backend
docker compose up -d                 # Postgres + Redis + MinIO
npm install
cp .env.example .env                 # Windows: copy .env.example .env  (then see note below)
npm run prisma:migrate               # create the schema
npm run db:seed                      # reference data + a test recruiter
npm run dev                          # API on http://localhost:4000  (docs at /docs)
```

**Terminal 2 — frontend**
```bash
cd frontend-next
npm install --legacy-peer-deps       # the --legacy-peer-deps flag is required
npm run dev                          # http://localhost:3000
```

Open http://localhost:3000.

---

## Backend — detailed

```bash
cd backend

# 1. Start infrastructure (Docker Desktop must be running)
docker compose up -d                 # postgres, redis, minio

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env                 # then edit (see notes)

# 4. Database
npm run prisma:migrate               # apply migrations
npm run db:seed                      # season, branches, programs, approved emails, test recruiter

# 5. Run
npm run dev                          # API + Swagger at /docs
npm run worker                       # (separate terminal) background job worker
```

**Backend commands**

| Command                  | Description                                  |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | API in watch mode (tsx)                       |
| `npm run worker`         | BullMQ worker (eligibility / exports / email) |
| `npm run build` / `start`| compile to `dist/` and run                    |
| `npm run typecheck`      | `tsc --noEmit`                                |
| `npm run prisma:migrate` | `prisma migrate dev`                          |
| `npm run prisma:generate`| regenerate the Prisma client after schema edits |
| `npm run db:seed`        | seed reference data                           |

See `backend/README.md` for the full module layout and the two-layer RBAC model.

---

## Frontend — detailed

```bash
cd frontend-next
npm install --legacy-peer-deps       # required (ESLint v9/v10 peer-dependency conflict)
npm run dev                          # http://localhost:3000
```

**Frontend commands**

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | dev server (Turbopack)               |
| `npm run build`  | production build (also typechecks)   |
| `npm run start`  | serve the production build           |
| `npm run lint`   | ESLint                               |

The portal is **role-scoped**: the sidebar and routes change per role (student, company,
coordinator, admin, super-admin). While the backend wiring is in progress, a **dev role
switcher** (bottom-left, dev only) lets you preview every role against mock data.

---

## Authentication

Two sign-in paths, both ending at the same session and RBAC:

- **Institute users** (student / coordinator / admin / super-admin) → **Microsoft (Outlook) SSO**
  via Entra ID (single-tenant). Requires the `AZURE_*` vars in `backend/.env`; until those are
  set, SSO won't complete but the rest of the API works.
- **Company recruiters** (external, no institute account) → **email magic link**. Provisioned by
  the TPC (invite-only). Test it locally without SMTP:
  ```bash
  curl -X POST http://localhost:4000/auth/recruiter/request \
    -H "Content-Type: application/json" -d "{\"email\":\"hr@techflow.com\"}"
  ```
  With no SMTP configured, the magic link is **printed in the backend console** — open it to sign in.

---

## Notes & gotchas

- **Docker Desktop must be running** before `docker compose up` (otherwise you'll see a
  "cannot find the file specified … dockerDesktopLinuxEngine" error).
- **Windows + Postgres:** Prisma may fail with `P1001 can't reach localhost:5432` because
  `localhost` resolves to IPv6. Use **`127.0.0.1`** in `DATABASE_URL`:
  `postgresql://tpc:tpc@127.0.0.1:5432/tpc?schema=public`.
- **Frontend install** must use `--legacy-peer-deps`; the running app is unaffected.
- **Secrets:** `JWT_SECRET` and `COOKIE_SECRET` must each be ≥ 16 characters or the API won't boot.
- **CORS:** the API allows `CORS_ORIGIN` (default `http://localhost:3000`) with credentials; the
  frontend must call the API with `credentials: "include"`.
- `prisma/schema.prisma` is the **source of truth** for the database — use `prisma migrate`,
  don't hand-edit the DB.
