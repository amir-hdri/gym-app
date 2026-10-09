"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motion";

export interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Round the sweep to match the surface it covers. */
  rounded?: "none" | "md" | "lg" | "xl" | "2xl" | "full";
}

const roundedMap: Record<NonNullable<ShimmerProps["rounded"]>, string> = {
  none: "rounded-none",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

/**
 * Loading surface with a specular sweep.
 *
 * Wrap any placeholder block: `<Shimmer className="h-24 w-full" />`, or wrap
 * children to sweep over an existing surface. The sweep is a pseudo-element
 * animated on `transform` only (see `.shimmer-surface` in `globals.css`), and
 * it is dropped entirely under `prefers-reduced-motion`.
 */
const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
  ({ className, rounded = "lg", children, ...props }, ref) => {
    const reduced = useReducedMotion();

    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted",
          roundedMap[rounded],
          !reduced && "shimmer-surface",
          className
        )}
        aria-hidden="true"
        {...props}
      >
        {children}
      </div>
    );
  }
);
Shimmer.displayName = "Shimmer";

export { Shimmer };
