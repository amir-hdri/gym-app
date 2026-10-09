# FINAL ENGINEERING REPORT — GYM APP (UNIFIED)

**Date:** 2026-08-15 · last updated 2026-10-09 (§12)
**Repository:** https://github.com/amir-hdri/gym-app
**Branch:** `main`
**Build Status:** type-check clean, lint clean (0 errors, 0 warnings), 104 frontend unit tests, 94 backend tests, backend loads 60 paths / 92 operations. `npm run build` cannot complete in the development sandbox — see §11.4.

> Sections 1–8 are a dated record of earlier passes and are left as written.
> Where a fact in them has since changed, §9 onward says so explicitly rather
> than rewriting history. The route count, the zod major version and the
> password-reset status are the three that moved in §9; §11 replaces §1's
> stated visual direction wholesale.

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

1. **`next build` (historical):** SWC dependency downloads from `registry.yarnpkg.com` used to time out in this environment. As of 2026-09-26 `npm run build --workspace=apps/web` completes normally (41/41 routes).
2. **Password reset is a mock:** `/auth/forgot-password` and `/auth/reset-password` simulate success (1s delay) — the backend has no email/password-reset endpoint. Requires SMTP/email service.
3. **No E2E tests:** Playwright/Cypress coverage for login → dashboard → QR check-in not set up.
4. **`packages/` workspaces are empty** (reserved for shared code).
5. **Mock data layer is the default:** `use-api.ts` prefers `mock-service.ts` when `NEXT_PUBLIC_USE_MOCKS=true`, otherwise the real API. Both paths are lazily imported, so neither axios nor the mock fixtures ship in the initial bundle of public routes.
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

## 8. PERFORMANCE & UX AUDIT (2026-09-26)

Full report: **[`docs/PERFORMANCE_AUDIT.md`](docs/PERFORMANCE_AUDIT.md)** (method, fix log, P2 roadmap).

### Measured results (Lighthouse 12, production build)

| Metric (mobile, simulated 4×CPU/150 ms RTT) | Before | After |
|---|---:|---:|
| Performance score | 85 | **92** |
| Accessibility | 96 | **100** |
| Speed Index | 6.0 s | **1.2 s** |
| LCP element render delay | 3,921 ms | **126 ms** |
| First Contentful Paint | 1.24 s | 1.22 s |
| Largest Contentful Paint | 3.46 s | 3.29 s |
| Total Blocking Time | 140 ms | 120 ms |
| Cumulative Layout Shift | 0 | 0 |
| Initial JS transfer | 263 KB | 238 KB |
| Color-contrast audit | ❌ fail | ✅ pass |
| Desktop Performance | 100 | 100 |

### What was fixed

- **P0 — landing page gated behind auth:** `/` no longer renders
  `LoadingScreen` while `AuthProvider` boots; hero copy paints with FCP
  (`src/app/page.tsx`). This is the 3.9 s → 126 ms render-delay fix.
- **P0 — WCAG AA contrast:** new `--primary-solid` token (4.63:1 dark /
  5.16:1 light) replaces `--primary` under light text on solid surfaces
  (Button, Badge, toasts, error pages, nav badges…).
- **P1 — client graph slimming:** prod-only `ReactQueryDevtools`, mock data and
  axios behind lazy `import()` proxies (`hooks/use-api.ts`, `lib/api.ts` →
  `lib/api-client.ts`), `recharts` behind `React.lazy` + skeleton
  (`components/analytics/Charts.tsx`), faster page transitions (180 ms).
- **Reverted after A/B:** `experimental.inlineCss` — HTML grew 4.7 KB → 74.5 KB
  gzip and FCP regressed, so the external stylesheet stays.

### Verification (2026-09-26)

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint --workspaces` | ✅ clean |
| Type-check | `npm run type-check --workspaces` | ✅ clean |
| Unit tests | `npm run test --workspace=apps/web` | ✅ 5/5 passed |
| Build | `npm run build --workspace=apps/web` | ✅ 41/41 routes |
| Prod smoke | `next start -p 3100` + Lighthouse ×4 | ✅ `/`, `/athlete`, `/coach`, `/auth/login` render; mock/devtools/recharts chunks absent from initial HTML |

### Known gaps carried forward

1. LCP 3.3 s simulated is still above the 2.5 s budget — driven by early bytes
   (`framer-motion` 43 KB, web fonts 79 KB, React runtime 116 KB). Ordered
   roadmap in `docs/PERFORMANCE_AUDIT.md` §4.
2. Password reset is still a front-end mock (no backend email flow).
3. No E2E suite; `packages/` workspaces still reserved/empty.
4. Admin role still not registrable from the UI.

---

## 9. CAPABILITY COMPLETION PASS (2026-10-02)

Scope: finish every half-built capability, then rebuild the UI on a coherent
design system. Coordinated across parallel agents against a written contract,
[`docs/API_CONTRACT_V2.md`](docs/API_CONTRACT_V2.md), so that no two workstreams
could rename the same field out from under each other. Everything that could not
be implemented as specified is recorded in that file's `## Deviations` section —
thirteen entries, written from the code afterwards, not aspirationally.

### 9.1 What was missing

The audit that opened this pass found four kinds of gap:

1. **Features with a UI but no backend.** Password reset was a 1-second
   `setTimeout` pretending to succeed (§6.2 above). Messaging did not exist at
   all. Analytics charts rendered hard-coded arrays.
2. **Backend routes with no client method.** `PATCH /users/{id}/status`,
   `POST /users/{id}/password`, `PATCH /payments/{id}/status` and the whole
   program-exercise CRUD trio existed server-side and were unreachable from the
   app — which is why the admin member table had no status control and the coach
   had no program builder.
3. **CRUD holes.** No `PUT`/`DELETE` for exercises or goals, no branch writes, no
   way to delete a plan, no way for staff to send a notification.
4. **A type that had never matched the server.** `UserStatus` declared
   `pending_verification`, which the API has never accepted, and omitted
   `pending`, which it does.

### 9.2 Backend additions

| Area | Added |
|---|---|
| Messaging | `Conversation` + `Message` models, 7 routes under `/messages`, participant-scoped |
| Password reset | `PasswordResetToken` model (SHA-256 hash stored, 30-min TTL, single use), `forgot-password` / `reset-password` / `change-password` |
| Profile | `PUT /auth/profile` |
| Analytics | attendance trend, revenue trend, membership distribution, peak hours, per-athlete activity — all **dense** series (zero-filled gaps) so no chart interpolates |
| CRUD | exercise update/delete (409 when referenced), goal update/delete, branch create/update/delete (409 when occupied), plan delete (soft when referenced), notification create + broadcast, payment update |

Password policy is shared across register / reset / change: ≥8 characters, at
least one letter and one digit; violations are a 422.

**One schema had to be split.** `PasswordChangeRequest` makes `currentPassword`
required, which is right for `/auth/change-password` but made the admin
password-reset path unreachable — an admin has no current password to send, so
the request died at validation with a 422 *before* the handler could apply its
own "admin bypasses" rule. `POST /users/{id}/password` now takes a
`PasswordSetRequest` where the field is optional and the handler enforces it
(401 when a self-service call omits or mis-states it). `/auth/change-password`
is untouched. Deviation 6.

### 9.3 Frontend data layer

`ApiClient` gained 28 methods for the new routes and 7 for backend routes that
already existed but had never been reachable from the app — the four that
blocked the admin and coach screens (`updateUserStatus`, `setUserPassword`,
`updatePaymentStatus`, the program-exercise trio) plus `updateMembership`, which
had a `PUT /memberships/{id}` route and no client method at all.

That leaves 82 client methods against 75 in the mock service. The seven-method
difference is now entirely deliberate: `login`, `logout`, `register`,
`refreshToken` and `getProfile` are session plumbing that mock mode handles
through its own fixture passwords; `getBranch` is a single-row fetch with no
screen behind it; and `qrCheckIn` is explicitly rejected in mock mode with a
readable message, because a scanner demo that silently "succeeds" against no
hardware is worse than one that says it is unavailable. Everything a hook can
reach is implemented, including a working in-memory message thread and every
analytics series, so `NEXT_PUBLIC_USE_MOCKS=true` is a complete offline demo
rather than a half-populated one. 64 hooks in total.

Three architectural constraints from the performance pass (§8) survived intact
and are now written into the contract so a later change cannot quietly undo
them: axios stays behind the lazy `lib/api.ts` proxy, the mock layer stays
behind a lazy `import()`, and recharts stays behind `React.lazy` with a
fixed-height skeleton.

Mutations that can be predicted locally are optimistic against a documented
four-step contract (`onMutate` cancel → snapshot → patch → return;
`onError` restore; `onSettled` invalidate), with shared helpers in
`hooks/api-source.ts`. The patch helpers deliberately never *create* a cache
entry, so a rollback can never delete one that a concurrent query just filled.
The program-builder writes are **not** optimistic, and the hook says why: the
server assigns the row id, resolves the joined exercise and settles `order`, so
a guessed row would flicker into a different one.

### 9.4 Bugs found and fixed during the pass

| # | Severity | Issue | Fix |
|---|---|---|---|
| 17 | **High** | Admin password reset was unreachable — required `currentPassword` 422'd before the handler's admin bypass could run | Split `PasswordSetRequest`; enforcement moved into the handler; 2 tests |
| 18 | **High** | `createTrainingProgram` in the mock service never pushed to the shared store, so in mock mode a coach could create a program and then never fetch it or add exercises to it — the program builder was impossible on the dev and E2E path | `getMockPrograms().push(prog)`; test |
| 19 | **Medium** | `UserStatus` union never matched the server's allow-list | Corrected; a backend test now asserts the server 400s on `pending_verification` |
| 20 | **Medium** | Mock users were seeded on `@gympro.ir` while the backend seeds `@gymapp.ir`, so credentials copied from the README did not work in mock mode | 15 addresses aligned; the password difference is now documented instead of silent |
| 21 | **Low** | `mock-service.test.ts` took 13.4 s because every mock method awaits a real 200–400 ms `sleep` | Partial `vi.mock("./utils")` stubbing only `sleep`; suite back to ~5 s |
| 22 | **Medium** | `POST /memberships`, `/freeze` and `/unfreeze` returned `sessionsRemaining: null`. There is no such column — it is `total - used`, and four handlers patched it into the dumped dict by hand while these three forgot. The TypeScript `Membership` type declares it as a required `number`, so those three responses had always contradicted it | Derived on `MembershipResponse` with a pydantic `model_validator`, and the four hand-patches deleted. One place computes it now, so no future handler can omit it. 2 tests |

Bug 22 is the kind this pass was looking for: not a crash, just a field that
was quietly null on three of seven endpoints, in a shape the frontend type said
could not be null. It surfaced only because the new membership tests asserted
the derived value on a **created** row rather than a listed one.

### 9.4.1 Membership management was unreachable

Beyond the bugs, one whole capability turned out to be stranded. The backend
has had `POST /memberships`, `PUT /memberships/{id}`, `/freeze` and `/unfreeze`
since before this pass; `freezeMembership` and `unfreezeMembership` existed on
the client. But there were no hooks, no mock implementations and no UI, so
assigning a plan to a member and freezing a membership — core gym desk work —
could not be done from the app at all. Closed here: `MembershipInput` type,
`updateMembership` client method, four mock implementations and four hooks
(`useCreateMembership`, `useUpdateMembership`, `useFreezeMembership`,
`useUnfreezeMembership`).

Freeze and unfreeze are **not** optimistic, and the hook says why: both are
state transitions the server rejects outright unless the membership is in the
one state they accept, so a predicted flip would display the new state for a
round trip and then snap back on a 400. The mock mirrors both 400s, and a new
backend test asserts the server really does reject a double freeze — a mock
stricter than the API would be its own bug.

### 9.5 Testing

| Suite | Before | After |
|---|---:|---:|
| Backend (pytest, contract + RBAC) | 79 | **88** |
| Frontend (vitest) | 5 | **94** |

The backend tests share one session-scoped temp database, so the new tests
admin-create their own throwaway accounts rather than mutating a seeded one —
mutating `athlete1@` would break every later test that logs in as them. That
reasoning is in the helper's docstring so the next person does not "simplify" it
back out.

The mock-service tests assert the rules the FastAPI handlers enforce, not the
mock's conveniences. A mock that accepts what the server rejects sends the UI
down a branch it will never take in production, and `NEXT_PUBLIC_USE_MOCKS=true`
is the dev and E2E path — so the mock refuses a bad status, refuses a
self-service password change without the current one, and refuses a non-admin
acting on someone else's account, exactly as the server does.

### 9.6 Limitations of this pass

- **Password reset still cannot complete in production.** It is no longer a
  front-end mock — there is a real token model with hashing, TTL and single-use
  semantics — but there is no mail transport, so outside production the token
  comes back as `devToken` and in production the flow is a dead end. This is the
  single largest remaining functional gap, and it is stated in the README, in
  the contract (Deviation 1) and here.
- **The end-to-end suite has never been executed locally.** `apps/web/e2e/` and
  `playwright.config.ts` are committed, but `@playwright/test` is not in
  `package.json`: this environment cannot reach `registry.npmjs.org`, and adding
  a dependency without regenerating `package-lock.json` would break `npm ci` and
  with it all of CI. The `e2e` CI job installs it ad hoc and is
  `continue-on-error`. **CI will be the first run of those specs.** Deviation 10.
- **The GitHub review the task asked for could not be done.** `api.github.com`
  and `github.com` are both blocked by the sandbox, so every statement in this
  report is from the local checkout at `445b0a5`, which matched `origin/main` at
  the time.
- **No Lighthouse re-measurement.** Local port binding returns EPERM in this
  sandbox, so no dev server, no browser driving and no new Lighthouse run. The
  numbers in §8 are the last measured ones and have **not** been re-verified
  against the new UI; treat them as the state before this pass, not after it.
- **Still no migrations** (`Base.metadata.create_all`), and `packages/`
  workspaces remain reserved and empty.

---

*§9 added 2026-10-02. Every number above is from a command that was run; the
four limitations in §9.6 are the things that were not verified, stated as such.*
---

## 10. ROUTE COVERAGE SWEEP (2026-10-02)

§9 closed the membership gap after it turned up by accident, while checking an
unrelated claim. That raised an obvious question — how many more were there? —
so every mounted operation was diffed against every `ApiClient` call.

### 10.1 Method

`app.routes` gives the authoritative server list; the client side is every
`this.client.<verb>(…)` URL in `api-client.ts`. Both sides normalise path
params to `{x}` so they compare. The first run of this reported 81 of 90 routes
uncovered, which was wrong: the regex matched the TypeScript generic with
`[^>]*`, which stops at the first `>` and so missed every nested generic like
`ApiResponse<Membership[]>` — 73 of the 82 calls in the file. Using `[^(]*`
instead is safe, because a generic never contains a paren.

### 10.2 Result

96 server operations, 85 distinct client calls. Of the gap:

- **6 are FastAPI's own** — `/`, `/health`, `/docs`, `/docs/oauth2-redirect`,
  `/redoc`, `/openapi.json`. A typed client has no reason to call its own schema.
- **5 are decorator aliases** — one handler registered twice, where the client
  already calls the twin. Four are a second *verb* on the same path
  (`PATCH` beside `POST` on notifications read / read-all, goal progress,
  program-exercise complete); one is a second *path* on the same verb
  (`/memberships/{id}/deduct` beside `/deduct-session`). Left alone: the
  duplicate costs nothing and removing one would break any caller that guessed
  the other.
- **3 were real gaps**, now closed — see the table.

| Route | Why it mattered | Added |
|---|---|---|
| `DELETE /notifications/{id}` | the notification list had no way to dismiss a row | `deleteNotification`, mock, `useDeleteNotification` (optimistic) |
| `GET /dashboard/revenue` | the only source of a **daily** revenue series; `/revenue-trend` is monthly-only | `getRevenueSeries`, mock, `useRevenueSeries`, `RevenueSeries` type, `RevenueSeriesChart` |
| `PUT /check-ins/{id}/checkout` | reception's only way to close a session someone left without ending — the POST route always stamps *now* | `checkOutAt`, mock, `useCheckOutAt` |

Nothing in the reverse direction: **0 client calls hit a route that does not
exist.**

### 10.3 The check now runs in CI

`backend/tests/test_route_coverage.py` performs the same diff on every run, so
a route added without a caller fails the build instead of shipping unreachable.
Three tests: no uncovered route, no bogus client URL, and — because an
exemption list rots — each declared alias must still have the twin it claims to
be covered by. That third test caught its own first draft, which assumed every
alias was a sibling *verb* and so mis-handled `/deduct`.

### 10.4 Two behaviours pinned while closing these

- `durationMinutes` is `int(seconds / 60)`; it **truncates**. The stored
  check-in time carries microseconds, so a checkout time with its microseconds
  zeroed falls a fraction short and reports 94 minutes where 95 was intended.
- The mock's `checkOutAt` rejects a checkout earlier than the check-in. The
  server has no such guard and would store the inversion. This is the one place
  the mock is deliberately **stricter** than the API: a demo rendering a
  negative session length is worse than one that refuses the input.

Backend tests went 88 → 94, frontend 94 → 104.

---

## 11. VISUAL LANGUAGE CHANGE (2026-10-02)

§1 describes an Apple-Fitness-inspired look with a saturated rose accent. That
is no longer what the product looks like. The direction was changed on request,
against supplied reference screenshots of a meditation app.

### 11.1 The direction

Calm, warm, premium — the register of a meditation app rather than a fitness
dashboard. Warm near-black surfaces, two desaturated accents, hairline borders
**instead of** shadows, generous rounding, large light-weight numerals, a lot of
air. Dark is canonical; light is its warm-paper counterpart.

### 11.2 Two accents, two jobs

The rule that stops a second colour becoming decoration:

| Token | Colour | Job |
|---|---|---|
| `--primary` | sand (dark) · bronze (light) | interface furniture — buttons, selected chips, active nav, focus rings |
| `--blush` | soft pastel pink, in both themes | the member's own living data — streaks, goal progress, activity rings, unread dots |

Anything that is neither takes no accent at all.

`--blush` / `--blush-solid` / `--blush-foreground` are new tokens, wired through
`@theme` so `bg-blush`, `text-blush` and friends generate.

### 11.3 Things that needed care

- **The themes invert.** In dark, `--primary-solid` is *pale* sand carrying
  near-black ink; in light it is deep bronze carrying white. So `text-white` on
  a primary fill is correct in light and invisible in dark. DESIGN_SYSTEM §2
  rule 3 said "white text only on `--primary-solid`" and is now wrong — it was
  rewritten. Exactly one `text-white` existed in the app; it is in a page being
  rebuilt.
- **Contrast was measured, not estimated.** Every text pair clears AA in both
  themes: foreground 17.08:1 dark / 15.24:1 light, muted 7.30 / 5.60, sand ink
  11.31 / 7.47, blush ink 11.31 / 7.07, and both accent fills under their own
  foreground token (10.77 / 6.88 and 9.88 / 10.58).
- **The hairline is 1.3:1 and that is correct.** WCAG 1.4.11's 3:1 applies to
  borders that *identify a control*, not to decorative dividers. `--input` and
  `--ring` do identify controls, so both were solved to ≥3:1 against every
  surface they sit on (`--input` 3.05 dark / 3.07 light; `--ring` 12.49 / 6.91).
- **Persian has no serif and no uppercase.** The reference carries its headings
  in a light display serif and its captions in tracked ALL-CAPS; neither device
  exists in this script. The equivalent calm is built from scale, weight and
  tracking instead: `h1`/`h2` dropped from 700 to 500 with `-0.025em`, `h3`+
  stay 600, and `.meta-label` gets its quiet from size and letter-spacing with
  no `text-transform`. `.fitness-kicker` remains the uppercasing variant, for
  genuinely Latin text only.
- **`generateAvatarColor` returned `bg-rose-500` and friends** — banned palette
  classes, and a ring of saturated rainbow circles fights the new calm. It now
  returns a token-based background+ink pair, so callers no longer add their own
  `text-white`.
- **Bar charts are pills on a visible track** (design system §6), with radius
  set to half `maxBarSize` so the cap stays a true semicircle at any height.

### 11.4 The production build cannot run in this sandbox

`npm run build --workspace=apps/web` fails, and did before any of this work:
`next/font/google` fetches Vazirmatn at build time and `fonts.googleapis.com`
is blocked here. The failure is the font fetch alone — nothing to do with the
CSS. CI has network and is unaffected.

The stylesheet was therefore verified directly through the Tailwind compiler
API instead, confirming it compiles and that every new `blush` utility
generates. Self-hosting the font with `next/font/local` would remove the
dependency and is the right long-term fix, but the font files cannot be
downloaded here to do it.

> Update 2026-10-09 (§12): superseded. Network access existed after all —
> Estedad, Bodoni Moda, Montserrat and Vazirmatn are now self-hosted under
> `src/app/fonts/` via `next/font/local`, and `npm run build` succeeds fully
> offline.

---

## 12. CAPABILITY COMPLETION + MERGE (2026-10-09)

Three audit agents inventoried the whole stack (backend: 18 issues, data
layer: 12 gaps, UI: 20 partials), then five implementation agents closed them
in parallel, then the remote Twilight line (5 commits ahead on `origin/main`)
was merged in. `main` is now the only branch, local and remote.

### 12.1 Backend

- Auth: forgot-password records quota every request (the check could never
  fire before), reset-password is rate-limited, consumed grants are deleted,
  dead grants pruned; SMTP delivery via `app/mail.py` (Persian template),
  503 in production when unconfigured, `devToken` non-prod only.
- Validation: unified payment vocabulary (`cancelled` on PUT+PATCH, `paid_at`
  cleared on reversal), checkout-after-checkin guard, program/goal reference
  + role checks, membership pricing identity, fresh `completed_at` on
  re-complete, null actuals on undo, athlete `GET /users` page echo.
- Authz: receptionists read-only on goals, admins observer-only on messaging,
  coaches can create memberships and read (never write) own athletes' payments.
- New: `PATCH /users/{id}/role`, `DELETE /check-ins/{id}`,
  `POST /memberships/{id}/renew`, `GET /readiness/history`,
  `branchId` on register + one-time self-set on update.
- Integrity: unknown-branch 404, duplicate-email 409, user delete cascades
  operational rows (keeps financial/shared history), seed gating
  (`SEED_DEMO_DATA`), isolated rate-limit test harness.
- Suite: **171 passed, 4 xfailed** (was 105 + 26 pre-existing failures).

### 12.2 Data layer & features

- Mock auth (`login/register/refreshToken/logout/getProfile` + mock QR)
  makes `NEXT_PUBLIC_USE_MOCKS=true` a genuinely offline demo — login was
  broken before (Network Error against a backend that isn't there).
- `rememberMe` persists to local vs session storage; refresh-token
  stale-closure fixed; profile revalidated on restore; interceptor skips
  refresh for forgot-password/logout and reads both stores.
- New hooks: `useUpdateUserRole`, `useRenewMembership`, `useVoidCheckIn`,
  `useReadinessHistory`, `useBranch`, `useProfile`; mock corrections
  (streaks, payments pending, goal fields, zero-target guard, scoped
  completion); `test_route_coverage` green.
- Features: reception desk + today-check-ins with QR/camera entry, athlete
  check-in/out + self renew/pay + dismiss, readiness widget + energy
  history, coach goal create/delete + `?c=` thread links + member
  visibility, admin hardening (plan/branch deletes, payment/broadcast
  confirms, sent history, single-user send, program assign, staff stats),
  CSV export, avatar URL, notif prefs, Persian 403, resend cooldown, branch
  pickers, mode-aware demo logins, real reset-password flow.
- Phantom-field fixes: admin member/coach pages read `sessionsUsed`,
  `students`, `specialty`, `rating` off the raw user row (literal
  "undefined" on screen) — all now derived from memberships/programs.
- Suite: **138 unit green**, type-check clean, eslint clean (legacy
  `.eslintrc.json` removed; `lint` pins flat config).

### 12.3 Design

- Self-hosted Estedad (UI) + Bodoni Moda/Montserrat (wordmark, inline SVG
  `LumiLogo` wired into headers); Twilight shell kept (responsive
  Sidebar/Header/DockNav).
- Full light theme: dual `@theme` tokens, class-driven `dark:`, `ThemeToggle`
  in the header; ~1,150 hex + ~320 white/black utilities codemodded to
  tokens (dark pixel-identical, verified by screenshot); charts read
  `var(--color-*)`; light QA sweep fixed ~10 illegibilities.
- LCP: static above-fold hero + `content-visibility` below fold; prod
  mobile Lighthouse **91–92 / 100 / 100 / 100** (LCP 3.3 s is the Persian
  webfont swap on simulated 4G — kept deliberately over `display: optional`).

### 12.4 What was deliberately not done

- No light-theme change to fixed-dark brand imagery (hero/scenic art stays
  dark in both themes — it is the product's signature).
- No push-notification transport (terms mention it; needs VAPID + backend —
  prefs are device-local toggles for now).
- No DB migrations mechanism (unchanged), no e2e dependency addition
  (unchanged), no message edit/delete (no backend model for it).
