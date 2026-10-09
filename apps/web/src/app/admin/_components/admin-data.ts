import type { BadgeProps } from "@/components/ui/Badge";
import type { Payment, UserRole, UserStatus } from "@/lib/types";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;
type LabelledVariant = { label: string; variant: BadgeVariant };

export const USER_STATUS: Record<UserStatus, LabelledVariant> = {
  active: { label: "فعال", variant: "success" },
  inactive: { label: "غیرفعال", variant: "secondary" },
  suspended: { label: "تعلیق‌شده", variant: "destructive" },
  pending: { label: "در انتظار تأیید", variant: "warning" },
};

export const USER_ROLE: Record<UserRole, string> = {
  admin: "مدیر",
  receptionist: "پذیرش",
  coach: "مربی",
  athlete: "عضو",
};

export const PAYMENT_STATUS: Record<Payment["status"], LabelledVariant> = {
  completed: { label: "موفق", variant: "success" },
  pending: { label: "در انتظار", variant: "warning" },
  failed: { label: "ناموفق", variant: "destructive" },
  refunded: { label: "بازگشت‌خورده", variant: "info" },
  cancelled: { label: "لغوشده", variant: "secondary" },
};

export const PAYMENT_METHOD: Record<Payment["method"], string> = {
  card: "کارت بانکی",
  cash: "نقدی",
  wallet: "کیف پول",
  bank_transfer: "انتقال بانکی",
};

export type SortDir = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

/** Flips direction when the same column is clicked again, otherwise selects it. */
export function nextSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
  if (current.key !== key) return { key, dir: "asc" };
  return { key, dir: current.dir === "asc" ? "desc" : "asc" };
}

/**
 * Sorts a copy of `rows`. Strings go through `localeCompare` with the `fa`
 * collator so Persian names order the way a Persian reader expects rather than
 * by code point.
 */
export function sortRows<T>(rows: T[], read: (row: T) => string | number, dir: SortDir): T[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = read(a);
    const right = read(b);
    if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
    return String(left).localeCompare(String(right), "fa") * factor;
  });
}

export const MEMBERSHIP_STATUS: Record<string, LabelledVariant> = {
  active: { label: "فعال", variant: "success" },
  expired: { label: "منقضی", variant: "secondary" },
  frozen: { label: "متوقف", variant: "info" },
  cancelled: { label: "لغوشده", variant: "destructive" },
};

export function fullName(person?: { firstName: string; lastName: string } | null) {
  return person ? `${person.firstName} ${person.lastName}`.trim() : "";
}
