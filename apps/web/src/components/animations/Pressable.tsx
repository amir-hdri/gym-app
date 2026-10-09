"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { pressable, pressableReduced, springSnappy, useReducedMotion } from "@/lib/motion";

export interface PressableProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  /**
   * Render as a different element. Use `"button"` for anything clickable so
   * the control is reachable by keyboard — a pressable `<div>` is not.
   */
  as?: "div" | "button" | "span";
  /** Scale on hover. Defaults to the shared `pressable` gesture (1.02). */
  hoverScale?: number;
  /** Scale while pressed. Defaults to the shared `pressable` gesture (0.97). */
  tapScale?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Tactile wrapper for buttons, tiles and cards.
 *
 * Transform-only (`scale`), driven by `springSnappy` so it settles in ~150 ms
 * (DESIGN_SYSTEM §4), and completely inert under `prefers-reduced-motion`.
 */
const Pressable = React.forwardRef<HTMLDivElement, PressableProps>(
  ({ className, as = "div", hoverScale, tapScale, disabled, children, ...props }, ref) => {
    const reduced = useReducedMotion();
    const Comp = motion[as] as typeof motion.div;

    const gestures =
      reduced || disabled
        ? pressableReduced
        : {
            whileHover: {
              scale: hoverScale ?? (pressable.whileHover.scale as number),
              transition: springSnappy,
            },
            whileTap: {
              scale: tapScale ?? (pressable.whileTap.scale as number),
              transition: springSnappy,
            },
          };

    return (
      <Comp
        ref={ref}
        className={cn("touch-manipulation", className)}
        {...gestures}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Pressable.displayName = "Pressable";

/**
 * Alias of `Pressable`, kept because "magnetic" is the name the spec uses for
 * this affordance. Identical behaviour — cursor-following parallax was
 * deliberately left out: it is meaningless on touch, the primary target here.
 */
const Magnetic = Pressable;

export { Pressable, Magnetic };
