"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  selected?: boolean;
  /** Called when the chip is activated. Receives the next selected state. */
  onSelect?: (selected: boolean) => void;
  tone?: "default" | "primary" | "success" | "warning" | "destructive" | "info";
}

const toneMap: Record<NonNullable<ChipProps["tone"]>, { idle: string; active: string }> = {
  default: {
    idle: "border-border bg-card text-foreground hover:bg-muted",
    active: "border-transparent bg-primary-solid text-primary-foreground",
  },
  primary: {
    idle: "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
    active: "border-transparent bg-primary-solid text-primary-foreground",
  },
  success: {
    idle: "border-success/25 bg-success/10 text-success hover:bg-success/15",
    active: "border-transparent bg-success-solid text-success-foreground",
  },
  warning: {
    idle: "border-warning/25 bg-warning/10 text-warning hover:bg-warning/15",
    active: "border-transparent bg-warning-solid text-warning-foreground",
  },
  destructive: {
    idle: "border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15",
    active: "border-transparent bg-destructive-solid text-destructive-foreground",
  },
  info: {
    idle: "border-info/25 bg-info/10 text-info hover:bg-info/15",
    active: "border-transparent bg-info-solid text-info-foreground",
  },
};

/**
 * Filter / selection pill.
 *
 * Rendered as a real `<button>` with `aria-pressed`, so a filter row is
 * keyboard-operable and its state is announced. Touch target is 44px via
 * `min-h-11` (DESIGN_SYSTEM §2.6) even though the visual pill is shorter.
 */
const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, onSelect, tone = "default", onClick, children, ...props }, ref) => {
    const palette = toneMap[tone];

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onSelect?.(!selected);
        }}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold",
          "transition-[color,background-color,border-color,transform] duration-150 ease-out",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.97]",
          selected ? palette.active : palette.idle,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Chip.displayName = "Chip";

export { Chip };
