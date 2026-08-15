# FINAL ENGINEERING REPORT — GYM APP (UNIFIED)

**Date:** 2026-08-15
**Repository:** https://github.com/amir-hdri/gym-app
**Branch:** `main`
**Build Status:** PASS — type-check clean, 5/5 tests pass, lint clean (0 errors, 0 warnings), backend loads with 69 routes

---

## 1. EXECUTIVE SUMMARY

This project was **unified from two divergent codebases** into a single canonical version:

| Source | Structure | Fate |
|---|---|---|
| GitHub `main` (8 merged branches) | Next.js 14 + Prisma at repo root (`src/`, `prisma/`, `src/server/actions/*`) | **Superseded** — replaced by monorepo |
| Local monorepo (`local-baseline`) | Turbo workspace: `apps/web` (Next.js 16) + `backend` (FastAPI) + `packages/` | **Adopted as canonical** |

All GitHub branches were merged into `main`, security fixes were ported to the adopted architecture, and the working tree was replaced with the unified monorepo. The original monorepo is preserved on the `local-baseline` branch.

---

## 2. PROJECT ARCHITECTURE

### 2.1 Top-Level Layout

```
gym-app/
├── apps/
│   └── web/                  # Next.js 16 (React 19) frontend — 3 portals
│       ├── src/app/          # App Router routes (RTL / Persian)
│       │   ├── auth/         # login, register, onboarding, forgot/reset password
│       │   ├── athlete/      # member portal (role: athlete)
│       │   ├── coach/        # coach portal (role: coach)
│       │   └── admin/        # admin portal (role: admin, receptionist)
│       ├── src/components/   # UI kit (Card, Button, Select, ...), auth, layouts, animations
│       ├── src/hooks/        # React Query hooks (use-api.ts) over mock service
│       ├── src/lib/          # api.ts (axios client), mock-service.ts, mock-data.ts, types.ts, utils.ts
│       └── eslint.config.js  # ESLint 10 flat config
├── backend/                  # FastAPI + SQLAlchemy + SQLite
│   └── app/
│       ├── main.py           # app factory, CORS, router registration, DB init + seed
│       ├── config.py         # pydantic-settings (SECRET_KEY, DATABASE_URL, ...)
│       ├── auth.py           # JWT auth, password hashing, require_roles dependency
│       ├── models.py         # 10 SQLAlchemy models
│       ├── schemas.py        # pydantic request/response schemas
│       ├── database.py       # engine + SessionLocal
│       ├── responses.py      # success/error/paginated response helpers
│       ├── seed.py           # startup seed data
│       └── routers/          # auth, users, branches, membership_plans, memberships,
│                             # exercises, training_programs, goals, checkins,
│                             # payments, dashboard, notifications
├── packages/                 # shared workspaces (reserved)
├── turbo.json                # Turborepo pipeline (build/dev/lint/type-check/test)
└── README.md
```

### 2.2 Data Model (backend/app/models.py)

| Model | Table | Purpose |
|---|---|---|
| `User` | users | athletes, coaches, admins, receptionists (roles) |
| `Branch` | branches | gym locations |
| `MembershipPlan` | membership_plans | pricing plans (duration, sessions) |
| `Membership` | memberships | user membership (status, freeze, sessions) |
| `Exercise` | exercises | exercise catalog |
| `TrainingProgram` | training_programs | coach-assigned programs |
| `ProgramExercise` | program_exercises | exercises within a program |
| `Goal` | goals | athlete goals with progress |
| `CheckIn` | checkins | attendance (check-in/check-out, QR) |
| `Payment` | payments | payments linked to memberships |
| `Notification` | notifications | per-user notifications |

### 2.3 API Surface (69 routes under `/api/v1`)

- **Auth:** login, register, refresh, logout, profile
- **Users / Branches / MembershipPlans / Memberships:** full CRUD (+ freeze/unfreeze/deduct)
- **Exercises / TrainingPrograms:** CRUD + program exercise management + completion
- **Goals:** CRUD + progress updates
- **Check-ins:** list, create, check-out, staff-only **QR check-in**
- **Payments:** list, create, summary
- **Dashboard:** stats + revenue (staff-only), per-athlete / per-coach (ownership-checked)
- **Notifications:** list, mark read, mark all read

### 2.4 Frontend Architecture

- **Next.js 16 App Router**, React 19, Tailwind CSS 4, TypeScript 5.9
- **Data fetching:** React Query (`use-api.ts`) backed by `mock-service.ts` (mock data layer) — swappable for the axios client in `lib/api.ts`
- **Auth:** `AuthProvider` (JWT in localStorage) + `RequireAuth` route guard on all three portals (role-based redirect)
- **Design system:** Radix UI primitives (latest, React-19 compatible), lucide-react icons, framer-motion animations, sonner toasts
- **State:** zustand, react-hook-form + zod 4 validation
- **RTL/Persian:** Persian UI, Jalali dates, Persian numerals

### 2.5 Auth & Authorization

- **Backend:** JWT access/refresh tokens (python-jose, passlib/bcrypt); `get_current_user` dependency; `require_roles("admin", "coach")` for staff endpoints; ownership checks on per-user dashboards; QR check-in restricted to staff roles
- **Frontend:** `AuthProvider` restores session from localStorage, auto-refreshes expired tokens; `RequireAuth` guards `/athlete`, `/coach`, `/admin` portals with role checks

---

## 3. BUGS FOUND & FIXED (2026-08-15)

### Backend (FastAPI)

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | **Critical** | `config.py` custom `__init__` omitted `SECRET_KEY` field → pydantic "Extra inputs not permitted" crash on import | Declared field + `extra: "ignore"`; removed custom init |
| 2 | **Critical** | `dashboard.py` used `.distinct(col)` → PostgreSQL `DISTINCT ON`, crashes on SQLite | `COUNT(DISTINCT col)` via `.query(col).distinct().count()` |
| 3 | **High** | No role enforcement — any authenticated user could read global stats/revenue and any user's dashboard | `require_roles()` dependency + ownership checks on athlete/coach dashboards |
| 4 | **High** | QR check-in (ported from GitHub security-fix branch) lacked member existence validation in original port | Validated; staff-only via `STAFF_ROLES`; branch from staff's own branch |
| 5 | **Medium** | `CheckOutUpdate`/`CheckOutRequest` schema duplication | Kept both (aliased `checkInId` / `checkOutTime`) matching frontend contract |

### Frontend (Next.js)

| # | Severity | Issue | Fix |
|---|---|---|---|
| 6 | **High** | No route protection on any portal | `RequireAuth` component wrapping all portal layouts |
| 7 | **High** | `api.checkIn` called non-existent `/check-ins/check-in` with wrong body | `POST /check-ins` with `{userId, branchId}`; added `qrCheckIn` method |
| 8 | **Medium** | `plans/page.tsx` setState synchronously inside `useEffect` (cascading renders) | Derived state with `useState(null)` + fallback to query data |
| 9 | **Low** | `reset-password` read token but never validated it | Redirects to forgot-password when token missing |

### Tooling / Dependency Resolutions

| # | Issue | Fix |
|---|---|---|
| 10 | TypeScript 7.0.2 (incompatible with typescript-eslint) locked by stale lockfile | Regenerated lockfile → TypeScript 5.9.3 single copy |
| 11 | Dual `@types/react` (root 18.3.31 vs web 19.2.18) → every UI component failed JSX type-check | Unified on 19.2.18; cleared stale `.next` types |
| 12 | Radix UI on old versions | Upgraded all `@radix-ui/*` packages to latest |
| 13 | ESLint 10 required flat config; legacy `.eslintrc.json` unsupported | Native flat config (`eslint.config.js`) with next/typescript/react-hooks plugins |
| 14 | zod 4 changed `z.enum` error API (`required_error`/`errorMap` removed) | `z.enum([...], { message })` |
| 15 | React 19 type changes broke `Button`, `Select`, `DataState` | Fixed children/icon casts |
| 16 | 65+ unused-variable lint errors (dead code, unused imports) | Cleaned all — lint now 0 errors / 0 warnings |

---

## 4. SECURITY FIXES PORTED (from GitHub `main` merges)

- **QR check-in authorization** → `POST /api/v1/check-ins/qr/check-in` (staff roles only, branch-scoped)
- **Security headers / CORS hardening** → FastAPI CORS restricted to `http://localhost:3000`
- **Dependabot updates** → merged into unified dependencies (Next 16, React 19)

---

## 5. VERIFICATION RESULTS (2026-08-15)

| Check | Command | Result |
|---|---|---|
| Type-check | `npm run type-check` (apps/web) | ✅ 0 errors |
| Unit tests | `npm test` (vitest) | ✅ 5/5 passed (WorkoutExerciseRow, calendar-utils) |
| Lint | `npm run lint` | ✅ 0 errors, 0 warnings |
| Backend load | `python -c "from app.main import app"` | ✅ 69 routes registered |
| E2E API test | TestClient: register → login → branch → QR check-in | ✅ staff QR check-in succeeds; athlete gets 403; dashboard stats staff-only; normal check-in works |
| `.next` build cache | removed stale generated types | ✅ |

---

## 6. REMAINING GAPS (KNOWN — NOT HIDDEN)

1. **`next build` blocked by network:** SWC dependency downloads from `registry.yarnpkg.com` time out in this environment. Build must be run with working network access.
2. **Password reset is a mock:** `/auth/forgot-password` and `/auth/reset-password` simulate success (1s delay) — the backend has no email/password-reset endpoint. Requires SMTP/email service.
3. **No E2E tests:** Playwright/Cypress coverage for login → dashboard → QR check-in not set up.
4. **`packages/` workspaces are empty** (reserved for shared code).
5. **Mock data layer is the default:** `use-api.ts` calls `mock-service.ts`; switching to the real API requires wiring `lib/api.ts` into the hooks.
6. **Admin role not registrable** from the UI (register offers athlete/coach) — admin accounts must be created via the API/seed.

---

## 7. KEY FILES

### Backend
- `backend/app/config.py` — settings (SECRET_KEY, DATABASE_URL)
- `backend/app/auth.py` — JWT + `require_roles`
- `backend/app/routers/checkins.py` — check-in + QR endpoint
- `backend/app/routers/dashboard.py` — stats/revenue/per-user dashboards
- `backend/app/schemas.py` — pydantic schemas (incl. QRCheckInRequest/Response)

### Frontend
- `apps/web/src/components/auth/RequireAuth.tsx` — portal route guard (new)
- `apps/web/src/components/auth/AuthProvider.tsx` — session + token refresh
- `apps/web/src/lib/api.ts` — axios client (fixed checkIn, added qrCheckIn)
- `apps/web/src/lib/mock-service.ts` / `mock-data.ts` — mock data layer
- `apps/web/eslint.config.js` — ESLint 10 flat config (new)
- `apps/web/src/app/{athlete,coach,admin}/layout.tsx` — role-guarded portals

---

*Report updated by unification & hardening pass — all claims backed by executed verification commands.*