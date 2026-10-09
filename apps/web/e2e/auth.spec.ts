import { expect, test } from "@playwright/test";

/**
 * Client-side validation on the auth forms. Nothing here needs a backend: the
 * assertions all land before a request would be made.
 *
 * Selectors are accessible names, not class names or test ids, so a visual
 * redesign of these pages does not invalidate the suite — only a change to the
 * labels or the error copy does, and that is a change worth noticing.
 */

const PHONE_INVALID = "شماره موبایل نامعتبر است";

test.describe("sign in", () => {
  test("refuses an empty submit and stays put", async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("ایمیل ضروری است")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test("rejects a malformed email", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("ایمیل", { exact: true }).fill("not-an-email");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("فرمت ایمیل نامعتبر است")).toBeVisible();
  });

  test("marks the invalid field for assistive tech", async ({ page }) => {
    await page.goto("/auth/login");
    const email = page.getByLabel("ایمیل", { exact: true });
    await page.locator('button[type="submit"]').click();

    // The message alone is not enough — the field has to announce as invalid
    // and point at its own error text.
    await expect(email).toHaveAttribute("aria-invalid", "true");
    const describedBy = await email.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toBeVisible();
  });

  test("reaches registration from the sign-in page", async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator('a[href="/auth/register"]').first().click();
    await expect(page).toHaveURL(/\/auth\/register$/);
  });
});

test.describe("registration phone validation", () => {
  async function submitWithPhone(page: import("@playwright/test").Page, phone: string) {
    await page.goto("/auth/register");
    await page.getByLabel("شماره موبایل", { exact: true }).fill(phone);
    await page.locator('button[type="submit"]').click();
  }

  // Regression guard. `validateIranianPhone` strips every non-digit before
  // matching, so the "+" of "+98…" is already gone and the country code has to
  // be matched as bare digits. It was not, and these forms were rejected at the
  // register form while being perfectly valid.
  for (const phone of ["09123456789", "9123456789", "+989123456789", "00989123456789", "0912 345 6789"]) {
    test(`accepts ${phone}`, async ({ page }) => {
      await submitWithPhone(page, phone);

      // The other fields are empty and will error; only the phone must not.
      await expect(page.getByText(PHONE_INVALID)).toHaveCount(0);
    });
  }

  for (const phone of ["08123456789", "02112345678", "091234567"]) {
    test(`rejects ${phone}`, async ({ page }) => {
      await submitWithPhone(page, phone);
      await expect(page.getByText(PHONE_INVALID)).toBeVisible();
    });
  }

  test("requires the terms checkbox", async ({ page }) => {
    await page.goto("/auth/register");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("پذیرش قوانین الزامی است")).toBeVisible();
  });

  test("catches a password mismatch", async ({ page }) => {
    await page.goto("/auth/register");
    await page.getByLabel("رمز عبور", { exact: true }).fill("secret123");
    await page.getByLabel("تکرار رمز عبور", { exact: true }).fill("secret124");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("رمز عبور و تکرار آن یکسان نیستند")).toBeVisible();
  });
});
