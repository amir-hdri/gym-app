import { z } from "zod";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_PATTERN_MESSAGE,
} from "@/components/auth/auth-helpers";
import { formatDate, validateIranianPhone } from "@/lib/utils";
import type { Notification, Payment, UserStatus } from "@/lib/types";
import { USER_STATUS } from "./admin-data";

/* -------------------------------------------------------------------------- */
/* Shared field schemas                                                        */
/* -------------------------------------------------------------------------- */

const nameField = (message: string) =>
  z.string().trim().min(1, message).max(60, "بیش از حد طولانی است");

export const USER_STATUS_VALUES = ["active", "inactive", "suspended", "pending"] as const;

/** The four values `PATCH /users/{id}/status` accepts, with their Persian labels. */
export const STATUS_OPTIONS = USER_STATUS_VALUES.map((value) => ({
  value,
  label: USER_STATUS[value].label,
}));

/**
 * The identity fields an admin may edit on any account.
 *
 * `useUpdateProfile` accepts only `firstName`/`lastName`/`phone`, so the email
 * is validated here but only ever sent through `useUpdateUser`.
 */
export const identitySchema = z.object({
  firstName: nameField("نام را وارد کنید"),
  lastName: nameField("نام خانوادگی را وارد کنید"),
  email: z.string().trim().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
  phone: z
    .string()
    .trim()
    .min(1, "شماره موبایل را وارد کنید")
    .refine(validateIranianPhone, "شماره موبایل معتبر نیست (مثلاً ۰۹۱۲۱۱۱۲۲۳۳)"),
  status: z.enum(USER_STATUS_VALUES),
  branchId: z.string().optional(),
});

export type IdentityFormData = z.infer<typeof identitySchema>;

const newPasswordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `رمز عبور باید حداقل ${PASSWORD_MIN_LENGTH} کاراکتر باشد`)
  .regex(PASSWORD_PATTERN, PASSWORD_PATTERN_MESSAGE);

/**
 * Creating an account: identity plus the first password.
 *
 * `status` is omitted on purpose — `POST /users` starts every account `active`
 * and ignores a status in the body, so offering the field would be a control
 * that does nothing. The edit sheet changes it afterwards.
 */
export const newUserSchema = identitySchema
  .omit({ status: true })
  .extend({ password: newPasswordField });

export type NewUserFormData = z.infer<typeof newUserSchema>;

/** An admin resetting someone else's password — no current password needed. */
export const resetPasswordSchema = z
  .object({ newPassword: newPasswordField, confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید") })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/* -------------------------------------------------------------------------- */
/* Option lists                                                                */
/* -------------------------------------------------------------------------- */

export const PAYMENT_METHOD_OPTIONS: { value: Payment["method"]; label: string }[] = [
  { value: "card", label: "کارت بانکی" },
  { value: "cash", label: "نقدی" },
  { value: "wallet", label: "کیف پول" },
  { value: "bank_transfer", label: "انتقال بانکی" },
];

/** The statuses `PUT /payments/{id}` accepts — `cancelled` is rejected there. */
export const PAYMENT_EDITABLE_STATUSES = ["pending", "completed", "failed", "refunded"] as const;

export const NOTIFICATION_TYPE_OPTIONS: { value: Notification["type"]; label: string }[] = [
  { value: "info", label: "اطلاعیه" },
  { value: "success", label: "موفقیت" },
  { value: "warning", label: "هشدار" },
  { value: "error", label: "خطا" },
  { value: "reminder", label: "یادآوری" },
];

export const NOTIFICATION_TYPE_LABEL: Record<Notification["type"], string> =
  NOTIFICATION_TYPE_OPTIONS.reduce(
    (labels, option) => ({ ...labels, [option.value]: option.label }),
    {} as Record<Notification["type"], string>
  );

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `YYYY-MM-DD` for `<input type="date">`, taken off the front of the stored
 * value rather than through `Date` — a UTC-midnight timestamp read in a
 * negative-offset timezone would otherwise land on the previous day.
 */
export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const head = value.slice(0, 10);
  return DATE_INPUT_PATTERN.test(head) ? head : "";
}

/** Parses a date-input value as a *local* calendar date, so no offset shifts it. */
export function parseDateInput(value: string): Date | null {
  if (!DATE_INPUT_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The Jalali reading of a date-input value, for the hint under the field. */
export function jalaliHint(value: string): string | undefined {
  const date = parseDateInput(value);
  return date ? formatDate(date) : undefined;
}

function formatDateInput(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDaysToDateInput(value: string, days: number): string {
  const date = parseDateInput(value);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

export function todayDateInput(): string {
  return formatDateInput(new Date());
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */

/** `true` when a status transition is worth offering — i.e. not the current one. */
export function otherStatuses(current: UserStatus) {
  return STATUS_OPTIONS.filter((option) => option.value !== current);
}
