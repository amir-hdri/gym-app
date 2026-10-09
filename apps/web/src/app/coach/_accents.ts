/**
 * Accent discipline for the coach portal (DESIGN_SYSTEM §1).
 *
 * Two accents, two jobs:
 *   - `--primary` (sand/bronze) is **interface furniture** — buttons, selected
 *     chips, active nav, focus rings, avatars.
 *   - `--blush` is **the member's own living data** — goal progress, programme
 *     completion, streaks, unread dots.
 *
 * A coach screen is mostly furniture *about* a member, so the split is easy to
 * get wrong: a progress bar on a coach page still belongs to the athlete, and so
 * takes blush. These constants are the only place that decision is made.
 *
 * Fills use the `-solid` tokens with their matching `-foreground` ink, never
 * `--primary` / `--blush`, which are ink colours and invert between themes
 * (§2 rule 3).
 */

/**
 * Fill for a bar showing an athlete's own progress — programme completion or a
 * goal. Passed to `Progress`'s `indicatorClassName`, where `tailwind-merge`
 * drops the primitive's default activity gradient in favour of this.
 *
 * One flat accent rather than a red/amber/green ramp: the product is a place to
 * wind down, not a dashboard scoring the member (§1). Status colours stay for
 * things that are genuinely statuses.
 *
 * `progressTone` in `./_meta.ts` — used by the already-redesigned coach
 * dashboard and roster — still returns a sand/amber ramp and so reads as
 * interface furniture on a personal stat. That file is outside this slice; see
 * the hand-off notes.
 */
export const MEMBER_PROGRESS_FILL = "bg-blush-solid";

/**
 * Blush fill for a `Badge` carrying the member's own live count — unread
 * messages, for one.
 *
 * `components/ui/Badge.tsx` has no `blush` variant yet and is owned by the
 * design-system agent, so the pairing is applied through `className` (its
 * documented extension point) rather than by editing the primitive.
 */
export const BLUSH_BADGE = "border-transparent bg-blush-solid text-blush-foreground";
