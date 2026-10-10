"use client";

import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CtaProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
> & {
  variant?: "cream" | "orange" | "ghost" | "outline";
};

/**
 * CTA: cream `bg-primary text-primary-foreground hover:bg-primary rounded-xl`;
 * orange (promo) `bg-cta hover:bg-cta text-logo-ink-inverse` (reference
 * RemixModal/ShowcaseHeader); ghost/outline for secondary actions.
 *
 * Press feedback is pure CSS (`hover:scale` / `active:scale`, transform-only
 * so it never triggers layout). This module deliberately imports no animation
 * runtime: it sits on the landing page's critical path, where every kilobyte
 * of JS lands directly on LCP/TBT. `motion-reduce` keeps it still for users
 * who asked for reduced motion (the framer-motion version had no such guard).
 */
export function CtaButton({ variant = "cream", className, children, ...rest }: CtaProps) {
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold tracking-wide shadow-lg shadow-scrim/40 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.96] motion-reduce:transition-colors motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        variant === "cream" && "bg-primary text-primary-foreground hover:bg-primary",
        variant === "orange" && "bg-cta text-logo-ink-inverse shadow-cta/20 hover:bg-cta",
        variant === "ghost" && "bg-card text-foreground shadow-none hover:bg-secondary",
        variant === "outline" &&
          "border border-primary/50 bg-card text-primary shadow-none hover:bg-secondary",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
