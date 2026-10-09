import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockService } from "./mock-service";
import {
  DEFAULT_MOCK_PASSWORD, getMockPrograms, mockExercises, mockPasswords, mockUsers,
} from "./mock-data";
import type { TrainingProgram } from "./types";

// Every mock method awaits a 200–400ms `sleep` to imitate network latency,
// which is the point in the browser and pure waiting here. Stubbing it keeps
// this file instant while leaving the rest of `utils` real.
vi.mock("./utils", async () => ({
  ...(await vi.importActual<typeof import("./utils")>("./utils")),
  sleep: () => Promise.resolve(),
}));

/**
 * Contract tests for the mock service's write paths.
 *
 * `NEXT_PUBLIC_USE_MOCKS=true` is the dev and end-to-end path, so a mock that
 * accepts what the server rejects — or rejects what it accepts — sends the UI
 * down a branch it will never take in production. These assert the rules the
 * FastAPI handlers enforce, not the mock's conveniences.
 *
 * The fixtures are module-level mutable stores shared across this whole file,
 * so each test either creates its own row or restores what it touched.
 */

const ADMIN_ID = "u1";
const COACH_ID = "u2";
const ATHLETE_ID = "u5";

async function freshProgram(): Promise<TrainingProgram> {
  const res = await mockService.createTrainingProgram({
    athleteId: ATHLETE_ID,
    coachId: COACH_ID,
    name: "برنامه تست",
  });
  return res.data!;
}

describe("updateUserStatus", () => {
  const original = mockUsers.find((u) => u.id === ATHLETE_ID)!.status;
  beforeEach(() => {
    mockUsers.find((u) => u.id === ATHLETE_ID)!.status = original;
  });

  it("writes each status the server allows", async () => {
    for (const status of ["inactive", "suspended", "pending", "active"] as const) {
      const res = await mockService.updateUserStatus(ATHLETE_ID, status);
      expect(res.data?.status).toBe(status);
      expect(mockUsers.find((u) => u.id === ATHLETE_ID)?.status).toBe(status);
    }
  });

  it("refuses a status outside the allow-list", async () => {
    // `pending_verification` was in the web client's `UserStatus` union for a
    // while and has never been accepted by the API; the mock must agree.
    await expect(
      mockService.updateUserStatus(ATHLETE_ID, "pending_verification" as never)
    ).rejects.toThrow();
    expect(mockUsers.find((u) => u.id === ATHLETE_ID)?.status).toBe(original);
  });

  it("rejects an unknown user", async () => {
    await expect(mockService.updateUserStatus("nope", "active")).rejects.toThrow(/not found/i);
  });
});

describe("setUserPassword", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockPasswords)) delete mockPasswords[key];
  });

  it("lets a user change their own with the current password", async () => {
    const res = await mockService.setUserPassword(ATHLETE_ID, ATHLETE_ID, {
      currentPassword: DEFAULT_MOCK_PASSWORD,
      newPassword: "newpass123",
    });
    expect(res.data?.changed).toBe(true);
    expect(mockPasswords[ATHLETE_ID]).toBe("newpass123");
  });

  it("refuses a wrong or missing current password for self-service", async () => {
    await expect(
      mockService.setUserPassword(ATHLETE_ID, ATHLETE_ID, {
        currentPassword: "wrong123", newPassword: "newpass123",
      })
    ).rejects.toThrow();
    // Omitting it must not be mistaken for the admin path.
    await expect(
      mockService.setUserPassword(ATHLETE_ID, ATHLETE_ID, { newPassword: "newpass123" })
    ).rejects.toThrow();
    expect(mockPasswords[ATHLETE_ID]).toBeUndefined();
  });

  it("lets an admin set someone else's without the current one", async () => {
    const res = await mockService.setUserPassword(ADMIN_ID, ATHLETE_ID, {
      newPassword: "resetby123",
    });
    expect(res.data?.changed).toBe(true);
    expect(mockPasswords[ATHLETE_ID]).toBe("resetby123");
  });

  it("refuses a non-admin acting on another account", async () => {
    await expect(
      mockService.setUserPassword(COACH_ID, ATHLETE_ID, { newPassword: "resetby123" })
    ).rejects.toThrow();
    expect(mockPasswords[ATHLETE_ID]).toBeUndefined();
  });

  it("enforces the password policy", async () => {
    // Too short, then letters-only, then digits-only.
    for (const bad of ["short1", "nodigitshere", "12345678"]) {
      await expect(
        mockService.setUserPassword(ADMIN_ID, ATHLETE_ID, { newPassword: bad })
      ).rejects.toThrow();
    }
    expect(mockPasswords[ATHLETE_ID]).toBeUndefined();
  });
});

describe("program builder", () => {
  it("registers a created program in the shared store", async () => {
    const program = await freshProgram();
    // Without this the builder's very next step — adding an exercise to the
    // program it just created — cannot find it.
    expect(getMockPrograms().some((p) => p.id === program.id)).toBe(true);
    const fetched = await mockService.getTrainingProgram(program.id);
    expect(fetched.data?.name).toBe("برنامه تست");
  });

  it("adds an exercise with the server's defaults and a resolved exercise row", async () => {
    const program = await freshProgram();
    const added = (await mockService.addProgramExercise(program.id, {
      exerciseId: mockExercises[0].id,
      dayOfWeek: 1,
    })).data!;

    expect(added.programId).toBe(program.id);
    expect([added.sets, added.reps, added.restSeconds]).toEqual([3, "10", 60]);
    expect(added.isCompleted).toBe(false);
    // The real API joins the exercise in and the UI renders its name.
    expect(added.exercise?.name).toBe(mockExercises[0].name);
  });

  it("appends within a day and keeps days independent", async () => {
    const program = await freshProgram();
    const first = (await mockService.addProgramExercise(program.id, {
      exerciseId: mockExercises[0].id, dayOfWeek: 2,
    })).data!;
    const second = (await mockService.addProgramExercise(program.id, {
      exerciseId: mockExercises[1].id, dayOfWeek: 2,
    })).data!;
    const otherDay = (await mockService.addProgramExercise(program.id, {
      exerciseId: mockExercises[2].id, dayOfWeek: 3,
    })).data!;

    expect([first.order, second.order]).toEqual([0, 1]);
    expect(otherDay.order).toBe(0);
  });

  it("updates partially, leaving unmentioned fields alone", async () => {
    const program = await freshProgram();
    const added = (await mockService.addProgramExercise(program.id, {
      exerciseId: mockExercises[0].id, dayOfWeek: 1, sets: 4, reps: "12", restSeconds: 90,
    })).data!;

    const updated = (await mockService.updateProgramExercise(program.id, added.id, {
      sets: 5, notes: "سنگین‌تر",
    })).data!;

    expect(updated.sets).toBe(5);
    expect(updated.notes).toBe("سنگین‌تر");
    expect(updated.reps).toBe("12");
    expect(updated.restSeconds).toBe(90);
  });

  it("removes an exercise from the program", async () => {
    const program = await freshProgram();
    const added = (await mockService.addProgramExercise(program.id, {
      exerciseId: mockExercises[0].id, dayOfWeek: 1,
    })).data!;

    await mockService.deleteProgramExercise(program.id, added.id);

    const fetched = (await mockService.getTrainingProgram(program.id)).data!;
    expect(fetched.exercises.some((e) => e.id === added.id)).toBe(false);
  });

  it("rejects writes against a program or exercise that does not exist", async () => {
    const program = await freshProgram();
    await expect(
      mockService.addProgramExercise("nope", { exerciseId: mockExercises[0].id, dayOfWeek: 1 })
    ).rejects.toThrow(/not found/i);
    await expect(
      mockService.updateProgramExercise(program.id, "nope", { sets: 2 })
    ).rejects.toThrow(/not found/i);
    await expect(
      mockService.deleteProgramExercise(program.id, "nope")
    ).rejects.toThrow(/not found/i);
  });

  it("does not let a partial program edit wipe the exercise list", async () => {
    const program = await freshProgram();
    await mockService.addProgramExercise(program.id, {
      exerciseId: mockExercises[0].id, dayOfWeek: 1,
    });

    await mockService.updateTrainingProgram(program.id, { name: "نام تازه", status: "active" });

    const fetched = (await mockService.getTrainingProgram(program.id)).data!;
    expect(fetched.name).toBe("نام تازه");
    expect(fetched.status).toBe("active");
    expect(fetched.exercises).toHaveLength(1);
  });

  it("deletes a program from the store", async () => {
    const program = await freshProgram();
    await mockService.deleteTrainingProgram(program.id);
    expect(getMockPrograms().some((p) => p.id === program.id)).toBe(false);
  });
});

describe("membership lifecycle", () => {
  const PLAN_ID = "p1";
  const BRANCH_ID = "b1";

  async function freshMembership(status?: "active" | "frozen") {
    const res = await mockService.createMembership({
      userId: ATHLETE_ID,
      planId: PLAN_ID,
      branchId: BRANCH_ID,
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-04-01T00:00:00.000Z",
      price: 3_000_000,
      finalPrice: 2_700_000,
      discountAmount: 300_000,
      sessionsTotal: 24,
      status,
    });
    return res.data!;
  }

  it("creates a membership and derives sessionsRemaining", async () => {
    const m = await freshMembership();
    // The server computes this on every read; the client never sends it.
    expect(m.sessionsRemaining).toBe(24);
    expect(m.sessionsUsed).toBe(0);
    expect(m.status).toBe("active");
    expect((await mockService.getMembership(m.id)).data?.finalPrice).toBe(2_700_000);
  });

  it("keeps sessionsRemaining in step with a partial update", async () => {
    const m = await freshMembership();
    const updated = (await mockService.updateMembership(m.id, { sessionsUsed: 5 })).data!;
    expect(updated.sessionsRemaining).toBe(19);
    // Untouched fields survive.
    expect(updated.finalPrice).toBe(2_700_000);
  });

  it("freezes an active membership and unfreezes it again", async () => {
    const m = await freshMembership();

    const frozen = (await mockService.freezeMembership(m.id, {
      reason: "سفر", endDate: "2026-02-01T00:00:00.000Z",
    })).data!;
    expect(frozen.status).toBe("frozen");
    expect(frozen.freezeReason).toBe("سفر");

    const thawed = (await mockService.unfreezeMembership(m.id)).data!;
    expect(thawed.status).toBe("active");
    // The reason must not linger — the admin table renders it when present.
    expect(thawed.freezeReason).toBeUndefined();
    expect(thawed.freezeEndDate).toBeUndefined();
  });

  it("refuses to freeze anything that is not active", async () => {
    const m = await freshMembership();
    await mockService.freezeMembership(m.id, {});
    // The server answers 400 rather than treating a second freeze as a no-op.
    await expect(mockService.freezeMembership(m.id, {})).rejects.toThrow();
    expect((await mockService.getMembership(m.id)).data?.status).toBe("frozen");
  });

  it("refuses to unfreeze a membership that is not frozen", async () => {
    const m = await freshMembership();
    await expect(mockService.unfreezeMembership(m.id)).rejects.toThrow();
    expect((await mockService.getMembership(m.id)).data?.status).toBe("active");
  });

  it("rejects writes against a membership that does not exist", async () => {
    await expect(mockService.updateMembership("nope", { sessionsUsed: 1 })).rejects.toThrow(/not found/i);
    await expect(mockService.freezeMembership("nope", {})).rejects.toThrow(/not found/i);
    await expect(mockService.unfreezeMembership("nope")).rejects.toThrow(/not found/i);
  });
});

describe("updatePaymentStatus", () => {
  it("stamps paidAt on completion and clears it on reversal", async () => {
    const payment = (await mockService.createPayment({ userId: ATHLETE_ID, amount: 500_000 })).data!;

    const completed = (await mockService.updatePaymentStatus(payment.id, "completed")).data!;
    expect(completed.status).toBe("completed");
    expect(completed.paidAt).toBeTruthy();

    const refunded = (await mockService.updatePaymentStatus(payment.id, "refunded")).data!;
    expect(refunded.status).toBe("refunded");
    expect(refunded.paidAt).toBeUndefined();
  });

  it("accepts cancelled, which the PUT contract refuses", async () => {
    const payment = (await mockService.createPayment({ userId: ATHLETE_ID, amount: 1000 })).data!;
    const cancelled = (await mockService.updatePaymentStatus(payment.id, "cancelled")).data!;
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.paidAt).toBeUndefined();
  });

  it("rejects an unknown payment", async () => {
    await expect(mockService.updatePaymentStatus("nope", "completed")).rejects.toThrow(/not found/i);
  });
});

describe("checkOutAt", () => {
  async function freshCheckIn() {
    return (await mockService.checkIn({ userId: ATHLETE_ID, branchId: "b1" })).data!;
  }

  it("closes the session at the time given, not now", async () => {
    const ci = await freshCheckIn();
    const out = new Date(new Date(ci.checkInTime).getTime() + 75 * 60_000).toISOString();

    const saved = (await mockService.checkOutAt(ci.id, out)).data!;
    expect(saved.checkOutTime).toBe(out);
    expect(saved.durationMinutes).toBe(75);
  });

  it("refuses a session that is already closed", async () => {
    const ci = await freshCheckIn();
    await mockService.checkOut(ci.id);
    const out = new Date(Date.now() + 60_000).toISOString();
    await expect(mockService.checkOutAt(ci.id, out)).rejects.toThrow(/قبلاً بسته شده/);
  });

  it("refuses a checkout earlier than the check-in", async () => {
    const ci = await freshCheckIn();
    const before = new Date(new Date(ci.checkInTime).getTime() - 60_000).toISOString();
    await expect(mockService.checkOutAt(ci.id, before)).rejects.toThrow(/بعد از زمان ورود/);
  });

  it("rejects an unknown check-in", async () => {
    await expect(mockService.checkOutAt("nope", new Date().toISOString())).rejects.toThrow(/not found/i);
  });
});

describe("deleteNotification", () => {
  it("removes the row from the owner's list", async () => {
    const created = (await mockService.createNotification({
      userId: ATHLETE_ID, title: "تست", message: "متن",
    })).data!;

    // `wrapList` hands back the live store array rather than a copy, so this
    // has to be a number — holding the array would alias the post-delete one
    // and the comparison would be against itself.
    const countBefore = (await mockService.getNotifications(ATHLETE_ID)).data!.length;
    expect((await mockService.getNotifications(ATHLETE_ID)).data!.some((n) => n.id === created.id)).toBe(true);

    await mockService.deleteNotification(created.id);

    const after = (await mockService.getNotifications(ATHLETE_ID)).data!;
    expect(after.some((n) => n.id === created.id)).toBe(false);
    expect(after).toHaveLength(countBefore - 1);
  });

  it("rejects an unknown notification", async () => {
    await expect(mockService.deleteNotification("nope")).rejects.toThrow(/not found/i);
  });
});

describe("getRevenueSeries", () => {
  it("agrees with getRevenueTrend on the monthly numbers", async () => {
    // Two endpoints over one payments table must not disagree.
    const trend = (await mockService.getRevenueTrend(6)).data!;
    const series = (await mockService.getRevenueSeries({ period: "monthly", months: 6 })).data!;

    expect(series.labels).toEqual(trend.map((p) => p.month));
    expect(series.values).toEqual(trend.map((p) => p.revenue));
  });

  it("returns a dense 30-day window for the daily period", async () => {
    const daily = (await mockService.getRevenueSeries({ period: "daily" })).data!;

    expect(daily.labels).toHaveLength(30);
    expect(daily.values).toHaveLength(30);
    expect(daily.labels.every((l) => /^\d{4}-\d{2}-\d{2}$/.test(l))).toBe(true);
    expect(daily.values.every((v) => Number.isFinite(v) && v >= 0)).toBe(true);
    // Ascending by date, so a chart can plot it as-is.
    expect([...daily.labels].sort()).toEqual(daily.labels);
  });

  it("defaults to the monthly period", async () => {
    const def = (await mockService.getRevenueSeries()).data!;
    expect(def.labels).toHaveLength(6);
    expect(def.labels.every((l) => /^\d{4}-\d{2}$/.test(l))).toBe(true);
  });
});

describe("updateUserRole", () => {
  const original = mockUsers.find((u) => u.id === ATHLETE_ID)!.role;
  beforeEach(() => {
    mockUsers.find((u) => u.id === ATHLETE_ID)!.role = original;
  });

  it("lets an admin move a member to another role", async () => {
    const res = await mockService.updateUserRole(ADMIN_ID, ATHLETE_ID, "coach");
    expect(res.data?.role).toBe("coach");
  });

  it("refuses non-admin callers and self-demotion", async () => {
    await expect(mockService.updateUserRole(COACH_ID, ATHLETE_ID, "coach")).rejects.toThrow();
    await expect(mockService.updateUserRole(ADMIN_ID, ADMIN_ID, "athlete")).rejects.toThrow();
    await expect(mockService.updateUserRole(ADMIN_ID, ATHLETE_ID, "superuser" as never)).rejects.toThrow();
    expect(mockUsers.find((u) => u.id === ATHLETE_ID)?.role).toBe(original);
  });
});

describe("renewMembership", () => {
  it("starts a new term: extends, reactivates, resets counters", async () => {
    const created = await mockService.createMembership({
      userId: ATHLETE_ID, planId: "p1", branchId: "b1",
      startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z",
      price: 1_000_000, finalPrice: 1_000_000, sessionsTotal: 8,
    });
    await mockService.updateMembership(created.data!.id, { sessionsUsed: 5 });
    const renewed = (await mockService.renewMembership(created.data!.id, {
      endDate: "2026-03-01T00:00:00.000Z",
    })).data!;
    expect(renewed.endDate).toBe("2026-03-01T00:00:00.000Z");
    expect(renewed.status).toBe("active");
    expect(renewed.sessionsUsed).toBe(0);
    expect(renewed.sessionsRemaining).toBe(8);
  });

  it("rejects a new end date before the term start", async () => {
    const created = await mockService.createMembership({
      userId: ATHLETE_ID, planId: "p1", branchId: "b1",
      startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z",
      price: 1_000_000, finalPrice: 1_000_000, sessionsTotal: 8,
    });
    await expect(
      mockService.renewMembership(created.data!.id, { endDate: "2025-12-01T00:00:00.000Z" })
    ).rejects.toThrow();
  });
});

describe("voidCheckIn", () => {
  it("removes the record so lists no longer contain it", async () => {
    const created = (await mockService.checkIn({ userId: ATHLETE_ID, branchId: "b1" })).data!;
    await mockService.voidCheckIn(created.id);
    const list = (await mockService.getCheckIns(ATHLETE_ID)).data!;
    expect(list.find((c) => c.id === created.id)).toBeUndefined();
  });

  it("rejects an unknown id", async () => {
    await expect(mockService.voidCheckIn("nope")).rejects.toThrow(/یافت نشد/);
  });
});

describe("qrCheckIn", () => {
  it("opens a session for the scanned member id", async () => {
    // Close any open sessions first so the double-check-in guard cannot trip.
    for (const c of (await mockService.getCheckIns(ATHLETE_ID)).data!) {
      if (!c.checkOutTime) await mockService.checkOut(c.id);
    }
    const res = await mockService.qrCheckIn({ code: ATHLETE_ID, branchId: "b1" });
    expect(res.data?.userId).toBe(ATHLETE_ID);
    expect(res.data?.checkOutTime).toBeUndefined();
    await mockService.checkOut(res.data!.id);
  });

  it("refuses a second open session and an unknown code", async () => {
    for (const c of (await mockService.getCheckIns(ATHLETE_ID)).data!) {
      if (!c.checkOutTime) await mockService.checkOut(c.id);
    }
    const first = (await mockService.qrCheckIn({ code: ATHLETE_ID })).data!;
    await expect(mockService.qrCheckIn({ code: ATHLETE_ID })).rejects.toThrow();
    await expect(mockService.qrCheckIn({ code: "nope" })).rejects.toThrow(/not found/i);
    await mockService.checkOut(first.id);
  });
});

describe("getReadinessHistory", () => {
  it("returns newest-first daily rows honouring the day limit", async () => {
    const rows = (await mockService.getReadinessHistory({ userId: ATHLETE_ID, days: 7 })).data!;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(7);
    expect(rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.day))).toBe(true);
    const days = rows.map((r) => r.day);
    expect([...days].sort().reverse()).toEqual(days);
  });
});
