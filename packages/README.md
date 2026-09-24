# packages/

Reserved Turbo workspaces for shared code. Currently empty by design — the
frontend (`apps/web`) and backend (`backend/`) do not yet share a package.

Planned candidates:
- `packages/api-client/` — generated/fetch client mirroring `backend` OpenAPI + `apps/web/src/lib/types.ts`
- `packages/ui/` — shared Radix/Tailwind primitives (currently in `apps/web/src/components/ui`)
- `packages/config/` — shared tsconfig/eslint presets

Do not add a package without wiring it into `turbo.json` tasks and the
consuming app's imports; empty directories alone only slow `npm install`.
