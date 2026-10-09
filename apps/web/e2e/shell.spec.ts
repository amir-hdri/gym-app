import { expect, test } from "@playwright/test";

/**
 * Document-shell guarantees that must hold on every public route, whatever the
 * visual design does. These are the contract the redesign has to keep.
 */

/** Public routes that render without a session. */
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register", "/terms", "/offline"];

test.describe("document shell", () => {
  test("serves the landing page as Persian RTL", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "fa");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(page).toHaveTitle(/Lumi Wellness/);
  });

  test("gives the landing page exactly one h1", async ({ page }) => {
    await page.goto("/");
    // More than one h1 is the most common heading-order regression when a
    // marketing page grows sections.
    await expect(page.locator("h1")).toHaveCount(1);
  });

  for (const route of PUBLIC_ROUTES) {
    test(`${route} has a main landmark the skip link can reach`, async ({ page }) => {
      await page.goto(route);

      const skipLink = page.locator('a[href="#main"]');
      await expect(skipLink).toHaveCount(1);

      // A skip link pointing at an id that does not exist is worse than none:
      // it reads as working to a screen reader and moves focus nowhere.
      await expect(page.locator("#main")).toHaveCount(1);
    });
  }

  test("reveals the skip link on first Tab", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const focused = page.locator("a[href=\"#main\"]");
    await expect(focused).toBeFocused();
    // sr-only until focused, then it must actually be on screen.
    await expect(focused).toBeInViewport();
  });

  test("renders a 404 for an unknown route", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("offers a way into the app from the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/auth/login"]').first()).toHaveCount(1);
    await expect(page.locator('a[href="/auth/register"]').first()).toHaveCount(1);
  });

  test("keeps primary form controls at a thumb-friendly size", async ({ page }) => {
    await page.goto("/auth/login");

    // 44px is the WCAG 2.2 target-size floor and the project's stated minimum.
    // Scoped to submit buttons and text inputs: icon affordances inside a field
    // (the password reveal, for one) are exempt under 2.5.8's inline exception.
    const boxes = await page
      .locator('button[type="submit"]:visible, input[type="email"]:visible, input[type="password"]:visible, input[type="tel"]:visible, input[type="text"]:visible')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          selector: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}`,
          height: Math.round(node.getBoundingClientRect().height),
        }))
      );

    expect(boxes.length).toBeGreaterThan(0);
    const tooSmall = boxes.filter((box) => box.height > 0 && box.height < 44);
    expect(tooSmall, `controls under 44px tall: ${JSON.stringify(tooSmall)}`).toEqual([]);
  });
});
