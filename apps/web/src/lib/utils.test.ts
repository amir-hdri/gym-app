import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDateTime, parseApiDate } from "./utils";
import {
  calculateDaysRemaining,
  calculateProgress,
  cn,
  formatCurrency,
  formatPersianNumber,
  formatRelativeTime,
  generateAvatarColor,
  getDayName,
  getDayShortName,
  getInitials,
  parseJalaliDate,
  retry,
  truncate,
  validateIranianNationalCode,
  validateIranianPhone,
} from "./utils";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("cn", () => {
  it("merges conflicting tailwind classes, last one winning", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("flex", false && "hidden", undefined, "gap-2")).toBe("flex gap-2");
  });
});

describe("formatPersianNumber", () => {
  it("converts latin digits", () => {
    expect(formatPersianNumber(1234567890)).toBe("۱۲۳۴۵۶۷۸۹۰");
  });

  it("leaves non-digits untouched", () => {
    expect(formatPersianNumber("2026-10-02")).toBe("۲۰۲۶-۱۰-۰۲");
    expect(formatPersianNumber(-5)).toBe("-۵");
  });

  it("handles zero", () => {
    expect(formatPersianNumber(0)).toBe("۰");
  });
});

describe("formatCurrency", () => {
  it("appends the default unit", () => {
    expect(formatCurrency(250000).endsWith(" ریال")).toBe(true);
  });

  it("accepts a custom unit", () => {
    expect(formatCurrency(1000, "ریال").endsWith(" ریال")).toBe(true);
  });

  it("groups thousands", () => {
    // Separator and digit shape are locale/ICU dependent — assert the grouping
    // happened rather than the exact glyphs.
    expect(formatCurrency(1000000).length).toBeGreaterThan("1000000".length);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-10-02T12:00:00Z");

  function at(msAgo: number) {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    return new Date(now.getTime() - msAgo);
  }

  it("reports sub-minute gaps as 'just now'", () => {
    expect(formatRelativeTime(at(30_000))).toBe("همین الان");
  });

  it("reports minutes", () => {
    expect(formatRelativeTime(at(5 * 60_000))).toBe("۵ دقیقه پیش");
  });

  it("reports hours", () => {
    expect(formatRelativeTime(at(3 * 3_600_000))).toBe("۳ ساعت پیش");
  });

  it("reports days up to a week", () => {
    expect(formatRelativeTime(at(2 * 86_400_000))).toBe("۲ روز پیش");
  });

  it("falls back to an absolute date beyond a week", () => {
    expect(formatRelativeTime(at(30 * 86_400_000))).not.toContain("پیش");
  });

  it("accepts an ISO string", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime("2026-10-02T11:00:00Z")).toBe("۱ ساعت پیش");
  });
});

describe("getInitials", () => {
  it("takes the first letter of the first two words", () => {
    expect(getInitials("مریم احمدی")).toBe("ما");
  });

  it("handles a single word", () => {
    expect(getInitials("سارا")).toBe("س");
  });

  it("uppercases latin names", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("tolerates repeated spaces", () => {
    expect(getInitials("علی  رضا")).toBe("عر");
  });
});

describe("generateAvatarColor", () => {
  it("is deterministic for the same name", () => {
    expect(generateAvatarColor("مریم احمدی")).toBe(generateAvatarColor("مریم احمدی"));
  });

  it("returns a token-based background and ink pair, never a palette class", () => {
    // The design system bans raw palette classes (`bg-rose-500`), and the pair
    // has to carry its own ink: the dark theme's light accents take dark text,
    // so a caller adding `text-white` would be unreadable there.
    for (const name of ["الف", "ب", "ج", "د", "هـ", "و", "مریم احمدی"]) {
      const result = generateAvatarColor(name);
      expect(result).toMatch(/^bg-\S+ text-\S+$/);
      expect(result).not.toMatch(/-(?:50|[1-9]00)\b/);
    }
  });

  it("returns a class for the empty string rather than undefined", () => {
    expect(generateAvatarColor("")).toMatch(/^bg-/);
  });

  it("spreads names across the available tints", () => {
    const seen = new Set(
      ["آ", "ب", "پ", "ت", "ث", "ج", "چ", "ح", "خ", "د", "ذ", "ر"].map(generateAvatarColor),
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("truncate", () => {
  it("leaves short strings alone", () => {
    expect(truncate("کوتاه", 10)).toBe("کوتاه");
  });

  it("appends an ellipsis when cutting", () => {
    expect(truncate("abcdefghij", 4)).toBe("abcd...");
  });
});

describe("calculateProgress", () => {
  it("returns a percentage", () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  it("clamps above 100 and below 0", () => {
    expect(calculateProgress(15, 10)).toBe(100);
    expect(calculateProgress(-5, 10)).toBe(0);
  });

  it("returns 0 for a zero target instead of dividing by zero", () => {
    expect(calculateProgress(5, 0)).toBe(0);
  });

  it("returns 0 rather than NaN for missing data", () => {
    // Feeds <Progress value={...} /> directly; a NaN renders a broken bar.
    expect(calculateProgress(Number.NaN, 10)).toBe(0);
    expect(calculateProgress(5, Number.NaN)).toBe(0);
    expect(calculateProgress(undefined as unknown as number, 10)).toBe(0);
  });
});

describe("calculateDaysRemaining", () => {
  it("counts whole days ahead", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    expect(calculateDaysRemaining("2026-10-05T12:00:00Z")).toBe(3);
  });

  it("goes negative once the date has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    expect(calculateDaysRemaining("2026-09-30T12:00:00Z")).toBe(-2);
  });
});

describe("day names", () => {
  it("maps Date.getDay() indices (0 = Sunday)", () => {
    expect(getDayName(0)).toBe("یکشنبه");
    expect(getDayName(6)).toBe("شنبه");
    expect(getDayShortName(0)).toBe("ی");
    expect(getDayShortName(6)).toBe("ش");
  });

  it("returns an empty string out of range", () => {
    expect(getDayName(7)).toBe("");
    expect(getDayName(-1)).toBe("");
    expect(getDayShortName(99)).toBe("");
  });
});

describe("parseJalaliDate", () => {
  it("parses a zero-padded jalali date", () => {
    expect(parseJalaliDate("1405/07/10")).toEqual({ year: 1405, month: 7, day: 10 });
  });

  it("rejects unpadded and malformed input", () => {
    expect(parseJalaliDate("1405/7/10")).toBeNull();
    expect(parseJalaliDate("not a date")).toBeNull();
    expect(parseJalaliDate("")).toBeNull();
  });
});

describe("validateIranianPhone", () => {
  it("accepts the common local forms", () => {
    expect(validateIranianPhone("09123456789")).toBe(true);
    expect(validateIranianPhone("9123456789")).toBe(true);
  });

  it("accepts international forms", () => {
    // Regression: the "+" is stripped before matching, so the country code has
    // to be matched as bare digits. These used to be rejected on the register form.
    expect(validateIranianPhone("+989123456789")).toBe(true);
    expect(validateIranianPhone("00989123456789")).toBe(true);
  });

  it("ignores spaces and dashes", () => {
    expect(validateIranianPhone("0912 345 6789")).toBe(true);
    expect(validateIranianPhone("0912-345-6789")).toBe(true);
  });

  it("rejects non-mobile and malformed numbers", () => {
    expect(validateIranianPhone("08123456789")).toBe(false);
    expect(validateIranianPhone("02112345678")).toBe(false);
    expect(validateIranianPhone("091234567")).toBe(false);
    expect(validateIranianPhone("091234567890")).toBe(false);
    expect(validateIranianPhone("")).toBe(false);
  });
});

describe("validateIranianNationalCode", () => {
  it("accepts codes with a correct check digit", () => {
    expect(validateIranianNationalCode("1234567891")).toBe(true);
    expect(validateIranianNationalCode("0499370899")).toBe(true);
  });

  it("ignores separators", () => {
    expect(validateIranianNationalCode("049-937-0899")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(validateIranianNationalCode("1234567890")).toBe(false);
  });

  it("rejects repeated-digit codes that satisfy the checksum", () => {
    // 1111111111 passes the arithmetic but is not an issued code.
    expect(validateIranianNationalCode("1111111111")).toBe(false);
    expect(validateIranianNationalCode("0000000000")).toBe(false);
  });

  it("rejects wrong lengths", () => {
    expect(validateIranianNationalCode("12345")).toBe(false);
    expect(validateIranianNationalCode("12345678901")).toBe(false);
    expect(validateIranianNationalCode("")).toBe(false);
  });
});

describe("retry", () => {
  it("does not retry a call that succeeds", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(retry(fn, 3, 10)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries with doubling backoff until it succeeds", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue("ok");

    const result = retry(fn, 3, 100);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    await expect(result).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("rethrows the last error once retries are exhausted", async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error("always"));

    const result = retry(fn, 1, 50);
    const assertion = expect(result).rejects.toThrow("always");
    await vi.advanceTimersByTimeAsync(50);
    await assertion;

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("parseApiDate", () => {
  it("treats offset-less ISO datetimes as UTC, not local time", () => {
    // "2026-10-02T00:30:00" must be the UTC instant, regardless of TZ.
    expect(parseApiDate("2026-10-02T00:30:00").getTime()).toBe(Date.UTC(2026, 9, 2, 0, 30, 0));
  });

  it("keeps explicit offsets intact", () => {
    expect(parseApiDate("2026-10-02T00:30:00+03:30").getTime()).toBe(Date.UTC(2026, 9, 1, 21, 0, 0));
  });

  it("keeps the Z designator intact", () => {
    expect(parseApiDate("2026-10-02T00:30:00Z").getTime()).toBe(Date.UTC(2026, 9, 2, 0, 30, 0));
  });

  it("treats space-separated naive datetimes as UTC", () => {
    expect(parseApiDate("2026-10-02 00:30:00").getTime()).toBe(Date.UTC(2026, 9, 2, 0, 30, 0));
  });

  it("passes Date instances through unchanged", () => {
    const d = new Date(Date.UTC(2026, 9, 2));
    expect(parseApiDate(d)).toBe(d);
  });

  it("formatDateTime renders a naive string as the UTC instant", () => {
    // TZ-independent: both sides go through the same formatter.
    expect(formatDateTime("2026-10-02T00:30:00")).toBe(
      formatDateTime(new Date(Date.UTC(2026, 9, 2, 0, 30, 0)))
    );
  });
});
