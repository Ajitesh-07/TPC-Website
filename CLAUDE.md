# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Web platform for **IIT Patna's Career Development Centre / Training & Placement Cell (CCDC / TPC)** — a public marketing site plus an authenticated portal for students, company recruiters, and placement coordinators.

## Repository layout

Three top-level directories, each independent:

- **`frontend-next/`** — the **active app** and current source of truth. The full site + portal from `ccdc-site(old)` has been migrated here on **Tailwind v4** with shared UI primitives and centralized data (see Architecture below).
- **`ccdc-site(old)/`** — the original Next.js 16 app (Tailwind v3 + JS config). Kept as a **read-only reference**; the root `.html` files are the original design mockups. Don't develop here unless explicitly asked.
- **`backend/`** — empty directory; no backend implemented yet.

The repo is **not** a git repository.

> **Before writing any Next.js code, read the relevant guide under `<app>/node_modules/next/dist/docs/`.** Per `AGENTS.md`, this is Next.js 16 — APIs, conventions, and file structure differ from older Next.js you may know. Heed deprecation notices.

## Commands

Run inside whichever app directory you're working in (`ccdc-site(old)/` or `frontend-next/`):

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build (also enforces TypeScript type-safety)
npm run start    # serve the production build
npm run lint     # ESLint (ccdc-site(old) uses `eslint .`, frontend-next uses `eslint`)
```

**`npm install` in both apps requires `--legacy-peer-deps`** (an ESLint v9/v10 peer-dependency conflict from `@eslint/js`). This only affects install/lint, not the running app.

There is no separate test runner configured. Type-safety is enforced by `next build` / `tsc`.

Path alias: `@/*` → `./*` in `frontend-next` (so `@/components/...`, `@/data/...`, `@/lib/...`); `@/*` → `./src/*` in `ccdc-site(old)`.

## Architecture (`frontend-next/`)

App Router with two **route groups** sharing one root layout (`app/layout.tsx` → wraps children in `app/providers.tsx`):

- **`(site)/`** — public marketing pages. Layout = `Navbar` + `<main>` + `Footer`. The home page (`(site)/page.tsx`) composes section components from `components/home/` (Hero, AboutTPC, PlacementHighlights, PastRecruiters, TrustedLeaders, HeadMessage, Announcements, PublicDownloads, PortalAccess, ContactUs).
- **`(portal)/`** — authenticated dashboards. Layout = fixed `Sidebar` + scrollable `<main>`. Pages: `student-dashboard`, `company-dashboard`, `coordinator-dashboard`, `super-admin-dashboard`, `drive-catalogue`, `my-profile`, `jaf` (Job Announcement Form), `calendar`. Currently driven by **hardcoded mock data** — no live API yet.

`app/providers.tsx` (`'use client'`) provides a TanStack Query `QueryClientProvider` (`staleTime: 60s`, `refetchOnWindowFocus: false`) — data-fetching infra is wired up ahead of a real API.

### Organization (the "clean/modifiable" structure)

- **`data/`** — all mock content as typed modules (`recruiters`, `navigation`, `home`, `student`, `drives`, `coordinator`, `company.tsx`, `admin`, `calendar`). Edit copy/lists here, not inside components. (`company.tsx` is `.tsx` because its activity entries embed small JSX fragments.)
- **`components/ui/`** — shared primitives: `StatusBadge` (the single source of truth for status colour tones — `BadgeTone`), `SectionHeading`, `PortalHeader`, `MetricCard`, `Timeline`/`TimelineItem`, `DataTable` (generic column-config table). Reuse these before writing new markup; keep genuinely page-specific layout inline.
- **`components/home/`**, **`components/layout/`** (`Navbar`, `Footer`, `Sidebar`), **`lib/utils.ts`** (`cn` = clsx + tailwind-merge).

### Design mockups

The `.html` files at the root of `ccdc-site(old)/` (e.g. `student_dashboard.html`, `jaf.html`) are the **original static design mockups** — one per portal page. Consult the matching mockup when changing a portal page's look.

### Styling & design system (Tailwind v4, CSS-first)

- **No `tailwind.config.js`.** All tokens live in `app/globals.css` via `@theme` — a **Material Design 3-style system**: semantic colours (`primary`, `surface-container-low`, `on-surface-variant`, `gold-leaf`, `navy-vibrant`, `status-*`, …), an MD3 type scale (`text-headline-md`, `text-label-sm`, … paired with `font-*` aliases, all **Hanken Grotesk**), and custom spacing (`px-gutter-desktop`, etc.). Prefer these tokens over raw hex/px.
- Component classes in `globals.css` (`@layer components`/`utilities`): `.glass-panel`, `.hero-gradient`, `.gradient-text`, `.btn-primary`, `.btn-gradient`, `.elevation-1/2`, `.soft-shadow`, `.hover-lift`, `.input-glow`, `.no-scrollbar`, `.custom-scrollbar`, `.animate-fadeIn`, `.animate-marquee`.
- **Radius gotcha:** the design uses a deliberately tight radius scale — `rounded-lg`/`rounded-xl` are overridden via `--radius-*` tokens, and `rounded` (0.125rem) + `rounded-full` (0.75rem) are forced with **unlayered** rules at the bottom of `globals.css` (v4's `@utility` can't override built-in utilities; unlayered CSS outranks `@layer utilities`). `max-w-container-max` (1440px) is a custom `@utility`. Don't "simplify" these away.
- Tailwind v4 reminders when editing: use `bg-x/90` not `bg-opacity-*`, `grow`/`shrink-0` not `flex-grow`/`flex-shrink`, `placeholder:text-x` not `placeholder-x`. For **dynamic** colour classes (e.g. the calendar event colours), map values to **literal** class strings so the v4 scanner picks them up.
- **Icons**: Material Symbols Outlined, loaded via Google Fonts in the root layout (`<span className="material-symbols-outlined">name</span>`).
- `next.config.ts` allowlists remote images `logo.clearbit.com` (recruiter logos) and `lh3.googleusercontent.com`. Recruiter/HR images use plain `<img>` (with eslint-disable), not `next/image`.
