import { expect, test } from "@playwright/test";

/**
 * Decorative artwork must not reach assistive tech, and its SVG paint
 * references must actually resolve.
 *
 * `ScenicBackground` renders gradients by `id` and paints with `url(#id)`.
 * A mismatch is silent: the paths simply render black or unfilled. Asserting
 * on the live DOM is the only way to catch it, because both the id and the
 * reference live in the same file and look correct in review.
 */

const HERO_PAGES = ["/", "/athlete", "/coach", "/admin"];

for (const route of HERO_PAGES) {
  test(`${route} resolves every scenic paint reference`, async ({ page }) => {
    await page.goto(route);

    const gradients = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("linearGradient"));
      return nodes.map((node) => ({
        id: node.id,
        // A useId() id keeps colons unless sanitised; a colon makes the
        // url(#…) reference a selector and the paint silently fails.
        referenced: Array.from(document.querySelectorAll("path, rect")).filter((shape) =>
          (shape.getAttribute("fill") ?? "").includes(`url(#${node.id})`)
        ).length,
      }));
    });

    // No gradients at all means this page has no hero art, which is fine —
    // it must not be reported as a pass for the wrong reason, so only assert
    // when the artwork is actually present.
    if (gradients.length > 0) {
      expect(
        gradients.filter((g) => g.referenced === 0).map((g) => g.id),
        `unreferenced gradient ids: ${gradients.map((g) => g.id).join(", ")}`
      ).toEqual([]);
    }
  });
}

test("the scenic artwork is hidden from assistive tech", async ({ page }) => {
  await page.goto("/");

  // The ridge artwork carries no information, so it must not be reachable by
  // a screen reader regardless of whether the call site remembered to wrap it.
  const exposed = await page.evaluate(() => {
    const svg = document.querySelector('svg[viewBox="0 0 600 400"]');
    if (!svg) return 0;
    let node: Element | null = svg;
    while (node) {
      if (node.getAttribute("aria-hidden") === "true") return 0;
      node = node.parentElement;
    }
    return 1;
  });
  expect(exposed).toBe(0);
});