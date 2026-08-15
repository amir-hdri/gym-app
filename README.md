# Gym App

A full-stack gym management platform: member, coach, and admin portals with membership plans, training programs, goals, check-ins (incl. staff QR check-in), payments, notifications, and dashboards. Persian (RTL) UI, mobile-first.

## Architecture

```
┌────────────────────────────────────────────────────────┐
│  apps/web — Next.js 16 (App Router) + React 19         │
│  ├── /athlete    member portal (role: athlete)         │
│  ├── /coach      coach portal (role: coach)            │
│  ├── /admin      admin portal (role: admin/receptionist)│
│  └── /auth       login · register · onboarding ·       │
│                   forgot/reset password                │
├────────────────────────────────────────────────────────┤
│  backend — FastAPI + SQLAlchemy + SQLite               │
│  REST API under /api/v1 (69 routes)                    │
│  JWT auth · role enforcement · QR check-in             │
├────────────────────────────────────────────────────────┤
│  packages/ — shared workspaces (reserved)              │
│  turbo.json — Turborepo pipeline                       │
└────────────────────────────────────────────────────────┘
```

### Backend

- **FastAPI** + SQLAlchemy ORM + SQLite (dev), pydantic-settings for config
- **Models:** User, Branch, MembershipPlan, Membership, Exercise, TrainingProgram, ProgramExercise, Goal, CheckIn, Payment, Notification
- **Auth:** JWT access/refresh tokens (python-jose), bcrypt hashing, `require_roles()` dependency; staff-only QR check-in; ownership checks on dashboards
- **Routers:** auth, users, branches, membership-plans, memberships, exercises, training-programs, goals, check-ins, payments, dashboard, notifications
- Interactive docs at `/docs` (Swagger UI)

### Frontend

- **Next.js 16 App Router**, React 19, Tailwind CSS 4, TypeScript 5.9
- **Data layer:** React Query hooks (`src/hooks/use-api.ts`) over `mock-service.ts`; real axios client in `src/lib/api.ts` (swap when backend is ready)
- **Auth:** `AuthProvider` (localStorage JWT + refresh) and `RequireAuth` route guard on all portals
- **UI:** Radix UI primitives, framer-motion, lucide-react, sonner toasts, react-hook-form + zod 4
- **ESLint 10 flat config** (`eslint.config.js`)

## Quick start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # macOS/Linux
pip install -r requirements.txt
export SECRET_KEY="change-me"
uvicorn app.main:app --reload --port 8000
```

API docs at http://localhost:8000/docs

### Frontend

```bash
npm install
npm run dev          # starts apps/web via turbo
```

Set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`) in `apps/web/.env.local`.

## Scripts

| Command | Location | Description |
| --- | --- | --- |
| `npm run dev` | root | Start frontend dev server |
| `npm run build` | root | Build all workspaces |
| `npm run type-check` | root / `apps/web` | TypeScript check |
| `npm run lint` | `apps/web` | ESLint |
| `npm test` | `apps/web` | Vitest |

## Roles

| Role | Portal | Capabilities |
| --- | --- | --- |
| `athlete` | `/athlete` | workouts, goals, check-in, membership, payments |
| `coach` | `/coach` | athletes, exercises, programs, templates, messages |
| `admin` / `receptionist` | `/admin` | members, coaches, plans, payments, dashboard, settings |

Portals are protected client-side (`RequireAuth`); the backend enforces roles on staff endpoints. Note: admin accounts are not offered at self-registration — create them via the API/seed.

## Environment Variables

| Variable | Where | Default |
| --- | --- | --- |
| `SECRET_KEY` | backend | — (required) |
| `DATABASE_URL` | backend | `sqlite:///./gymapp.db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | backend | 30 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | backend | 7 |
| `NEXT_PUBLIC_API_URL` | apps/web | `http://localhost:8000` |

See `FINAL_REPORT.md` for the full engineering audit, bug fixes, and known gaps.