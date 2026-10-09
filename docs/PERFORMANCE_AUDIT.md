# Performance & UX Audit — `apps/web`

**Date:** 2026-09-26 · **Scope:** marketing/landing route (`/`) + portal shell, production build
**Stack:** Next.js 16.3.1 (App Router, Turbopack), React 19, Tailwind CSS 4, RTL Persian

---

## 1. Method

Measure → prioritise → fix → re-measure. Every number below comes from the same
harness, so before/after are directly comparable.

```bash
# 1. production build
npm run build --workspace=apps/web

# 2. serve the build (port 3100 keeps dev :3000 free)
npx next start -p 3100          # from apps/web

# 3. Lighthouse 12, headless Chrome, default simulated throttling
npx lighthouse http://localhost:3100/ --output=json --output-path=/tmp/lh-mobile.json \
  --chrome-flags="--headless=new" --quiet
npx lighthouse http://localhost:3100/ --preset=desktop --output=json \
  --output-path=/tmp/lh-desktop.json --chrome-flags="--headless=new" --quiet

# 4. quality gates
npm run lint --workspace=apps/web
npm run type-check --workspace=apps/web
npm run test --workspace=apps/web
```

Artifacts: `/tmp/lh-mobile-before.json`, `/tmp/lh-mobile-after3.json`,
`/tmp/lh-desktop-before.json`, `/tmp/lh-desktop-after3.json`.

---

## 2. Results

### Mobile (Lighthouse default: 4× CPU, 150 ms RTT, 1.6 Mbps)

| Metric | Before | After | Δ |
| --- | ---: | ---: | ---: |
| **Performance** | **85** | **92** | **+7** |
| Accessibility | 96 | **100** | +4 |
| Best Practices | 100 | 100 | — |
| SEO | 100 | 100 | — |
| First Contentful Paint | 1.24 s | 1.22 s | −15 ms |
| Largest Contentful Paint | 3.46 s | 3.29 s | −177 ms |
| **LCP element render delay** | **3,921 ms** | **126 ms** | **−97 %** |
| **Speed Index** | **6.0 s** | **1.2 s** | **−80 %** |
| Total Blocking Time | 140 ms | 120 ms | −20 ms |
| Cumulative Layout Shift | 0 | 0 | — |
| Initial JS transfer | 263 KB | 238 KB | −25 KB |
| Initial requests | 23 | 22 | −1 |
| Color-contrast audit | ❌ fail | ✅ pass | — |

### Desktop (`--preset=desktop`)

| Metric | Before | After |
| --- | ---: | ---: |
| Performance / A11Y / BP / SEO | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| Speed Index | 0.8 s | **0.4 s** |
| LCP | 0.7 s | 0.7 s |
| Total Blocking Time | 0 ms | 0 ms |

**The headline fix is not the score — it is the LCP *render delay*.**
The landing hero paragraph was invisible for 3.9 s because the whole page was
gated behind the auth bootstrap; it now paints with the first paint
(observed FCP == LCP == 139 ms on localhost, was 1841 ms / 3959 ms).

---

## 3. Findings & fixes

### P0 — the page was gated behind authentication

**Symptom:** SSR HTML only contained the `LoadingScreen` spinner; the hero — and
therefore the LCP element — could not paint until `AuthProvider` finished its
token bootstrap and framer-motion's entrance delays elapsed.
`lcp-breakdown-insight`: *element render delay 3,921 ms*.

**Fix** (`src/app/page.tsx`):

- Removed the `if (isLoading) return <LoadingScreen />` gate and the
  `<Suspense fallback={<LoadingScreen />}>` wrapper — the marketing page no
  longer waits on auth state.
- Hero copy (`h1` spans + lead paragraph) is now **static**: it paints at FCP
  instead of waiting for an animation. Entrance animations were shortened and
  kept only for non-content chrome (badge `0.4 s`, CTA `0.1 s`, hero card
  `0.15 s`, scroll indicator).

**Effect:** element render delay 3,921 ms → 126 ms; Speed Index 6.0 s → 1.2 s.

### P0 — color contrast (accessibility 96 → 100)

`#ffffff` on `bg-primary` (`#ff384f`) is 3.54:1 — below WCAG AA 4.5:1 for the
primary CTA button.

**Fix** (`globals.css` + 12 call sites): kept the bright `--primary` for
`text-primary` on dark surfaces (decorative / non-text use), and introduced a
separate **`--primary-solid`** token for surfaces that carry light text:

| Token | dark | light | contrast with `#fff` |
| --- | --- | --- | ---: |
| `--primary` | `hsl(353 100% 61%)` | `hsl(353 85% 52%)` | 3.54:1 ❌ |
| `--primary-solid` | `hsl(353 100% 46%)` = `#eb001b` | `hsl(353 85% 46%)` | **4.63:1 / 5.16:1 ✅** |

Applied to solid surfaces with light text only: `Button` (default), `Badge`,
toasts, error/offline/not-found pages, `DataState`, skip link, active session
row, coach avatar, message bubble, bottom-nav badge, sidebar badges.
Graphics-only `bg-primary` (dots, switch track, checkbox tick, progress bars)
was left untouched.

### P1 — dev/mock/chart code in the client graph

| Fix | File(s) | Effect |
| --- | --- | --- |
| `ReactQueryDevtools` is dev-only (`lazy()` + `() => null` in prod, `<Suspense>` fallback) | `app/providers.tsx` | no devtools chunk in prod |
| Mock data behind a lazy `Proxy` + `import("@/lib/mock-service")` | `hooks/use-api.ts` | mock chunk is never fetched when `NEXT_PUBLIC_USE_MOCKS` ≠ `true` |
| Axios client behind a lazy proxy (`api.ts` → dynamic `import("./api-client")`) | `lib/api.ts`, `lib/api-client.ts` | **axios (25 KB) removed from `/` critical chain** |
| `recharts` split behind `React.lazy` + `ChartSkeleton` | `components/analytics/Charts.tsx` → `ChartsImpl.tsx` | dashboards load charts on demand; public routes never pay for it |
| Page transition shortened (`0.32 → 0.18 s`, smaller offsets) | `components/animations/PageTransition.tsx` | faster route change feedback |

Verified: no route's initial HTML references the mock, devtools or recharts chunks
(`/`, `/athlete`, `/coach`, `/athlete/messages`, `/auth/login`).

### P1 — UX polish

- Active-session row, badges and buttons now use `--primary-solid` (contrast).
- Route transitions are snappier (180 ms) without changing the visual design.

### Tried and **reverted** — `experimental.inlineCss`

Inlining the 120 KB Tailwind sheet removes the render-blocking stylesheet
request (462 ms estimated saving) but duplicates the CSS inside the RSC payload:

| | HTML (gzip) | FCP | Speed Index | Score |
| --- | ---: | ---: | ---: | ---: |
| `inlineCss: false` (kept) | **14.7 KB** | 1.22 s | 1.2 s | **92** |
| `inlineCss: true` (reverted) | 74.5 KB | 1.37 s | 1.5 s | 88 |

Decision: keep the external stylesheet — one small, cacheable request; the
byte cost of inlining outweighed the round-trip it saved.

---

## 4. Remaining (P2) — measured, ordered by expected gain

Lighthouse's simulated LCP is dominated by **bytes issued before the observed
LCP** (everything is re-simulated as if render-blocking at 4× CPU). Current
early payload on `/`: 238 KB JS + 79 KB fonts + 20 KB CSS.

| # | Item | Size | Notes |
| --- | --- | ---: | --- |
| 1 | `framer-motion` in the marketing shell (43 KB gz) | 43 KB | Pulled by `MotionConfig` in `app/providers.tsx` and by `ScrollReveal`/`Stagger`. Needs SSR-stable reveal wrappers (plain `<div>` on the server, framer after mount) so content stays in the HTML. Biggest single remaining lever. |
| 2 | Web fonts (79 KB: arabic 46 KB + latin 34 KB) | 79 KB | Both are preloaded now. Next step: subset Vazirmatn to the Persian glyph set (drop latin-ext) → est. −25–30 KB. |
| 3 | `react` + `react-dom` + Next runtime (116 KB) | 116 KB | Fixed platform cost; only meaningful change would be dropping unused React features. |
| 4 | `unused-javascript` audit (74 KB savings) | 74 KB | Mostly the same chunks as above. |
| 5 | `legacy-javascript` (13 KB) | 13 KB | `Array.prototype.at` etc. — add modern `browserslist` to `apps/web/package.json` to drop transpiled helpers. |
| 6 | Render-blocking CSS (460 ms) | 20 KB | Acceptable; revisit only if FCP regresses below 1.0 s. |

Also worth doing (UX, not scored):

- The PWA install banner overlaps the hero CTA at short viewports
  (`PwaRegister`) — add bottom padding to the landing page while visible.
- `next/image` is not used anywhere (`Avatar.tsx` still uses `<img>`).

---

## 5. Verification

```
eslint .          → clean
tsc --noEmit      → clean
vitest run        → 2 files / 5 tests passed
next build        → 41/41 routes generated
```

---

## 6. October 2026 re-measurement (merge line)

Harness: production build served on :3100, MCP Lighthouse 13.5, mobile with
throttling (same simulated Moto G4 profile as §2).

| Metric | §2 After | Now | Δ |
| --- | ---: | ---: | --- |
| Performance | 92 | **91–92** | — |
| Accessibility / Best Practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 | — |
| FCP | 1.22 s | **0.9–1.1 s** | faster |
| Speed Index | 1.2 s | **0.9–1.6 s** | — |
| TBT | 120 ms | **60–90 ms** | faster |
| LCP | 3.29 s | **3.3–3.5 s** | — |
| CLS | 0 | 0 | — |

What moved LCP since §2: the hero entrance `Reveal`s (0.1–0.5 s of delay on
the LCP element) were removed — above-fold hero paints statically — and
below-fold landing sections got `content-visibility: auto` with an 800 px
intrinsic size. Measured effect: FCP/SI/TBT all improved; LCP itself did not,
because the remaining 3.3 s is the **Persian webfont swap under throttling**
(Estedad 57 KB over simulated 4G): the LCP element is hero text, painted by a
trace at 138 ms unthrottled. `display: swap` was kept deliberately — `optional`
would score higher but show the system font to slow-network users, and the
typeface is the product's face. Verdict: 91–92 is the honest ceiling for this
stack on this profile; further LCP gains need font subsetting (P2 item 2),
not code changes.
