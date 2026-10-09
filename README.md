# Lumi Wellness

A full-stack gym management platform: member, coach, and admin portals with
membership plans, training programs, goals, check-ins (incl. staff QR check-in),
payments, in-app messaging, notifications, and analytics dashboards. Persian
(RTL) UI, mobile-first, Jalali dates.

The repository is named `gym-app`; the product was rebranded to **Lumi
Wellness**, which is the name in the UI, the manifest and the metadata.

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
│  REST API under /api/v1 — 60 paths, 92 operations      │
│  JWT auth · role enforcement · QR check-in             │
├────────────────────────────────────────────────────────┤
│  packages/ — shared workspaces (reserved)              │
│  turbo.json — Turborepo pipeline                       │
└────────────────────────────────────────────────────────┘
```

### Backend

- **FastAPI** + SQLAlchemy ORM + SQLite (dev), pydantic-settings for config
- **Models:** User, Branch, MembershipPlan, Membership, Exercise,
  TrainingProgram, ProgramExercise, Goal, CheckIn, Payment, Notification,
  Conversation, Message
- **Auth:** JWT access/refresh tokens (python-jose), bcrypt hashing,
  `require_roles()` dependency; staff-only QR check-in; ownership checks on
  dashboards
- **Routers:** auth, users, branches, membership-plans, memberships, exercises,
  training-programs, goals, check-ins, payments, dashboard (incl. analytics),
  notifications, messages
- Schema is created with `Base.metadata.create_all` — there are **no
  migrations**. A model change means recreating the dev database.
- Interactive docs at `/docs` (Swagger UI)

### Frontend

- **Next.js 16 App Router**, React 19, Tailwind CSS 4 (CSS-first `@theme`, no
  `tailwind.config.js`), TypeScript 5.9
- **Data layer:** React Query hooks (`src/hooks/use-api.ts`) over a lazily
  imported `mock-service` (fetched only when `NEXT_PUBLIC_USE_MOCKS=true`) and a
  lazy axios facade (`src/lib/api.ts` → dynamic `import("./api-client")`), so
  `axios` stays out of the critical chain of public routes
- **Auth:** `AuthProvider` (localStorage JWT + refresh) and `RequireAuth` route
  guard on all portals; the marketing page (`/`) is intentionally *not* gated on
  auth state so the hero paints with the first paint
- **UI:** Radix UI primitives, framer-motion, lucide-react, recharts (behind
  `React.lazy` with a fixed-height skeleton, so charts cost no layout shift),
  sonner toasts, react-hook-form + **zod 3**
- **Visual language:** calm and warm rather than dashboard-bright — warm
  near-black surfaces, hairline borders instead of shadows, generous rounding,
  large light-weight numerals. Two accents with two jobs: `--primary` (sand in
  dark, bronze in light) is interface furniture, `--blush` (soft pastel pink)
  marks the member's own data — streaks, goal progress, activity rings. Dark is
  the canonical theme. All raw colour values live in `src/app/globals.css`;
  `docs/DESIGN_SYSTEM.md` is the binding spec.
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

The database is seeded on first start (2 branches, 3 coaches, 8 athletes, plans,
programs, check-in history, payments). Seeded passwords come from the
`SEED_*_PASSWORD` environment variables; the defaults below are dev-only and the
app logs a warning when it falls back to them.

| Account | Role | Default password | Override with |
| --- | --- | --- | --- |
| `admin@gymapp.ir` | admin | `admin123` | `SEED_ADMIN_PASSWORD` |
| `reception@gymapp.ir` | receptionist | `reception123` | `SEED_RECEPTIONIST_PASSWORD` |
| `coach1@gymapp.ir` … `coach3@` | coach | `coach123` | `SEED_COACH_PASSWORD` |
| `athlete1@gymapp.ir` … `athlete8@` | athlete | `athlete123` | `SEED_ATHLETE_PASSWORD` |

### Frontend

```bash
npm install
npm run dev          # starts apps/web via turbo
```

Set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`) in
`apps/web/.env.local`.

To run the UI with no backend at all, set `NEXT_PUBLIC_USE_MOCKS=true`. The mock
layer is a complete in-memory implementation of every client method — including
messaging and the analytics series — so the whole app is navigable offline. Mock
accounts mirror the seed addresses above; the mock password for every one of them
is `Lumi1234`.

## Scripts

| Command | Location | Description |
| --- | --- | --- |
| `npm run dev` | root | Start frontend dev server |
| `npm run build` | root | Build all workspaces |
| `npm run type-check` | root / `apps/web` | TypeScript check |
| `npm run lint` | `apps/web` | ESLint |
| `npm run test --workspace=apps/web` | root | Vitest (unit) |
| `npx playwright test` | `apps/web` | Playwright (end-to-end) — see caveat below |
| `./venv/bin/python -m pytest tests -q` | `backend` | pytest (contract + RBAC) |

The backend tests need the venv's interpreter: the suite imports `fastapi`, which
a system `python3` will not have.

## Roles

| Role | Portal | Capabilities |
| --- | --- | --- |
| `athlete` | `/athlete` | workouts, goals, check-in, membership, payments, messages |
| `coach` | `/coach` | athletes, exercises, programs, templates, messages |
| `admin` / `receptionist` | `/admin` | members, coaches, plans, payments, analytics, notifications, settings |

Portals are protected client-side (`RequireAuth`); the backend enforces roles on
staff endpoints. Self-registration always produces an `athlete` — a `role` in the
request body is ignored. Create staff accounts through the seed or
`POST /api/v1/users` as an admin.

## Performance

Measured with Lighthouse 12 (mobile default throttling) against a production
build:

| Metric | Baseline | Current |
| --- | ---: | ---: |
| Performance score | 85 | **92** |
| Accessibility | 96 | **100** |
| Speed Index | 6.0 s | **1.2 s** |
| LCP element render delay | 3,921 ms | **126 ms** |
| Color-contrast audit | fail | pass |
| Desktop Performance | 100 | 100 |

Full methodology, fix log (P0/P1/P2) and the measured roadmap for reaching 95+:
[`docs/PERFORMANCE_AUDIT.md`](docs/PERFORMANCE_AUDIT.md).

## Known limitations

- **Password reset cannot complete in production.**
  `POST /api/v1/auth/forgot-password` mints a reset token but there is no mail
  transport configured, so nothing is sent. Outside production the response
  carries the token as `devToken`, which is the only way to reach
  `/auth/reset-password`; in production that field is omitted and the flow is a
  dead end. Wiring up SMTP is the single largest functional gap.
- **No database migrations.** Schema changes require recreating the database.
- **`@playwright/test` is not in `package.json`.** The end-to-end specs under
  `apps/web/e2e/` are committed and the config is self-sufficient, but the
  dependency could not be added in the environment they were written in (no
  registry access, and adding it without regenerating `package-lock.json` would
  break `npm ci`). The `e2e` CI job installs it ad hoc with `--no-save` and is
  `continue-on-error`. Add the dependency properly, then delete both.
- **`npm run build` needs network for the font.** `app/layout.tsx` loads
  Vazirmatn through `next/font/google`, which fetches from
  `fonts.googleapis.com` at build time. CI is fine; an offline or
  proxy-restricted machine fails the build with
  `next/font: Failed to fetch Vazirmatn`, even though nothing else is wrong.
  Self-hosting the family with `next/font/local` removes the dependency and
  speeds up cold builds — it just needs someone with network to fetch the woff2
  files once and commit them.

Every intentional divergence between the implementation and the coordination
spec is recorded under `## Deviations` in
[`docs/API_CONTRACT_V2.md`](docs/API_CONTRACT_V2.md).

## Environment Variables

| Variable | Where | Default |
| --- | --- | --- |
| `SECRET_KEY` | backend | — (required) |
| `DATABASE_URL` | backend | `sqlite:///./gymapp.db` |
| `ENVIRONMENT` | backend | `development` (`production` suppresses `devToken`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | backend | 30 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | backend | 7 |
| `LOGIN_RATE_LIMIT` | backend | per-IP login attempt ceiling |
| `SEED_ADMIN_PASSWORD` | backend | `admin123` |
| `SEED_RECEPTIONIST_PASSWORD` | backend | `reception123` |
| `SEED_COACH_PASSWORD` | backend | `coach123` |
| `SEED_ATHLETE_PASSWORD` | backend | `athlete123` |
| `NEXT_PUBLIC_API_URL` | apps/web | `http://localhost:8000` |
| `NEXT_PUBLIC_USE_MOCKS` | apps/web | unset (real API) |
| `NEXT_PUBLIC_APP_URL` | apps/web | `https://gymapp.ir` (metadata base) |

See `FINAL_REPORT.md` for the full engineering audit, bug fixes, and known gaps,
`docs/API_CONTRACT_V2.md` for the API contract and its deviations, and
`docs/PERFORMANCE_AUDIT.md` for the performance/accessibility audit.
