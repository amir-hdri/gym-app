/**
 * Date helpers for the coach portal.
 *
 * Display goes through `formatDate` in `lib/utils`, whose `fa-IR` formatter
 * already renders Jalali dates in Persian numerals — there is no Jalali helper
 * in `lib/` to reach for and no reason to pull a second date library into these
 * routes. What is *not* in `lib/` is the conversion an `<input type="date">`
 * needs: it only speaks Gregorian `YYYY-MM-DD`, so that lives here.
 *
 * Everything below works in the viewer's local calendar day, matching
 * `formatDate`, so a date round-trips through an input and back without
 * drifting by a day.
 */
import { formatDate } from "@/lib/utils";

const DAY_MS = 86_400_000;

function parse(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

function toInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `YYYY-MM-DD` for an `<input type="date">`, from a stored ISO timestamp. */
export function toDateInputValue(value: string | Date | null | undefined): string {
  const date = parse(value);
  return date ? toInput(date) : "";
}

/**
 * ISO-8601 instant for an `<input type="date">` value — local midnight of the
 * day the coach picked, so `toDateInputValue` reads the same day back out.
 */
export function fromDateInputValue(value: string): string {
  const date = parse(`${value}T00:00:00`);
  return date ? date.toISOString() : value;
}

/** Long Jalali date — «۱۲ مهر ۱۴۰۴». */
export function jalaliLong(value: string | Date | null | undefined): string {
  const date = parse(value);
  return date ? formatDate(date) : "ثبت نشده";
}

/** Compact Jalali date for dense table cells — «۱۴۰۴/۰۷/۱۲». */
export function jalaliShort(value: string | Date | null | undefined): string {
  const date = parse(value);
  if (!date) return "—";
  return formatDate(date, { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** Whole days from `start` to `end`, inclusive. `null` when either is unusable. */
export function spanInDays(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): number | null {
  const from = parse(start);
  const to = parse(end);
  if (!from || !to) return null;
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
  return days > 0 ? days : null;
}

/** `true` while today falls inside the (inclusive) range. */
export function isRunning(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): boolean {
  const from = parse(start);
  const to = parse(end);
  if (!from || !to) return false;
  const now = Date.now();
  return now >= from.getTime() && now <= to.getTime() + DAY_MS;
}

/** Today as `YYYY-MM-DD`, for seeding a date input. */
export function todayDateInput(): string {
  return toInput(new Date());
}

/** A `YYYY-MM-DD` input value shifted by whole days. */
export function shiftDateInput(value: string, days: number): string {
  const date = parse(`${value}T00:00:00`);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return toInput(date);
}
