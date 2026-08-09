import { test, expect } from "@playwright/test";

test.describe("Gym App — Critical User Journeys", () => {
  test("Sign-in page loads with role selector", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator('[aria-label*="انتخاب نقش"]')).toBeVisible();
    await expect(page.locator('text=جیم‌اپ')).toBeVisible();
  });

  test("Sign-up page loads with form", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test("Forgot-password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  test("Member dashboard requires auth", async ({ page }) => {
    await page.goto("/member/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Manager dashboard requires auth", async ({ page }) => {
    await page.goto("/manager/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("Trainer dashboard requires auth", async ({ page }) => {
    await page.goto("/trainer/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });
});
