# API Contract v2 — coordination spec

This file is the **single source of truth** shared by the backend implementation
(`backend/`) and the frontend data layer (`apps/web/src/lib`, `apps/web/src/hooks`).
Both sides are implemented in parallel against this document, so neither may
unilaterally change a name, path, or field. If something here is impossible,
implement the rest and record the deviation in a `## Deviations` section at the
bottom rather than silently renaming.

## Conventions (unchanged from v1)

- All routes are prefixed `/api/v1`.
- Single object: `{ "success": true, "message": str, "data": {...} }` (`success_response`).
- Lists: `{ "success": true, "message": str, "data": [...], "meta": { page, pageSize, total, totalPages } }` (`paginated_response`).
- Errors: `{ "success": false, "error": str, "message": str, "statusCode": int }` (`error_response`).
- **JSON field names are camelCase** on the wire (pydantic `by_alias=True`), snake_case in the DB.
- Timestamps are ISO-8601 strings.
- Auth: `Authorization: Bearer <accessToken>`.
- Staff roles = `{"admin", "receptionist", "coach"}` unless a route says otherwise.
  Admin-only = `{"admin"}`. Management = `{"admin", "receptionist"}`.

---

## 1. Messaging (new)

New models: `Conversation`, `Message`.

```
Conversation: id, athlete_id, coach_id, last_message_at, created_at, updated_at
Message:      id, conversation_id, sender_id, body, read_at, created_at
```

A conversation is uniquely keyed by `(athlete_id, coach_id)`. Participants are
the athlete, the coach, and any `admin`. Anyone else gets 403.

| Method | Path | Roles | Body | Returns |
|---|---|---|---|---|
| GET | `/messages/conversations` | any | — | paginated `Conversation[]` for the caller |
| POST | `/messages/conversations` | any | `{ "participantId": str }` | `Conversation` (idempotent — returns existing if present) |
| GET | `/messages/conversations/{id}` | participant | — | `Conversation` |
| GET | `/messages/conversations/{id}/messages` | participant | — | paginated `Message[]` ascending by `createdAt` |
| POST | `/messages/conversations/{id}/messages` | participant | `{ "body": str }` (1..2000 chars) | `Message` |
| POST | `/messages/conversations/{id}/read` | participant | — | `{ "updated": int }` — marks all messages not sent by the caller as read |
| GET | `/messages/unread-count` | any | — | `{ "count": int }` |

`ConversationResponse` (camelCase):
```json
{
  "id": "c1",
  "athleteId": "u1",
  "coachId": "u2",
  "participant": { "id": "u2", "firstName": "مهسا", "lastName": "احمدی", "role": "coach", "avatarUrl": null },
  "lastMessage": { "id": "m9", "body": "…", "senderId": "u2", "createdAt": "2026-10-01T09:00:00" },
  "unreadCount": 2,
  "lastMessageAt": "2026-10-01T09:00:00",
  "createdAt": "2026-09-01T09:00:00"
}
```
`participant` is the *other* party relative to the caller. For an `admin`
caller, `participant` is the athlete.

`MessageResponse`:
```json
{ "id": "m9", "conversationId": "c1", "senderId": "u2", "body": "…", "readAt": null, "createdAt": "2026-10-01T09:00:00" }
```

---

## 2. Password reset & password change (new)

New model `PasswordResetToken`: `id, user_id, token_hash, expires_at, used_at, created_at`.
Store **only** the SHA-256 hash of the token. TTL 30 minutes. Single use.
Invalidate any outstanding tokens for the user when a new one is issued.

| Method | Path | Roles | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/forgot-password` | public | `{ "email": str }` | `{ "sent": true }` — **always 200**, never reveals whether the email exists |
| POST | `/auth/reset-password` | public | `{ "token": str, "password": str }` | `{ "reset": true }`; 400 on invalid/expired/used |
| POST | `/auth/change-password` | any | `{ "currentPassword": str, "newPassword": str }` | `{ "changed": true }`; 400 if current password wrong |

Delivery: there is no SMTP service in this project. When
`settings.ENVIRONMENT != "production"`, `/auth/forgot-password` additionally
returns `"devToken": "<raw token>"` in `data` **and** logs the reset link, so
the flow is end-to-end testable. In production the field is omitted. This must
be documented in the README — it is a deliberate, visible limitation, not a
hidden one.

Password policy (shared, enforce on register / reset / change): min 8 chars,
at least one letter and one digit.

---

## 3. Profile (new)

| Method | Path | Roles | Body | Returns |
|---|---|---|---|---|
| PUT | `/auth/profile` | any | `{ firstName?, lastName?, phone?, avatarUrl? }` | `User` |

---

## 4. CRUD gaps to fill

Only the rows below are new. Existing routes keep their current behaviour.

| Method | Path | Roles | Notes |
|---|---|---|---|
| PUT | `/exercises/{id}` | admin, coach | `ExerciseUpdate` — partial |
| DELETE | `/exercises/{id}` | admin, coach | 409 if referenced by a program exercise |
| PUT | `/goals/{id}` | owner or admin/coach | `GoalUpdate` — partial |
| DELETE | `/goals/{id}` | owner or admin/coach | |
| POST | `/branches` | admin | `BranchCreate` |
| PUT | `/branches/{id}` | admin | partial |
| DELETE | `/branches/{id}` | admin | 409 if it has members or memberships |
| DELETE | `/membership-plans/{id}` | admin | soft delete → `isActive = false` if referenced, hard delete otherwise |
| POST | `/notifications` | admin, receptionist | `{ userId, title, message, type? }` → one notification |
| POST | `/notifications/broadcast` | admin, receptionist | `{ title, message, type?, role?, branchId? }` → `{ "sent": int }` |
| POST | `/memberships/{id}/deduct-session` | staff | already exists — verify and keep |
| PUT | `/payments/{id}` | admin, receptionist | `{ status?, method?, notes? }` — status in `pending\|completed\|failed\|refunded\|cancelled` (unified with PATCH; leaving `completed` clears `paid_at`) |

---

## 5. Analytics (new, staff-only: admin, receptionist)

All accept optional `?days=<int>` (default 30, max 365) or `?months=<int>`
(default 6, max 24) as noted. Returned series are **ascending by date** and
**dense** — missing days/months are emitted with zero values so the chart does
not have to interpolate.

| Method | Path | Returns `data` |
|---|---|---|
| GET | `/dashboard/attendance-trend?days=30` | `[{ "date": "2026-09-01", "checkIns": 12, "uniqueMembers": 9 }]` |
| GET | `/dashboard/revenue-trend?months=6` | `[{ "month": "2026-09", "revenue": 42000000, "payments": 18 }]` |
| GET | `/dashboard/membership-distribution` | `[{ "planId": "p1", "planName": "…", "count": 24, "revenue": 48000000 }]` |
| GET | `/dashboard/peak-hours?days=30` | `[{ "hour": 18, "checkIns": 44 }]` — all 24 hours present |

Athlete-scoped (owner or admin/coach):

| Method | Path | Returns `data` |
|---|---|---|
| GET | `/dashboard/athlete/{id}/activity?days=30` | `[{ "date": "2026-09-01", "checkedIn": true, "durationMinutes": 52, "exercisesCompleted": 6 }]` |

---

## 6. Frontend contract

`apps/web/src/lib/types.ts` gains: `Conversation`, `ChatMessage`,
`AttendanceTrendPoint`, `RevenueTrendPoint`, `MembershipDistributionSlice`,
`PeakHourPoint`, `AthleteActivityPoint`.

Avoid a name clash: the DOM already has `Message`; use **`ChatMessage`** in TS.

`ApiClient` (`lib/api-client.ts`) gains one method per route above, named:

```
getConversations, createConversation, getConversation, getMessages, sendMessage,
markConversationRead, getUnreadMessageCount,
forgotPassword, resetPassword, changePassword, updateProfile,
updateExercise, deleteExercise, updateGoal, deleteGoal,
createBranch, updateBranch, deleteBranch, deleteMembershipPlan,
createNotification, broadcastNotification, deductSession, updatePayment,
getAttendanceTrend, getRevenueTrend, getMembershipDistribution, getPeakHours,
getAthleteActivity
```

Added afterwards, for backend routes that already existed but had no client
method — the admin and coach screens could not be finished without them:

```
updateUserStatus, setUserPassword, updatePaymentStatus,
addProgramExercise, updateProgramExercise, deleteProgramExercise,
updateMembership, deleteNotification, getRevenueSeries, checkOutAt
```

with hooks `useUpdateUserStatus`, `useSetUserPassword`,
`useUpdatePaymentStatus`, `useAddProgramExercise`, `useUpdateProgramExercise`,
`useDeleteProgramExercise`, plus `useUpdateTrainingProgram`,
`useDeleteTrainingProgram`, `useCreateMembership`, `useUpdateMembership`,
`useFreezeMembership`, `useUnfreezeMembership`, `useDeleteNotification`,
`useRevenueSeries` and `useCheckOutAt` over the client methods that already
existed.
`ProgramExerciseInput` in `lib/types.ts` is the shared body type for the program
builder's writes; it omits `isCompleted` and the `actual*` fields, which belong
to the athlete's `…/complete` call. `MembershipInput` is the same idea for
`POST /memberships`; it omits `sessionsRemaining`, which the server derives.
`RevenueSeries` is the `{ labels, values }` pair `GET /dashboard/revenue`
returns. The last four entries close the gaps recorded in deviation 14.

Added October 2026, for routes that did not exist when v2 was written
(client method + mock + `use<Method>` hook each):

```
updateUserRole, renewMembership, voidCheckIn, getReadinessHistory,
useUpdateUserRole, useRenewMembership, useVoidCheckIn, useReadinessHistory,
useBranch, useProfile
```

plus mock-only auth (`mockService.login/register/refreshToken/logout/getProfile`),
which is what `AuthProvider` calls under `NEXT_PUBLIC_USE_MOCKS=true`, and a
mock `qrCheckIn` so the desk flow works offline.

`hooks/use-api.ts` gains a hook per method, named `use<Method>` with the
existing conventions (`useQuery` for GET, `useMutation` + `invalidateQueries`
for the rest). Query keys extend the existing `Q` map.

**Architectural constraints that must survive:**
- `axios` stays behind the lazy `lib/api.ts` → `lib/api-client.ts` proxy.
- The mock layer stays behind the lazy `import()` proxy in `hooks/use-api.ts`.
- `mock-service.ts` must implement **every** new method so
  `NEXT_PUBLIC_USE_MOCKS=true` remains a fully working offline demo, including
  messaging (in-memory thread that accepts sends) and all analytics series.

---

## 7. New endpoints (October 2026)

Each has a client method, a mock, a hook, and a UI caller — `test_route_coverage`
fails the suite otherwise.

| Method | Path | Roles | Notes |
|---|---|---|---|
| PATCH | `/users/{id}/role` | admin | the single way roles change (PUT strips `role`, register hardcodes `athlete`); 400 on self or unknown role |
| DELETE | `/check-ins/{id}` | admin, receptionist | voids an erroneous record; operational rows cascade on user delete, financial/shared rows are kept |
| POST | `/memberships/{id}/renew` | admin, receptionist, athlete (own) | `{ endDate, sessionsTotal?, resetSessionsUsed? }` — new term, reactivation, counter reset; payment recorded separately via `POST /payments` |
| GET | `/readiness/history?days=14&userId=` | athlete (own), coach (own athletes), admin | newest-first `{ day, state }` rows, max 60 days |
| POST | `/auth/register` | public | now accepts optional `branchId` (honoured only if the branch exists); athletes with no branch may set their own once via `PUT /users/{id}` |

Behaviour changes on existing routes (same table, new rules):
- Coaches may `POST /memberships` for their own athletes and *read* (never
  write) their athletes' payments — the coach athlete-detail page needs both.
- Receptionists are read-only on goals (PUT/progress now 403 like DELETE).
- Admins are observers on messaging: reads allowed, sends and read-marks 403.
- `PUT /check-ins/{id}/checkout` rejects `checkOutTime <= check_in_time`.
- Program/goal creation validates referenced users *and their roles*;
  `MembershipCreate` enforces `final == price − discount` and sane dates;
  re-completing an exercise re-stamps `completed_at`, un-completing nulls actuals.
- `POST /users` 404s on unknown `branchId`; `PUT` 409s on duplicate email;
  athlete `GET /users` echoes the requested `page`.

---

## Deviations

Where the shipped implementation differs from the spec above, and why. Written
after the fact, from reading the code — not a wish list.

### 1. `forgotPassword` mail transport (resolved October 2026)

`POST /auth/forgot-password` mints a reset token and returns 200 whether or not
the address is registered (deliberate: the response must not reveal which).
SMTP delivery now exists (`app/mail.py`, Persian template): when `SMTP_HOST`
and `SMTP_FROM` are configured the link is mailed; otherwise production
answers 503 and non-production falls back to the `devToken` payload field.

Hardening around it: every request burns rate-limit quota (the check could
never fire before), `POST /reset-password` is rate-limited against guessing,
consumed grants are deleted instead of accumulated, and per-user dead grants
are pruned on issue. `devToken` still never appears in production.

### 2. Mock-service signatures take the caller id positionally

The real API infers the caller from the bearer token. `mock-service.ts` has no
token, so the methods that need to know who is asking take the id as their first
argument — `updateProfile(userId, data)`, `changePassword(userId, …)`,
`setUserPassword(callerId, targetId, data)`, `sendMessage(senderId, …)`. The
hooks in `use-api.ts` supply it from `requireUserId()`, so UI code never sees the
difference. The signatures are intentionally **not** the same as `ApiClient`'s.

### 3. `POST /messages/conversations` is athlete + coach only

Creating a conversation requires one athlete and one coach participant, so an
admin or receptionist cannot open a thread — they can only read existing ones
(an admin sees all). Staff-to-member messaging would need a second participant
model and was not built.

### 4. `PaymentUpdate.notes` persists to `Payment.description`

`PUT /payments/{id}` accepts `notes` on the wire, writes it to the model's
`description` column, and `PaymentResponse` echoes it back as `description`.
The request and response field names differ for the same value. Kept because
`description` is the pre-existing column and renaming it would be a migration,
which this project has no mechanism for (`Base.metadata.create_all`, no Alembic).

### 5. Payment status vocabulary (unified October 2026)

`PUT` and `PATCH` used to disagree on `cancelled` (422 on one, 200 on the
other). `PAYMENT_STATUSES` now includes it on both, and any transition *away*
from `completed` clears `paid_at` on both paths, so a reversed payment cannot
keep claiming money changed hands.

### 6. `POST /users/{id}/password` needed its own request schema

§2's `PasswordChangeRequest` makes `currentPassword` required, which is correct
for `/auth/change-password` but made the admin reset path unreachable: an admin
has no current password to send, so the request died at validation with a 422
before the handler could allow it. Split into `PasswordSetRequest`, where the
field is optional and the **handler** enforces it (401 when a self-service call
omits or mis-states it). `/auth/change-password` is unchanged.

### 7. `UserStatus` was wrong on the frontend

`lib/types.ts` declared `"active" | "inactive" | "suspended" |
"pending_verification"`. The server's allow-list is `{active, inactive,
suspended, pending}` — it has never accepted `pending_verification`. The union
now matches the server. Nothing referenced the old member, so this broke no
call site, but any status filter written against it would have taken a 400.

### 8. Mock user emails were on a stale domain

`mock-data.ts` seeded `@gympro.ir` addresses while the backend seeds
`@gymapp.ir`, so credentials copied from the README did not work in mock mode.
Aligned to `@gymapp.ir`. The passwords still differ by design: mock mode uses
`DEFAULT_MOCK_PASSWORD` (`Lumi1234`), the backend uses its `SEED_*_PASSWORD`
environment variables.

### 9. `test_route_count`'s floor moved 69 → 92

The v2 surface added 23 operations. The assertion is a floor, not an equality,
so it catches a router that failed to mount without breaking every time a route
is added.

### 10. The end-to-end suite has never been run locally

`apps/web/e2e/` and `playwright.config.ts` are committed, but
`@playwright/test` is not in `package.json`: this environment cannot reach
`registry.npmjs.org`, and adding a dependency without being able to regenerate
`package-lock.json` would break `npm ci` and with it all of CI. The `e2e` job in
`.github/workflows/ci.yml` therefore does `npm install --no-save` and is marked
`continue-on-error: true`. **CI will be the first execution of those specs.**
Once the dependency is added properly, delete the ad-hoc install and the
`continue-on-error` flag — there is an inline comment in the workflow saying so.

### 11. `sessionsRemaining` was null on three membership endpoints

`MembershipResponse.sessions_remaining` has no column behind it — it is
`sessions_total - sessions_used`. Four handlers (list, get, update, deduct)
computed it by patching the dumped dict; `create`, `freeze` and `unfreeze`
returned the schema default, `None`. The frontend `Membership` type declares
`sessionsRemaining: number`, so those three responses had always contradicted
it, and a screen rendering the value straight off a create or freeze response
showed nothing until the next refetch.

Now derived once in a `model_validator(mode="after")` on the schema, and the
four hand-patches removed. The field cannot be forgotten by a future handler
because no handler fills it any more.

### 12. Membership management existed only on the server

`POST /memberships`, `PUT /memberships/{id}`, `/freeze` and `/unfreeze` predate
this contract and were out of its scope, but they had no hooks, no mock
implementations and no UI, so the app could not assign a plan to a member or
freeze a membership at all. Added in the same shape as the §6 additions:
`MembershipInput`, `updateMembership` on the client, four mock methods and four
hooks.

Freeze/unfreeze are not optimistic and the mock enforces the server's two 400s
(freeze requires `active`, unfreeze requires `frozen`). Both are state
transitions rather than idempotent setters, so a second freeze is an error, not
a no-op — `test_freeze_is_rejected_unless_the_membership_is_active` pins that
down so the mock can never end up stricter than the API.

### 13. The mock layer does not cover seven client methods

`login`, `logout`, `register`, `refreshToken` and `getProfile` are session
plumbing that mock mode handles through its own fixture passwords rather than
the client; `getBranch` is a single-row fetch with no screen behind it. The
seventh, `qrCheckIn`, is the only deliberate dead end: in mock mode the hook
rejects with "QR check-in not available in mock mode" instead of faking a scan,
because a scanner demo that succeeds against no hardware is more misleading
than one that says it is unavailable.

§6's "implement **every** new method" holds — every method a hook can reach is
implemented. These seven are reachable only from `ApiClient`.

### 14. Three server routes had no caller; five apparent gaps were decorator aliases

A systematic diff of every mounted operation against every `ApiClient` call
(90 server operations vs 82 distinct client calls) left eight operations with
no client method. Five turned out to be **dual-decorator aliases** — one
handler registered under two verbs, where the client already calls the other
one:

| Alias | Already called as |
|---|---|
| `PATCH /notifications/{id}/read` | `POST …/read` |
| `PATCH /notifications/read-all` | `POST …/read-all` |
| `PATCH /goals/{id}/progress` | `POST …/progress` |
| `PATCH /training-programs/{id}/exercises/{id}/complete` | `POST …/complete` |
| `POST /memberships/{id}/deduct` | `POST …/deduct-session` |

Those are coverage artefacts, not gaps, and are deliberately left alone: the
duplicate verbs cost nothing and removing one would be a breaking change for
any caller that guessed differently.

The remaining three were real — reachable from `curl` but from nothing in the
app:

- **`DELETE /notifications/{id}`** — the notification list had no way to dismiss
  a row. Added as `deleteNotification` + `useDeleteNotification` (optimistic,
  since a dismissal should feel instant). The route filters on
  `user_id == current_user.id`, so another user's id returns **404, not 403**;
  the UI treats that as "already gone".
- **`GET /dashboard/revenue`** — returns `{ labels, values }` rather than a
  point array, and is the only source of a **daily** (30-day) revenue series;
  `/dashboard/revenue-trend` is monthly-only. Added as `getRevenueSeries` +
  `useRevenueSeries`, with `RevenueSeries` in `lib/types.ts`. Prefer
  `useRevenueTrend` for monthly — same totals, plus a payment count per point.
  The mock's monthly branch delegates to the trend generator so the two can
  never report different numbers for one month.
- **`PUT /check-ins/{id}/checkout`** — **not** an alias of
  `POST /check-ins/check-out`: that one always stamps *now*, this one takes the
  time in the body, which is how reception closes a session a member left
  without ending. Added as `checkOutAt` + `useCheckOutAt`. Both refuse an
  already-closed session with a 400, so this fills a missing checkout but
  cannot correct a wrong one.

Two behaviours worth knowing, both pinned by tests rather than inferred:

1. `durationMinutes` is `int(seconds / 60)` — it **truncates**. The stored
   check-in time carries microseconds, so a checkout time with its microseconds
   zeroed lands a fraction of a second short and reports 94 minutes for what
   looks like 95.
2. The mock's `checkOutAt` rejects a checkout earlier than the check-in. The
   server has no such guard and would store the inversion. This is the one place
   the mock is deliberately **stricter** than the API: a demo that renders a
   negative session length is worse than one that refuses the input.
