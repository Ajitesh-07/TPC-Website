# Production hardening checklist (AWS)

The app is built and verified for local development. Before/at deploy, apply this
checklist. Items marked **[sec]** close a finding from the adversarial security
review; do not skip them.

## Environment (the security-critical ones)

- **[sec] `NODE_ENV=production`** — enables prod logging, disables verbose errors,
  and (with the next item) keeps the dev-login route unregistered. Set it
  explicitly on every host; never copy a `.env` that has `NODE_ENV=development`.
- **[sec] `ENABLE_DEV_LOGIN`** — leave **unset/false**. The unauthenticated
  `GET /auth/dev/login` route is registered only when `ENABLE_DEV_LOGIN=true`
  *and* `NODE_ENV=development`. It can never appear in prod with the defaults.
- **[sec] `TRUST_PROXY`** — behind an ALB/CloudFront set to the **hop count**
  (`1` for a single ALB) or a CIDR allowlist, never `true`. This makes `req.ip`
  the real client so rate limits and audit IPs can't be spoofed via
  `X-Forwarded-For`.
- **`JWT_SECRET` / `COOKIE_SECRET`** — generate fresh 32+ byte random values per
  environment (e.g. `openssl rand -hex 32`); store in AWS Secrets Manager / SSM,
  not in a committed file. Rotating `JWT_SECRET` invalidates all sessions.
- **`DATABASE_URL`** — RDS Postgres endpoint; enable SSL (`?sslmode=require`),
  run the app in a private subnet, security-group the DB to the app only.
- **`REDIS_URL`** — ElastiCache endpoint, in-VPC, with auth/TLS.
- **`CORS_ORIGIN`** — the exact production frontend origin(s), comma-separated.
  Never `*` (the app uses credentialed CORS, which forbids `*` anyway).
- **`API_BASE_URL`** / **`AZURE_REDIRECT_URI`** — the public HTTPS API URL; add
  the prod redirect URI to the Entra app registration.
- **`COOKIE_DOMAIN`** — set to the shared parent domain (e.g. `.tpc.iitp.ac.in`)
  if the SPA and API are on sibling subdomains, so the role cookie is readable.
- **SMTP_* ** — real provider (SES recommended on AWS). If SMTP is unset in prod,
  emails are dropped and **never logged** (magic-link tokens are treated as
  secrets) — but recruiters then can't sign in, so configure it.

## Auth / Entra ID

- Switch the app registration to **single-tenant (IIT Patna)** once tenant access
  exists; set `AZURE_TENANT_ID` to the tenant GUID (not `common`).
- Remove any personal/dev emails from `approved_emails`.
- Verify the prod `AZURE_REDIRECT_URI` is allowlisted in Azure.

## Network / TLS

- Terminate TLS at the ALB/CloudFront; the session cookie is `Secure` so HTTPS is
  mandatory (it won't be sent over plain HTTP except on `localhost`).
- Run **API and SPA under the same parent domain** (chosen during this build to
  keep cookies clean): e.g. `app.tpc…` + `api.tpc…`. CORS + `COOKIE_DOMAIN`
  configured accordingly.
- WAF in front of the ALB (rate-based rules complement the app's per-route limits).

## Data / object storage

- Resumes/JDs in a **private S3 bucket** (block public access), served only via
  the app's presigned GETs. Set bucket CORS to allow `PUT` from the SPA origin.
- Use an IAM role for the app (not static keys); scope it to the one bucket.

## Database

- Apply migrations with **`prisma migrate deploy`** (not `migrate dev`).
- The credit-ledger trigger ships as a SQL migration — confirm it applied
  (`select tgname from pg_trigger where tgname='trg_credit_apply'`).
- Automated backups + PITR on RDS.

## Process / ops

- Run the API and the **worker** (`npm run worker`) as separate processes/services
  (the worker drives eligibility recompute + phase-2 export/email queues).
- Health check the ALB target group against `GET /api/health`.
- Ship logs to CloudWatch; the app uses structured pino logs in prod. Confirm no
  secrets/tokens are logged (the mailer fallback is guarded).
- `npm audit` review on a cadence; the dev install flagged transitive advisories.

## Phase-2 (not built yet — tracked, not blocking)

Forms engine, logistics, CSV/XLSX export jobs, notifications fan-out, audit-log
UI, contact-log UI, master-data upload processing. Each mirrors an existing
module; the schema and queues already exist.
