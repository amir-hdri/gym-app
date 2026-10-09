/**
 * Shared motion vocabulary — the single source of truth for timing, easing and
 * variants across the app (see `docs/DESIGN_SYSTEM.md` §4).
 *
 * Import these. Do not redefine durations, easings or variants in a page or a
 * component; if something is missing here, add it here.
 *
 * This module is deliberately **runtime-dependency-free**:
 *   - `framer-motion` is imported with `import type` only, so nothing from it
 *     ends up in a bundle that merely wants `DURATION`.
 *   - It carries no `"use client"` directive, so a server component can import
 *     the constants and variants safely.
 *   - `useReducedMotion` is the one export that is a React hook. It is built on
 *     `useSyncExternalStore` (React core, SSR-safe) rather than
 *     framer-motion's, so importing this module never pulls framer-motion in.
 *     Like any hook it must still be *called* from a client component.
 */

import { useSyncExternalStore } from "react";
import type { TargetAndTransition, Transition, Variants } from "framer-motion";

/* -------------------------------------------------------------------------- */
/* Timing                                                                      */
/* -------------------------------------------------------------------------- */

export interface DurationScale {
  /** Micro-interaction: hover, press, toggle, checkbox. */
  fast: number;
  /** Element entrance: card, list item, toast. */
  base: number;
  /** Deliberate, larger movements: sheets, hero reveals. */
  slow: number;
  /** Route transition. Hard ceiling — anything slower reads as latency. */
  page: number;
}

export const DURATION: DurationScale = {
  fast: 0.15,
  base: 0.22,
  slow: 0.36,
  page: 0.28,
};

/** Expo-out. The default curve for anything entering the screen. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Symmetric curve for things that move and settle in place. */
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

/* -------------------------------------------------------------------------- */
/* Springs                                                                     */
/* -------------------------------------------------------------------------- */

/** Micro-interactions: press, toggle, chip selection. Settles in ~150 ms. */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.7,
};

/** Layout and shared-element (`layoutId`) movement. Slightly looser. */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

/* -------------------------------------------------------------------------- */
/* Variants                                                                    */
/* -------------------------------------------------------------------------- */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

/** Entrance with a 12 px lift — the §4 ceiling for entrance offset. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
};

/** Default per-item stagger, in seconds. §4 calls for 40–60 ms. */
export const STAGGER_STEP = 0.05;

/**
 * Container variants for a staggered list.
 *
 * Keep lists short: §4 caps stagger at ~8 items. Beyond that, animate the
 * container once instead of every row (`fadeInUp` on the wrapper).
 */
export const staggerContainer = (stagger: number = STAGGER_STEP): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: stagger,
    },
  },
  exit: {},
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
  exit: { opacity: 0 },
};

/* -------------------------------------------------------------------------- */
/* Gestures                                                                    */
/* -------------------------------------------------------------------------- */

export interface PressableGestures {
  whileHover: TargetAndTransition;
  whileTap: TargetAndTransition;
}

/**
 * Tactile feedback for buttons and tiles. Transform-only, so it never triggers
 * layout. Spread onto a `motion.*` element: `<motion.button {...pressable} />`.
 */
export const pressable: PressableGestures = {
  whileHover: { scale: 1.02, transition: springSnappy },
  whileTap: { scale: 0.97, transition: springSnappy },
};

/** No-op counterpart, for when motion is reduced. */
export const pressableReduced: PressableGestures = {
  whileHover: {},
  whileTap: {},
};

/* -------------------------------------------------------------------------- */
/* Reduced motion                                                              */
/* -------------------------------------------------------------------------- */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Server/hydration snapshot: assume motion is allowed, then correct on mount. */
function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * `true` when the user asked the OS to reduce motion.
 *
 * Always returns a boolean (framer-motion's own hook returns `boolean | null`,
 * which is awkward at call sites). Client components only.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Opacity-only twin of any entrance variant, for reduced-motion users. */
export const fadeInStatic: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

/** Fully still — no opacity change either. */
export const noMotion: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 1, transition: { duration: 0 } },
};

/**
 * Picks `full` normally and `fadeInStatic` when motion is reduced, so a
 * component can write `variants={withReducedMotion(fadeInUp, reduced)}`.
 */
export function withReducedMotion(full: Variants, reduced: boolean): Variants {
  return reduced ? fadeInStatic : full;
}

/** Shorthand for a tween transition on the shared scale. */
export function tween(
  duration: number = DURATION.base,
  ease: [number, number, number, number] = EASE_OUT,
  delay = 0
): Transition {
  return { duration, ease, delay };
}

/**
 * `pressable`, but inert when the user prefers reduced motion. Both branches
 * are module constants, so the returned object identity is stable.
 */
export function usePressable(): PressableGestures {
  return useReducedMotion() ? pressableReduced : pressable;
}
