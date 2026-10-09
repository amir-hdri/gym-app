"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springSoft, useReducedMotion } from "@/lib/motion";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedOption[];
  size?: "sm" | "md";
  className?: string;
  /** Accessible name for the group. Required when there is no visible label. */
  "aria-label"?: string;
}

const sizeMap = {
  sm: { track: "p-1", item: "min-h-11 px-3 text-[13px]" },
  md: { track: "p-1.5", item: "min-h-11 px-4 text-sm" },
} as const;

/**
 * iOS-style segmented control.
 *
 * The indicator is a single element shared across segments via `layoutId`, so
 * framer-motion animates the *transform* between positions rather than
 * re-painting a background on each option.
 *
 * Accessibility: `role="tablist"` with `aria-selected` and roving arrow-key
 * navigation, which is what a segmented control maps to. Each segment is a
 * real button, so Tab reaches the group and arrows move within it.
 */
export function Segmented({
  value,
  onValueChange,
  options,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: SegmentedProps) {
  const reduced = useReducedMotion();
  const groupId = React.useId();
  const s = sizeMap[size];

  const move = (delta: number) => {
    const index = options.findIndex((o) => o.value === value);
    if (index === -1) return;
    const next = options[(index + delta + options.length) % options.length];
    onValueChange(next.value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Arrow semantics are visual, so they flip with the document direction.
    const rtl =
      typeof document !== "undefined" &&
      getComputedStyle(event.currentTarget).direction === "rtl";
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        move(rtl ? -1 : 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        move(rtl ? 1 : -1);
        break;
      case "Home":
        event.preventDefault();
        onValueChange(options[0].value);
        break;
      case "End":
        event.preventDefault();
        onValueChange(options[options.length - 1].value);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex w-full items-stretch gap-1 rounded-2xl border border-border bg-muted",
        s.track,
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl font-semibold",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "transition-colors duration-150 ease-out",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              s.item
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${groupId}`}
                className="absolute inset-0 rounded-xl border border-border bg-card shadow-[var(--shadow-card)]"
                transition={reduced ? { duration: 0 } : springSoft}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
