import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPersianNumber(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

export function formatCurrency(amount: number, currency = "ریال"): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " " + currency;
}

/**
 * Parses an API datetime. Offset-less ISO strings are UTC instants (the
 * backend stores naive UTC) — `new Date("…T…")` would read them as local
 * time and shift every timestamp by the device timezone.
 */
export function parseApiDate(date: string | Date): Date {
  if (typeof date !== "string") return date;
  const naive = date.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/);
  if (naive) return new Date(`${naive[1]}T${naive[2]}Z`);
  return new Date(date);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? parseApiDate(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseApiDate(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "همین الان";
  if (diffMins < 60) return `${formatPersianNumber(diffMins)} دقیقه پیش`;
  if (diffHours < 24) return `${formatPersianNumber(diffHours)} ساعت پیش`;
  if (diffDays < 7) return `${formatPersianNumber(diffDays)} روز پیش`;
  return formatDate(d);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * A stable background+ink pair for an avatar fallback, derived from the name.
 *
 * Returns both halves of the pair, so a caller never has to add its own text
 * colour — the old version returned only a background and left callers writing
 * `text-white`, which is unreadable in the dark theme now that the palette's
 * light accents carry dark ink.
 *
 * The pairs are deliberately drawn from the design tokens rather than Tailwind's
 * palette (`bg-rose-500` and friends, which this used to return). Two reasons:
 * the design system forbids raw palette classes outright, and a ring of
 * saturated rainbow circles fights the calm the rest of the product is built
 * around. Four quiet on-palette tints keep people distinguishable without
 * shouting — and each one is an accent over its own tint, so both themes work
 * without further checking.
 */
const AVATAR_TINTS = [
  "bg-primary/15 text-primary",
  "bg-blush/15 text-blush",
  "bg-activity-stand/15 text-activity-stand",
  "bg-muted text-muted-foreground",
] as const;

export function generateAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function calculateProgress(current: number, target: number): number {
  // Callers feed this straight into <Progress value={...} />, where a NaN
  // silently renders a broken bar. Clamp missing/partial data to 0 instead.
  if (!Number.isFinite(current) || !Number.isFinite(target) || target === 0) return 0;
  const progress = (current / target) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export function calculateDaysRemaining(targetDate: string | Date): number {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / 86400000);
}

export function getDayName(dayIndex: number): string {
  const days = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
  return days[dayIndex] || "";
}

export function getDayShortName(dayIndex: number): string {
  const days = ["ی", "د", "س", "چ", "پ", "ج", "ش"];
  return days[dayIndex] || "";
}

export function parseJalaliDate(dateStr: string): { year: number; month: number; day: number } | null {
  // Simple jalali date parsing - in production use date-fns-jalali
  const match = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
  };
}

export function toJalaliDate(date: Date): string {
  // In production use date-fns-jalali
  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
}

export function validateIranianPhone(phone: string): boolean {
  // Digits only, so the leading "+" of "+98..." is gone by the time we match —
  // the country code has to be matched as bare digits.
  const cleaned = phone.replace(/\D/g, "");
  return /^(?:0098|98|0)?9\d{9}$/.test(cleaned);
}

export function validateIranianNationalCode(code: string): boolean {
  const cleaned = code.replace(/\D/g, "");
  if (!/^\d{10}$/.test(cleaned)) return false;

  // Repeated-digit codes (0000000000, 1111111111, …) satisfy the checksum but
  // are not issued.
  if (/^(\d)\1{9}$/.test(cleaned)) return false;

  const check = parseInt(cleaned[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i], 10) * (10 - i);
  }
  const remainder = sum % 11;
  return (remainder < 2 && remainder === check) || (remainder >= 2 && check === 11 - remainder);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  return fn().catch((err) => {
    if (retries <= 0) throw err;
    return sleep(delay).then(() => retry(fn, retries - 1, delay * 2));
  });
}
