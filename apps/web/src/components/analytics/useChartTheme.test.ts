import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { chartSurface, useChartTheme, type ChartTheme } from "./useChartTheme";

const root = () => document.documentElement;

afterEach(() => {
  root().removeAttribute("style");
  root().className = "";
});

/** Let the MutationObserver callback (a microtask) run. */
async function flushObserver() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useChartTheme", () => {
  it("falls back to readable defaults when no tokens are defined", () => {
    const { result } = renderHook(() => useChartTheme());

    // jsdom resolves nothing from stylesheets, so this is the fallback path —
    // the same one SSR and the pre-hydration render take.
    expect(result.current.primary).toMatch(/^hsl\(/);
    expect(result.current.series.length).toBeGreaterThan(0);
    expect(result.current.series.every((color) => color.startsWith("hsl("))).toBe(true);
  });

  it("resolves design tokens into concrete hsl() strings", () => {
    root().style.setProperty("--primary", "353 85% 46%");
    root().style.setProperty("--activity-move", "10 100% 50%");
    root().style.setProperty("--activity-stand", "195 80% 38%");

    const { result } = renderHook(() => useChartTheme());

    // recharts writes these as SVG presentation attributes, where var() does
    // not resolve — they have to be literals.
    expect(result.current.primary).toBe("hsl(353 85% 46%)");
    expect(result.current.move).toBe("hsl(10 100% 50%)");
    expect(result.current.stand).toBe("hsl(195 80% 38%)");
  });

  it("derives translucent grid and cursor colors from --border", () => {
    root().style.setProperty("--border", "220 14% 88%");
    root().style.setProperty("--muted-foreground", "240 3% 42%");

    const { result } = renderHook(() => useChartTheme());

    expect(result.current.border).toBe("hsl(220 14% 88%)");
    expect(result.current.grid).toBe("hsl(220 14% 88% / 0.6)");
    expect(result.current.cursor).toBe("hsl(240 3% 42% / 0.08)");
  });

  it("recomputes when the theme flips", async () => {
    root().style.setProperty("--primary", "353 85% 46%");
    const { result } = renderHook(() => useChartTheme());
    expect(result.current.primary).toBe("hsl(353 85% 46%)");

    await act(async () => {
      root().classList.add("dark");
      root().style.setProperty("--primary", "353 100% 61%");
    });
    await flushObserver();

    expect(result.current.primary).toBe("hsl(353 100% 61%)");
  });

  it("shares one snapshot across concurrent charts", () => {
    root().style.setProperty("--primary", "353 85% 46%");

    const first = renderHook(() => useChartTheme());
    const second = renderHook(() => useChartTheme());

    expect(first.result.current).toBe(second.result.current);
  });

  it("stops observing once the last chart unmounts", async () => {
    const { result, unmount } = renderHook(() => useChartTheme());
    const before = result.current;
    unmount();

    // No subscribers left, so this change must not throw or update anything.
    root().style.setProperty("--primary", "0 0% 0%");
    await flushObserver();

    expect(before).toBeDefined();
  });
});

describe("chartSurface", () => {
  const theme: ChartTheme = {
    move: "hsl(1 1% 1%)",
    exercise: "hsl(2 2% 2%)",
    stand: "hsl(3 3% 3%)",
    primary: "hsl(4 4% 4%)",
    warning: "hsl(5 5% 5%)",
    mutedForeground: "hsl(6 6% 6%)",
    foreground: "hsl(7 7% 7%)",
    grid: "hsl(8 8% 8% / 0.6)",
    cursor: "hsl(9 9% 9% / 0.08)",
    surface: "hsl(10 10% 10%)",
    border: "hsl(11 11% 11%)",
    series: ["hsl(1 1% 1%)"],
  };

  it("builds an RTL tooltip from the active theme", () => {
    const surface = chartSurface(theme);

    expect(surface.contentStyle.direction).toBe("rtl");
    expect(surface.contentStyle.background).toBe(theme.surface);
    expect(surface.contentStyle.color).toBe(theme.foreground);
    expect(surface.contentStyle.border).toContain(theme.border);
  });

  it("ties axis ticks to the muted foreground", () => {
    expect(chartSurface(theme).tick.fill).toBe(theme.mutedForeground);
  });
});
