import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPersianNumber(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

export function formatCurrency(amount: number, currency = "تومان"): string {
  return new Intl.NumberFormat("fa-IR").format(amount) + " " + currency;
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
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

export function generateAvatarColor(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
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
  const cleaned = phone.replace(/\D/g, "");
  return /^(?:\+98|0)?9\d{9}$/.test(cleaned);
}

export function validateIranianNationalCode(code: string): boolean {
  const cleaned = code.replace(/\D/g, "");
  if (!/^\d{10}$/.test(cleaned)) return false;
  
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
