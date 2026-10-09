import {
  expect,
  test,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
const api = "http://127.0.0.1:8100/api/v1";

async function signIn(page: Page, request: APIRequestContext, role: string) {
  const username =
    role === "receptionist"
      ? "reception"
      : ["athlete", "coach"].includes(role)
        ? `${role}1`
        : role;
  const password = role === "receptionist" ? "reception123" : `${role}123`;
  const result = await request.post(`${api}/auth/login`, {
    data: { email: `${username}@gymapp.ir`, password },
  });
  expect(result.ok()).toBeTruthy();
  const auth = (await result.json()).data;
  await page.addInitScript((data) => {
    localStorage.setItem("auth_tokens", JSON.stringify(data.tokens));
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    localStorage.setItem("theme", "dark");
  }, auth);
  return {
    ...auth,
    headers: { Authorization: `Bearer ${auth.tokens.accessToken}` },
  };
}

for (const [role, routes] of Object.entries({
  athlete: [
    "/athlete",
    "/athlete/programs",
    "/athlete/checkin",
    "/athlete/history",
    "/athlete/profile",
    "/athlete/membership",
    "/athlete/goals",
    "/athlete/calendar",
    "/athlete/messages",
    "/athlete/notifications",
  ],
  coach: [
    "/coach",
    "/coach/athletes",
    "/coach/programs",
    "/coach/exercises",
    "/coach/templates",
    "/coach/messages",
    "/coach/profile",
  ],
  admin: [
    "/admin",
    "/admin/members",
    "/admin/coaches",
    "/admin/plans",
    "/admin/payments",
    "/admin/settings",
    "/admin/profile",
    "/admin/notifications",
  ],
  receptionist: [
    "/admin",
    "/admin/members",
    "/admin/plans",
    "/admin/payments",
    "/admin/profile",
  ],
})) {
  test(`${role}: every portal section renders with the reference canvas`, async ({
    page,
    request,
  }, testInfo) => {
    await signIn(page, request, role);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator(".twilight-dock")).toBeVisible();
        await page.waitForLoadState("networkidle");
      const widths = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        screen: innerWidth,
        canvas: document
          .querySelector(".athlete-shell")!
          .getBoundingClientRect().width,
      }));
      expect(widths.content, route).toBeLessThanOrEqual(widths.screen);
      expect(widths.canvas).toBeLessThanOrEqual(430);
      expect(widths.canvas).toBeGreaterThanOrEqual(
        Math.min(390, widths.screen),
      );
      await page.screenshot({
        path: `test-results/screens/${testInfo.project.name}-${role}-${route.slice(1).replaceAll("/", "-")}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
}

test("plan creation and status changes survive reload", async ({
  page,
  request,
}, info) => {
  await signIn(page, request, "admin");
  await page.goto("/admin/plans");
  await page.getByRole("button", { name: "افزودن پلن جدید" }).click();
  const name = `طرح آزمون ${info.project.name}`;
  await page.getByRole("textbox", { name: "نام پلن", exact: true }).fill(name);
  await page.getByLabel("قیمت (ریال)").fill("750000");
  await page.getByRole("button", { name: "ذخیره پلن", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const card = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "غیرفعال کردن", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "فعال کردن", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    card.getByRole("button", { name: "فعال کردن", exact: true }),
  ).toBeVisible();
});

test("exercise completion, readiness and attendance persist against real API", async ({
  page,
  request,
}) => {
  const auth = await signIn(page, request, "athlete");
  const programs = (
    await (
      await request.get(`${api}/training-programs`, { headers: auth.headers })
    ).json()
  ).data;
  const p = programs.find((p: { exercises: unknown[] }) => p.exercises.length);
  await page.goto(`/athlete/programs/${p.id}`);
  const checkbox = page.getByRole("checkbox").first();
  const label = await checkbox.getAttribute("aria-label");
  if (!(await checkbox.isChecked())) {
    const saved = page.waitForResponse(
      (r) => r.url().endsWith("/complete") && r.request().method() === "POST",
    );
    await checkbox.press("Space");
    expect((await saved).ok()).toBeTruthy();
  }
  await expect(checkbox).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: label!, exact: true }),
  ).toBeChecked();
  const undone = page.waitForResponse(
    (r) => r.url().endsWith("/complete") && r.request().method() === "POST",
  );
  await page
    .getByRole("checkbox", { name: label!, exact: true })
    .press("Space");
  expect((await undone).ok()).toBeTruthy();
  await expect(
    page.getByRole("checkbox", { name: label!, exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: label!, exact: true }),
  ).not.toBeChecked();
  await page.goto("/athlete/history");
  await page.getByRole("button", { name: "پرانرژی", exact: true }).click();
  await expect(page.getByText("وضعیت امروز شما ذخیره شده است.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "پرانرژی", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/athlete/checkin");
  const end = page.getByRole("button", { name: "پایان جلسه و ثبت خروج" });
  if (await end.isVisible()) await end.click();
  await page
    .getByRole("button", { name: "ثبت ورود به باشگاه", exact: true })
    .click();
  await expect(end).toBeVisible();
  await page.reload();
  await expect(end).toBeVisible();
  await end.click();
  await expect(
    page.getByRole("button", { name: "ثبت ورود به باشگاه", exact: true }),
  ).toBeVisible();
});

test("workout player resumes saved sets and completes the exercise", async ({
  page,
  request,
}, info) => {
  const auth = await signIn(page, request, "athlete");
  const p = (
    await (
      await request.get(`${api}/training-programs`, { headers: auth.headers })
    ).json()
  ).data[0];
  const day = Math.min(
    ...p.exercises.map((e: { dayOfWeek: number }) => e.dayOfWeek),
  );
  const exercises = p.exercises
    .filter((e: { dayOfWeek: number }) => e.dayOfWeek === day)
    .sort((a: { order: number }, b: { order: number }) => a.order - b.order);
  const ex = exercises[0];
  await request.post(
    `${api}/training-programs/${p.id}/exercises/${ex.id}/complete`,
    { headers: auth.headers, data: { completed: false, actualSets: 0 } },
  );
  await page.goto(`/athlete/programs/${p.id}`);
  await page.getByRole("button", { name: "شروع جلسه تمرین" }).click();
  const record = page.getByRole("button", {
    name: "ثبت ست انجام‌شده",
    exact: true,
  });
  await record.click();
  await expect(page.getByText("زمان استراحت و تنفس عمیق")).toBeVisible();
  await page.getByRole("button", { name: "توقف تایمر", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "ادامه تایمر", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "بستن", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "شروع جلسه تمرین" }).click();
  await expect(
    page.getByText(`ست ۲ از ${new Intl.NumberFormat("fa-IR").format(ex.sets)}`),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/screens/${info.project.name}-workout-player.png`,
  });
  for (let set = 1; set < ex.sets; set++) {
    const skip = page.getByRole("button", {
      name: "رد کردن استراحت",
      exact: true,
    });
    if (await skip.isVisible()) await skip.click();
    await record.click();
    await expect(record).not.toHaveText("در حال پردازش");
    if (set < ex.sets - 1) await expect(skip).toBeVisible();
  }
  await expect
    .poll(async () => {
      const latest = (
        await (
          await request.get(`${api}/training-programs/${p.id}`, {
            headers: auth.headers,
          })
        ).json()
      ).data;
      return latest.exercises.find((e: { id: string }) => e.id === ex.id)
        .isCompleted;
    })
    .toBe(true);
});

test("profile and branch forms save real data", async ({
  page,
  request,
}, info) => {
  const auth = await signIn(page, request, "admin");
  await page.goto("/admin/profile");
  await page
    .getByRole("button", { name: "ویرایش اطلاعات شخصی", exact: true })
    .click();
  const newName = `مدیر ${info.project.name}`;
  await page.getByRole("textbox", { name: "نام", exact: true }).fill(newName);
  await page
    .getByRole("button", { name: "ذخیره تغییرات", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    (
      await (
        await request.get(`${api}/auth/profile`, { headers: auth.headers })
      ).json()
    ).data.firstName,
  ).toBe(newName);
  await page.goto("/admin/settings");
  await page.getByRole("button", { name: "افزودن شعبه", exact: true }).click();
  const branchName = `شعبه آزمون ${info.project.name}`;
  await page
    .getByRole("textbox", { name: "نام شعبه", exact: true })
    .fill(branchName);
  await page
    .getByRole("textbox", { name: "نشانی", exact: true })
    .fill("تهران، خیابان نمونه");
  await page
    .getByRole("button", { name: "ذخیره تنظیمات", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: new RegExp(branchName) }),
  ).toBeVisible();
});
