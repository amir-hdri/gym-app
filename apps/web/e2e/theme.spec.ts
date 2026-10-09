import { expect, test } from "@playwright/test";

/**
 * Theme switching and the contrast floor.
 *
 * The app ships two themes from one token set, and the light theme was once
 * unreadable because tokens were authored dark-first. These specs read the
 * tokens as the *browser* resolves them, which is the only measurement that
 * accounts for Tailwind's compilation — parsing globals.css by hand does not.
 */

/** next-themes' default storage key; the app does not override it. */
const THEME_KEY = "theme";

/**
 * Pairs the design system declares as AA body-text combinations. Filled
 * surfaces use the `-solid` siblings: white on raw `--primary` is only 3.5:1,
 * which is exactly why the split exists.
 */
const AA_PAIRS: [fg: string, bg: string][] = [
  ["--foreground", "--background"],
  ["--foreground", "--card"],
  ["--muted-foreground", "--background"],
  ["--muted-foreground", "--card"],
  ["--muted-foreground", "--muted"],
  ["--primary-foreground", "--primary-solid"],
  ["--success-foreground", "--success-solid"],
  ["--warning-foreground", "--warning-solid"],
  ["--destructive-foreground", "--destructive-solid"],
  ["--secondary-foreground", "--secondary"],
  ["--accent-foreground", "--accent"],
  ["--popover-foreground", "--popover"],
];

const AA_NORMAL_TEXT = 4.5;

/**
 * Resolves token pairs to WCAG contrast ratios inside the page. Colors go
 * through a canvas so any syntax Chromium can parse — `hsl()`, `oklch()`,
 * `color-mix()` — is handled, rather than only the ones a regex knows.
 */
async function measureContrast(page: import("@playwright/test").Page, pairs: [string, string][]) {
  return page.evaluate((tokenPairs: [string, string][]) => {
    const styles = getComputedStyle(document.documentElement);
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");

    const toRgb = (css: string): [number, number, number] => {
      // A fillStyle the browser cannot parse is silently ignored, which would
      // read as pure black and invent a passing (or failing) ratio. Compare
      // against two different sentinels so a no-op is detectable.
      ctx.fillStyle = "#000000";
      ctx.fillStyle = css;
      const first = ctx.fillStyle;
      ctx.fillStyle = "#ffffff";
      ctx.fillStyle = css;
      if (ctx.fillStyle !== first) throw new Error(`unparseable color: ${css}`);

      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };

    const luminance = ([r, g, b]: [number, number, number]) => {
      const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    return tokenPairs.map(([fgToken, bgToken]) => {
      const fgRaw = styles.getPropertyValue(fgToken).trim();
      const bgRaw = styles.getPropertyValue(bgToken).trim();
      if (!fgRaw || !bgRaw) {
        return { pair: `${fgToken} on ${bgToken}`, ratio: 0, missing: !fgRaw ? fgToken : bgToken };
      }
      // Tokens are stored as bare HSL components so Tailwind can add an alpha.
      const fg = luminance(toRgb(`hsl(${fgRaw})`));
      const bg = luminance(toRgb(`hsl(${bgRaw})`));
      const [lighter, darker] = fg > bg ? [fg, bg] : [bg, fg];
      return {
        pair: `${fgToken} on ${bgToken}`,
        ratio: Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100,
        missing: null as string | null,
      };
    });
  }, pairs);
}

test.describe("theme", () => {
  test("defaults to dark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  });

  test("honours a stored light preference before first paint", async ({ page }) => {
    await page.addInitScript(
      ([key]) => window.localStorage.setItem(key, "light"),
      [THEME_KEY]
    );
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).not.toHaveClass(/\bdark\b/);

    // A light theme that still paints a dark page means the token block did not
    // take effect.
    const backgroundLuminance = await page.evaluate(() => {
      const bg = getComputedStyle(document.body).backgroundColor;
      const [r, g, b] = bg.match(/\d+(\.\d+)?/g)!.map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    });
    expect(backgroundLuminance).toBeGreaterThan(0.6);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`meets the AA text floor in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => window.localStorage.setItem(key, value),
        [THEME_KEY, theme]
      );
      await page.goto("/");

      const results = await measureContrast(page, AA_PAIRS);

      expect(results.filter((r) => r.missing)).toEqual([]);
      const failures = results.filter((r) => r.ratio < AA_NORMAL_TEXT);
      expect(
        failures,
        `below ${AA_NORMAL_TEXT}:1 — ${failures.map((f) => `${f.pair} = ${f.ratio}`).join(", ")}`
      ).toEqual([]);
    });
  }

  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // The stylesheet zeroes durations under the media query; a non-zero one
    // means a decorative animation escaped the base layer.
    const running = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("*"))
        .filter((node) => {
          const duration = getComputedStyle(node).animationDuration;
          return duration !== "" && duration !== "0s" && getComputedStyle(node).animationName !== "none";
        })
        .map((node) => `${node.tagName.toLowerCase()}.${node.className}`.slice(0, 120))
    );

    expect(running, `still animating under reduced motion: ${running.join(" | ")}`).toEqual([]);
  });
});
