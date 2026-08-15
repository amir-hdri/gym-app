# Gym App

A full-stack gym management platform: member, coach, and admin portals with membership plans, training programs, goals, check-ins (incl. staff QR check-in), payments, and dashboards.

## Structure (monorepo)

```
apps/web       Next.js 16 (React 19) frontend — member/coach/admin portals
backend/       FastAPI + SQLAlchemy + SQLite backend — REST API under /api/v1
packages/      shared workspace packages (reserved)
```

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

| Command | Description |
| --- | --- |
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build all workspaces |
| `npm run type-check` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Vitest (run inside `apps/web`) |

## Roles

- `athlete` — member portal: workouts, goals, check-in, membership, payments
- `coach` — coach portal: athletes, exercises, programs, templates
- `admin` / `receptionist` — admin portal: members, coaches, plans, payments, dashboard

Portals are protected client-side (`RequireAuth`) and the backend enforces roles on staff endpoints.