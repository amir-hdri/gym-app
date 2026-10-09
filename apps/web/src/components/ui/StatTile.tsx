"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn, formatPersianNumber } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

export interface StatTileProps {
  label: string;
  value: number | string;
  suffix?: string;
  /** Percentage change. Positive is rendered as an up chip, negative as down. */
  delta?: number;
  icon?: React.ReactNode;
  /**
   * `blush` is for a stat that belongs to the *member* — a streak, a personal
   * best, progress toward their own goal. Everything else (counts the business
   * cares about, system totals) stays `default`. See DESIGN_SYSTEM §1.
   */
  tone?: "default" | "blush" | "success" | "warning" | "destructive";
  /** When set, the whole tile becomes a link. */
  href?: string;
  className?: string;
}

const toneMap: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  blush: "bg-blush/10 text-blush",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

/** Up is good, down is bad, zero is neutral — colour follows that, not the tone. */
function DeltaChip({ delta }: { delta: number }) {
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const classes = {
    up: "bg-success/10 text-success",
    down: "bg-destructive/10 text-destructive",
    flat: "bg-muted text-muted-foreground",
  }[direction];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold leading-4",
        classes
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span dir="ltr">{formatPersianNumber(Math.abs(delta))}٪</span>
      <span className="sr-only">
        {direction === "up" ? "افزایش" : direction === "down" ? "کاهش" : "بدون تغییر"}
      </span>
    </span>
  );
}

/**
 * Stat tile: a quiet label above a large light figure, with an optional delta
 * chip and icon (DESIGN_SYSTEM §6).
 *
 * The figure uses `.stat-figure` — weight 300, tabular numerals — rather than
 * a bold number, and that is the point of it: at this size light reads
 * composed where bold reads like a KPI dashboard, and composed is the whole
 * register of this product. Depth comes from the hairline rather than a
 * shadow, for the same reason.
 *
 * Numeric values animate through `AnimatedCounter` (which snaps to the final
 * number under reduced motion); string values render as-is, so a pre-formatted
 * currency or ratio can be passed straight through.
 */
export function StatTile({
  label,
  value,
  suffix,
  delta,
  icon,
  tone = "default",
  href,
  className,
}: StatTileProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="meta-label">{label}</p>
        {icon && (
          <span
            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", toneMap[tone])}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="stat-figure">
          {typeof value === "number" ? (
            <AnimatedCounter value={value} duration={0.8} />
          ) : (
            value
          )}
          {suffix && <span className="stat-unit">{suffix}</span>}
        </span>
        {typeof delta === "number" && <DeltaChip delta={delta} />}
      </div>
    </>
  );

  const surface = cn(
    "block rounded-2xl border border-border bg-card p-5",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          surface,
          "card-hover outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={surface}>{body}</div>;
}
