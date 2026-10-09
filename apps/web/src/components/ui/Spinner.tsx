"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  /**
   * Announced to screen readers. Pass `null` for a purely decorative spinner
   * (inside a button whose own label already says what is happening) — it is
   * then `aria-hidden` with no live region, so nothing is announced twice.
   */
  label?: string | null;
}

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

/**
 * Inline loader. Rotation only — a transform, so it stays on the compositor,
 * and the `prefers-reduced-motion` rule in `globals.css` freezes it.
 */
const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", label = "در حال بارگذاری...", ...props }, ref) => {
    const decorative = label === null;

    return (
      <div
        ref={ref}
        role={decorative ? undefined : "status"}
        aria-live={decorative ? undefined : "polite"}
        aria-hidden={decorative ? true : undefined}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <span
          className={cn(
            "animate-spin rounded-full border-current border-t-transparent",
            sizeMap[size]
          )}
          aria-hidden="true"
        />
        {!decorative && <span className="sr-only">{label}</span>}
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };
