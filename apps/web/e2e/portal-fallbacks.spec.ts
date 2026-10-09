import { expect, test } from "@playwright/test";

/**
 * Portal fallbacks keep the shell mounted.
 *
 * The root error/not-found pages are full-screen walls that tear down the
 * whole shell — dock, header, drawer. A portal whose page crashes (or whose
 * deep link matches nothing) must not eject the user out of their
 * navigation: the dock has to stay reachable on the same screen.
 */

/** Seeds a session so the portal shell renders (see nav.spec.ts for why). */
async function signIn(
  page: import("@playwright/test").Page,
  role: "athlete" | "coach" | "admin"
) {
  await page.addInitScript(
    ([userRole]) => {
      localStorage.setItem(
        "auth_tokens",
        JSON.stringify({
          accessToken: "e2e-access-token",
          refreshToken: "e2e-refresh-token",
          accessTokenExpiry: new Date(Date.now() + 3_600_000).toISOString(),
          refreshTokenExpiry: new Date(Date.now() + 86_400_000).toISOString(),
        })
      );
      localStorage.setItem(
        "auth_user",
        JSON.stringify({
          id: `e2e-${userRole}`,
          email: `${userRole}@gymapp.ir`,
          firstName: "کاربر",
          lastName: "آزمون",
          role: userRole,
          status: "active",
          avatarUrl: "",
        })
      );
    },
    [role] as [string]
  );
}

const PORTALS = [
  { root: "/athlete", role: "athlete" as const, linkHref: "/athlete" },
  { root: "/coach", role: "coach" as const, linkHref: "/coach" },
  { root: "/admin", role: "admin" as const, linkHref: "/admin" },
];

for (const portal of PORTALS) {
  test(`${portal.root}: an unknown route keeps the dock on screen`, async ({ page }) => {
    await signIn(page, portal.role);
    await page.goto(`${portal.root}/this-route-does-not-exist`);

    // The portal 404 renders inside the shell — the dock must survive it.
    await expect(
      page.locator('nav[aria-label="ناوبری اصلی"]')
    ).toBeVisible();
    expect(await page.locator('nav[aria-label="ناوبری اصلی"] a').count()).toBeGreaterThan(0);
    await expect(page.getByRole("heading", { name: "این بخش وجود ندارد." })).toBeVisible();

    // And the way forward works.
    await page.locator('nav[aria-label="ناوبری اصلی"] a[href="/' + portal.role + '"]').first().click();
    await expect(page).toHaveURL(new RegExp(`^.*${portal.root}/?$`));
  });
}

test("athlete portal 404 does not throw the shell away in the page source", async ({ page }) => {
  // A client-rendered shell that survived a 404 must keep its header text.
  await signIn(page, "athlete");
  await page.goto("/athlete/does-not-exist");

  await expect(page.getByText("LUMI WELLNESS").first()).toBeVisible();
});
