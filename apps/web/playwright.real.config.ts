import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";
const apiPort = 8100;
const webPort = 3300;
const apiURL = `http://127.0.0.1:${apiPort}`;
const baseURL = `http://127.0.0.1:${webPort}`;
export default defineConfig({
  testDir: "./e2e-real",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: "test-results/real",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: [
    {
      command: `cd ../../backend && ${process.env.E2E_PYTHON || "./venv/bin/python"} -m uvicorn app.main:app --host 127.0.0.1 --port ${apiPort}`,
      url: `${apiURL}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ENVIRONMENT: "development",
        DATABASE_URL: `sqlite:///${join(tmpdir(), `gym-e2e-${Date.now()}.db`)}`,
        SECRET_KEY: "e2e-isolated-test-key",
        CORS_ORIGINS: baseURL,
        LOGIN_RATE_LIMIT: "1000",
        SEED_ADMIN_PASSWORD: "admin123",
        SEED_COACH_PASSWORD: "coach123",
        SEED_ATHLETE_PASSWORD: "athlete123",
        SEED_RECEPTIONIST_PASSWORD: "reception123",
      },
    },
    {
      command: `npm run build && npm run start -- --port ${webPort}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 300_000,
      env: {
        NEXT_BUILD_DIR: ".next-real-e2e",
        NEXT_PUBLIC_USE_MOCKS: "false",
        NEXT_PUBLIC_API_URL: apiURL,
      },
    },
  ],
});
