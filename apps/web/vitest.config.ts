import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // Scoped to src/ on purpose. Vitest's default glob would also match the
    // Playwright specs in e2e/, which need a real browser rather than jsdom.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
