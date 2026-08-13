import { test, expect } from "@playwright/test";

test.describe("Twilight Meditation", () => {
  test("Home loads", async ({ page }) => {
    await page.goto("/member/dashboard");
    await expect(page.getByRole("heading", { name: "Good evening" })).toBeVisible();
    await expect(page.getByText("The Art of Letting Go")).toBeVisible();
  });

  test("Explore loads", async ({ page }) => {
    await page.goto("/member/schedule");
    await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
  });

  test("Sign-in loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("Sign-up loads", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test("Forgot-password loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("Studio dashboard is public preview", async ({ page }) => {
    await page.goto("/manager/dashboard");
    await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();
  });
});
