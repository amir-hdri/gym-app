import { newDate } from "date-fns-jalali";
import { describe, expect, it } from "vitest";
import { getJalaliMonth, groupCheckinsByJalaliDay, moveJalaliMonth } from "./calendar-utils";

describe("Jalali calendar utilities", () => {
  it("uses Jalali month names, Persian digits, and correct month lengths", () => {
    const esfand = getJalaliMonth(newDate(1403, 11, 15));
    const farvardin = getJalaliMonth(newDate(1404, 0, 15));

    expect(esfand.title).toBe("اسفند ۱۴۰۳");
    expect(esfand.daysInMonth).toBe(30);
    expect(farvardin.title).toBe("فروردین ۱۴۰۴");
    expect(farvardin.daysInMonth).toBe(31);
  });

  it("moves across the Jalali year boundary", () => {
    const nextMonth = moveJalaliMonth(newDate(1403, 11, 15), 1);

    expect(getJalaliMonth(nextMonth).title).toBe("فروردین ۱۴۰۴");
  });

  it("groups check-ins by their Jalali day and excludes adjacent months", () => {
    const displayedMonth = newDate(1404, 0, 1);
    const checkins = [
      newDate(1404, 0, 2, 8).toISOString(),
      newDate(1404, 0, 2, 18).toISOString(),
      newDate(1403, 11, 29, 8).toISOString(),
    ];

    expect(groupCheckinsByJalaliDay(checkins, displayedMonth)).toEqual({ 2: 2 });
  });
});
