"use client";

import { useSyncExternalStore } from "react";

/**
 * Recharts needs concrete color strings: it writes `fill`/`stroke` as SVG
 * presentation attributes, and browsers do not resolve `var()` there. So we
 * read the resolved design tokens off the document element and re-read them
 * whenever the theme flips.
 *
 * This is the only place in the app allowed to turn tokens into literals.
 */
export interface ChartTheme {
  move: string;
  exercise: string;
  stand: string;
  primary: string;
  warning: string;
  mutedForeground: string;
  foreground: string;
  grid: string;
  cursor: string;
  surface: string;
  border: string;
  /** Categorical ramp for pie/stacked series, ordered for adjacent contrast. */
  series: string[];
}

/** Dark-theme values, used for SSR and for the first paint before the effect runs. */
const FALLBACK: ChartTheme = {
  move: "hsl(353 100% 61%)",
  exercise: "hsl(142 76% 50%)",
  stand: "hsl(195 100% 50%)",
  primary: "hsl(353 100% 61%)",
  warning: "hsl(36 100% 50%)",
  mutedForeground: "hsl(240 1% 57%)",
  foreground: "hsl(0 0% 98%)",
  grid: "hsl(240 2% 22% / 0.6)",
  cursor: "hsl(240 1% 57% / 0.08)",
  surface: "hsl(240 5% 11%)",
  border: "hsl(240 2% 22%)",
  series: [
    "hsl(353 100% 61%)",
    "hsl(195 100% 50%)",
    "hsl(142 76% 50%)",
    "hsl(36 100% 50%)",
  ],
};

function read(styles: CSSStyleDeclaration, token: string, fallback: string, alpha?: number): string {
  const raw = styles.getPropertyValue(token).trim();
  if (!raw) return fallback;
  return alpha === undefined ? `hsl(${raw})` : `hsl(${raw} / ${alpha})`;
}

function readTheme(): ChartTheme {
  if (typeof window === "undefined") return FALLBACK;
  const styles = getComputedStyle(document.documentElement);

  const move = read(styles, "--activity-move", FALLBACK.move);
  const exercise = read(styles, "--activity-exercise", FALLBACK.exercise);
  const stand = read(styles, "--activity-stand", FALLBACK.stand);
  const warning = read(styles, "--warning", FALLBACK.warning);

  return {
    move,
    exercise,
    stand,
    warning,
    primary: read(styles, "--primary", FALLBACK.primary),
    mutedForeground: read(styles, "--muted-foreground", FALLBACK.mutedForeground),
    foreground: read(styles, "--foreground", FALLBACK.foreground),
    grid: read(styles, "--border", FALLBACK.grid, 0.6),
    cursor: read(styles, "--muted-foreground", FALLBACK.cursor, 0.08),
    surface: read(styles, "--popover", FALLBACK.surface),
    border: read(styles, "--border", FALLBACK.border),
    series: [move, stand, exercise, warning],
  };
}

/**
 * The resolved tokens are an external store: the source of truth is the DOM,
 * and it changes outside React when next-themes swaps the theme class. One
 * observer and one cached snapshot are shared by every chart on the page.
 */
type Listener = () => void;

const listeners = new Set<Listener>();
let observer: MutationObserver | null = null;
let snapshot: ChartTheme = FALLBACK;
let stale = true;

function subscribe(listener: Listener): () => void {
  listeners.add(listener);

  if (!observer && typeof window !== "undefined") {
    // Nothing was watching, so the cached snapshot may predate a theme change.
    stale = true;
    observer = new MutationObserver(() => {
      stale = true;
      listeners.forEach((notify) => notify());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}

function getSnapshot(): ChartTheme {
  if (stale) {
    snapshot = readTheme();
    stale = false;
  }
  return snapshot;
}

function getServerSnapshot(): ChartTheme {
  return FALLBACK;
}

/**
 * Resolved chart tokens for the active theme, recomputed when the theme flips
 * so charts recolor with the rest of the UI instead of staying frozen at their
 * first paint.
 */
export function useChartTheme(): ChartTheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Tooltip/axis props shared by every chart so they read as one system. */
export function chartSurface(theme: ChartTheme) {
  return {
    cursor: { fill: theme.cursor },
    contentStyle: {
      direction: "rtl" as const,
      maxWidth: 240,
      borderRadius: "12px",
      border: `1px solid ${theme.border}`,
      background: theme.surface,
      color: theme.foreground,
      boxShadow: "0 12px 32px rgb(0 0 0 / 0.18)",
      whiteSpace: "normal" as const,
      lineHeight: 1.5,
      fontFamily: "var(--font-vazirmatn), system-ui, sans-serif",
      fontSize: "12px",
    },
    labelStyle: { color: theme.foreground, fontWeight: 600 },
    itemStyle: { color: theme.mutedForeground },
    tick: {
      fill: theme.mutedForeground,
      fontSize: 11,
      fontFamily: "var(--font-vazirmatn), system-ui, sans-serif",
    },
  };
}
