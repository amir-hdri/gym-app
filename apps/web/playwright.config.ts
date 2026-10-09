import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end suite for the Lumi Wellness web app.
 *
 * The specs run against the mock data layer, so no backend or database is
 * needed. `NEXT_PUBLIC_USE_MOCKS` is inlined at build time, which is why the
 * webServer command below builds *and* starts with it set — exporting it only
 * for `next start` would have no effect on an already-built bundle.
 */

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results/mock",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  // The app is Persian-first; a non-fa locale or a non-Tehran clock changes
  // every date and numeral the specs read.
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Mobile first, and listed first: this is the primary target.
    { name: "mobile", use: { ...devices["Pixel 5"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // A cold Next build on a CI runner is the slow part, not the server boot.
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
    env: { NEXT_PUBLIC_USE_MOCKS: "true", NEXT_BUILD_DIR: ".next-e2e" },
  },
});
