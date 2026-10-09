"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT, useReducedMotion } from "@/lib/motion";

export interface MeterProps {
  value: number;
  max: number;
  /**
   * `blush` is the default on purpose: a meter on an admin screen is the
   * *member's own* data — sessions used, goal progress — and DESIGN_SYSTEM §1
   * reserves the pastel for exactly that. Interface furniture keeps `--primary`,
   * so `tone="primary"` is for a bar that measures the club rather than a person.
   */
  tone?: "blush" | "primary" | "muted";
  /** Accessible name. The bar is a `progressbar`, so this is not optional in practice. */
  label: string;
  /** Overrides the announced value text (e.g. "۳ از ۱۲ جلسه"). */
  valueText?: string;
  className?: string;
}

const toneMap = {
  blush: "bg-blush-solid",
  primary: "bg-primary-solid",
  muted: "bg-muted-foreground/40",
} as const;

/**
 * A flat, token-filled meter on a `--muted` track.
 *
 * Hand-rolled rather than `components/ui/Progress` because that one's indicator
 * carries a `bg-gradient-to-l from-activity-move to-activity-stand` that a
 * caller cannot remove — `bg-none` does not override it (tailwind-merge keeps
 * `bg-gradient-*` and `bg-none` in different groups), so every admin bar would
 * have been painted in the activity tokens, which §1 keeps to charts.
 *
 * The fill animates with `scaleX` — transform only, no animated width — and
 * collapses to its final position under `prefers-reduced-motion`.
 */
export function Meter({ value, max, tone = "blush", label, valueText, className }: MeterProps) {
  const reduced = useReducedMotion();
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      aria-valuetext={valueText}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <motion.div
        className={cn("origin-inline-start h-full w-full rounded-full", toneMap[tone])}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: ratio }}
        transition={reduced ? { duration: 0 } : { duration: DURATION.slow, ease: EASE_OUT }}
      />
    </div>
  );
}
