# CCDC / TPC Backend

API backend for the IIT Patna Career Development Centre / Training & Placement Cell platform.
Node.js + Express 5 + TypeScript.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit if needed (Windows: copy .env.example .env)
```

## Commands

```bash
npm run dev        # watch mode (tsx), restarts on change
npm run build      # compile TypeScript to dist/
npm run start      # run the compiled server (dist/index.js)
npm run typecheck  # type-check without emitting
```

The server listens on `PORT` (default **4000**).

## Endpoints

| Method | Path           | Description                     |
| ------ | -------------- | ------------------------------- |
| GET    | `/api`         | API metadata                    |
| GET    | `/api/health`  | Service status / liveness probe |

## Structure

```
src/
  index.ts              # entry point — starts the HTTP server
  app.ts                # Express app factory (middleware + routes)
  config/
    env.ts              # typed environment configuration
  middleware/
    errorHandler.ts     # centralised error handler + HttpError
    notFound.ts         # 404 handler
  routes/
    index.ts            # root API router
    health.routes.ts    # health endpoint
```

Add new feature routers under `src/routes/` and mount them on `apiRouter` in `src/routes/index.ts`.
Route handlers can `throw` (including from `async` functions) — Express 5 forwards errors to `errorHandler`.
Throw an `HttpError(status, message)` to control the response code.
