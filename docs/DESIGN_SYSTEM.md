# Design System v2 — coordination spec

Shared by every agent touching `apps/web`. The goal is one coherent, modern,
professional product surface — not six differently-styled areas. Read this
before writing any JSX or CSS.

## 1. Identity

Lumi Wellness is a Persian (RTL), mobile-first, women's wellness club platform.

The visual language is **calm, warm and premium** — the register of a good
meditation app rather than a fitness dashboard. Warm near-black surfaces, two
desaturated accents, hairline borders instead of shadows, generous rounding,
large quiet numerals, and a lot of air. Nothing shouts. The product should feel
like somewhere you wind down, not somewhere you are being measured.

Dark is the **canonical** theme; light is its warm-paper counterpart. Both ship
and both are tested, but where a decision is ambiguous, make it right in dark.

### The two accents, and what each one means

This is the rule that stops the palette becoming decoration:

| Token | Colour | Job |
|---|---|---|
| `--primary` / `bg-primary-solid` | sand (dark) · bronze (light) | **Interface furniture** — primary buttons, selected chips, active nav, focus rings. |
| `--blush` / `bg-blush-solid` | soft pastel pink, in both themes | **The member's own living data** — streaks, goal progress, activity rings, today's marker, unread dots. |

A user can learn that split. Pink sprinkled over chrome, or sand used for a
personal stat, destroys it — so don't. Anything that is neither furniture nor
the member's own data takes no accent at all: it is `--foreground` or
`--muted-foreground`.

Note the inversion between themes: in dark, `--primary` is *pale* sand and its
fill carries **dark** ink (`--primary-foreground`); in light it is deep bronze
carrying **white**. Never hardcode which way round it is — use the token.

Status colours (`--success`, `--warning`, `--destructive`, `--info`) are
deliberately *not* warmed into the palette. An error has to stay legible as an
error; muting it to match the mood is the wrong trade.

`--activity-move|exercise|stand` stay data-only — rings, charts, series
legends — and never appear on chrome.

## 2. Hard rules

These are the rules that previously broke, so they are non-negotiable.

1. **No hardcoded colors in component or page code.** No `text-white`,
   `bg-black`, `text-[#98989D]`, `rgba(...)` in JSX. Use semantic Tailwind
   tokens: `bg-background`, `bg-card`, `text-foreground`,
   `text-muted-foreground`, `border-border`, `bg-muted`, `bg-primary`,
   `text-primary`, `bg-primary-solid`, `bg-blush`, `text-blush`,
   `bg-blush-solid`, `text-success`, `text-warning`,
   `text-destructive`. Raw color values belong in `globals.css` only.
   - The one exception: `text-primary-foreground` **on** a `bg-primary-solid`
     surface, and `text-blush-foreground` on `bg-blush-solid`. Both pairings
     are contrast-checked in both themes.
2. **Both themes must be legible.** Anything written for the dark theme has to
   be re-checked in light. The current landing page is the cautionary example:
   `text-white` over `liquid-glass` renders white-on-white in light mode.
3. **Never hardcode the ink on an accent fill — use `--primary-foreground`.**
   The two themes invert: in dark, `--primary-solid` is pale sand and its ink
   is near-black; in light it is deep bronze and its ink is white. So
   `text-white` on `bg-primary-solid` is correct in light and unreadable in
   dark. `text-primary-foreground` is right in both (10.77:1 dark / 6.88:1
   light) — and the same applies to `text-blush-foreground` on
   `bg-blush-solid` (9.88:1 / 10.58:1). Fill with the `-solid` token, never
   with `--primary` or `--blush`, which are *ink* colours.
4. **Respect `prefers-reduced-motion`.** Every animation must degrade to
   opacity-only or none. Use the shared helpers (§4) — they handle this.
5. **Keep the bundle discipline.** `recharts` stays behind `React.lazy`,
   `axios` and the mock layer stay behind lazy `import()`. Do not add a
   top-level import of a heavy library to a route that is in the public
   critical path (`/`, `/auth/*`).
6. **Touch targets ≥ 44×44 px** on interactive elements. RTL-correct: use
   logical properties (`ms-*`/`me-*`, `start`/`end`) rather than `ml-*`/`mr-*`
   where direction matters.
7. **Do not break existing component props.** `components/ui/*` may gain
   variants and props; it may not rename or remove them. Pages across three
   portals depend on the current API.

## 3. Surfaces & elevation

| Level | Use | Class |
|---|---|---|
| 0 | page background | `bg-background` |
| 1 | cards, panels, list rows | `bg-card border border-border` |
| 2 | raised / hovered card, popover, dialog | `bg-popover` + `shadow-lg` |
| glass | sticky header, bottom tab bar, floating overlay | `liquid-glass-header` / `liquid-glass-tabbar` / `liquid-glass-card` |

Glass is **chrome only**. A page body made of glass cards over a glass
background has no depth and costs paint performance on mobile. At most one
glass layer at a time.

**Depth comes from the hairline and the surface step, not from shadow.** The
shadow tokens still exist and are tuned very low on purpose; reach for a
`border border-border` and the next surface level first. A card that needs a
drop shadow to separate from its background is usually on the wrong level.

Radii: `rounded-xl` (12px) for controls, `rounded-2xl` (16px) for cards,
`rounded-[1.75rem]` for hero/feature panels, `rounded-full` for pills and
avatars. `--radius` is 1rem. Vary radius with hierarchy — one radius on
everything regardless of role is the flattest possible read.

Icons that lead a row or a category sit in a **circular container**
(`rounded-full bg-muted` or a `border-border` outline), not a rounded square.

## 4. Motion

All shared motion lives in **`apps/web/src/lib/motion.ts`** (owned by the
design-system agent; everyone else imports from it, never redefines).

Exports that other agents may rely on:

```ts
export const DURATION = { fast: 0.15, base: 0.22, slow: 0.36, page: 0.28 };
export const EASE_OUT: [number, number, number, number];   // expo-out
export const EASE_IN_OUT: [number, number, number, number];
export const springSnappy: Transition;   // micro-interactions
export const springSoft: Transition;     // layout / shared-element
export const fadeIn: Variants;
export const fadeInUp: Variants;         // y: 12 → 0
export const scaleIn: Variants;          // scale: 0.97 → 1
export const staggerContainer: (stagger?: number) => Variants;
export const staggerItem: Variants;
export const pressable: { whileHover; whileTap };  // scale 1.02 / 0.97
export const useReducedMotion: () => boolean;      // re-export helper
```

Timing discipline:

- **Micro-interaction** (hover, press, toggle, checkbox): 150 ms, `springSnappy`.
- **Element entrance** (card, list item, toast): 220 ms, `EASE_OUT`, offset ≤ 12 px.
- **Route transition**: 280 ms max. It is on the critical path of every
  navigation — anything slower feels like latency, not polish.
- **Stagger**: 40–60 ms per item, capped at ~8 items. Longer lists animate the
  container once, not every row.
- **Loop animations** (pulse, float, shimmer): only on skeletons, live
  indicators, and the landing hero. Never on a data surface a user reads.

Animate `transform` and `opacity` only. No animated `width`, `height`, `top`,
or `box-shadow` on anything that repeats — they trigger layout/paint on every
frame on mid-range Android.

## 5. Typography

Vazirmatn, already wired as `--font-vazirmatn`. Scale is set in `globals.css`
base layer; use heading elements rather than re-sizing with utilities.

The reference language for this product carries its headings in a light,
wide-set display **serif**. Persian has no serif/sans axis to borrow — weight
contrast is the whole typographic range the script offers — so the same
editorial calm is built from **scale, weight and tracking** instead:

- `h1`/`h2` are display type: weight **500**, `-0.025em` tracking, line-height
  1.25. Large and quiet. Do not bold them back up to 700.
- `h3` and below are functional UI labels and stay at **600**. A 500-weight
  17px label loses its hierarchy on a dark surface.
- Line-height runs looser than a Latin equivalent would. Persian ascenders,
  descenders and diacritics collide at 1.15.

Two utilities carry the rest of the language:

- `.meta-label` — the small tracked caption above a value. **It does not
  uppercase**, because Persian script has no case. `.fitness-kicker` is the
  uppercasing variant and is only for genuinely Latin text.
- `.stat-figure` + `.stat-unit` — the large light numeral a stat tile is built
  around (weight 300, tabular numerals) with its unit beside it. Weight is the
  point: at 2rem+ it reads composed rather than loud, which is what separates
  this from a KPI dashboard.

Other rules:

- Numerals in Persian UI use `formatPersianNumber` from `lib/utils.ts`.
- Latin wordmarks/kickers use `.latin-kicker` (handles bidi isolation).
- Body line-height 1.6.

## 6. Data display

- Stat tiles: `.meta-label` above a `.stat-figure` (+ `.stat-unit`), inside a
  `border-border rounded-2xl` tile. Optional delta chip with direction arrow
  using `text-success` / `text-destructive`. The figure is light and large —
  see §5; this is the single most characteristic component in the product.
- Charts: `recharts`, via the existing lazy `components/analytics/Charts.tsx`
  wrapper. **Bars are fully rounded pills on a visible track** — the value bar
  sits over a `--muted` track of full height, both with a radius of half the
  bar width. Series colours come from the activity tokens; grid and axis from
  `--border` / `--muted-foreground`. Always render a skeleton of the same
  height to keep CLS at 0.
- Empty, loading, and error states are mandatory for every data surface — use
  `components/ui/DataState.tsx`. A bare spinner is not an acceptable empty state.

## 7. Accessibility

The project currently scores 100 on Lighthouse a11y. Keep it.

- Every icon-only control needs `aria-label`.
- Focus must be visible: `.ring-focus` or `focus-visible:ring-2`.
- Dialogs/sheets trap focus and close on Escape (Radix handles this — use it).
- Form errors are associated with inputs (`aria-describedby`, `aria-invalid`).
- Live regions (`aria-live="polite"`) for async status: check-in result,
  message sent, save confirmation.
- Decorative motion/graphics get `aria-hidden`.

## 8. File ownership (to avoid parallel-edit conflicts)

| Area | Owner |
|---|---|
| `globals.css`, `components/ui/**`, `components/animations/**`, `lib/motion.ts` | design-system agent |
| `lib/{types,api,api-client,mock-service,mock-data}.ts`, `hooks/**` | data-layer agent |
| `backend/**` | backend agent |
| `app/page.tsx`, `app/auth/**`, `components/auth/**`, `app/terms`, `app/offline` | landing/auth agent |
| `app/athlete/**`, `app/coach/**` | member-portal agent |
| `app/admin/**`, `components/layout/**` | admin/shell agent |

If you need a change in a file you do not own, say so in your final report
instead of editing it.
