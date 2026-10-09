import type { Exercise, TrainingProgram, UserRole, UserStatus } from "@/lib/types";

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "outline";

export const programStatusConfig: Record<
  TrainingProgram["status"],
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "پیش‌نویس", variant: "secondary" },
  active: { label: "فعال", variant: "success" },
  completed: { label: "تکمیل شده", variant: "info" },
  archived: { label: "بایگانی", variant: "outline" },
};

export const PROGRAM_STATUSES: { value: TrainingProgram["status"]; label: string }[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "active", label: "فعال" },
  { value: "completed", label: "تکمیل شده" },
  { value: "archived", label: "بایگانی" },
];

export const userStatusConfig: Record<UserStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "فعال", variant: "success" },
  inactive: { label: "غیرفعال", variant: "secondary" },
  suspended: { label: "تعلیق شده", variant: "destructive" },
  pending: { label: "در انتظار تأیید", variant: "warning" },
};

export const userRoleLabels: Record<UserRole, string> = {
  admin: "مدیر",
  coach: "مربی",
  athlete: "ورزشکار",
  receptionist: "پذیرش",
};

/**
 * `Exercise.difficulty` is the one exercise field that is an English enum —
 * `category`, `muscleGroup` and `equipment` are free-text Persian, so they are
 * derived from the loaded rows rather than hard-coded here.
 */
export const difficultyLabels: Record<Exercise["difficulty"], string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export const difficultyVariants: Record<Exercise["difficulty"], BadgeVariant> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "destructive",
};

export const DIFFICULTIES: { value: Exercise["difficulty"]; label: string }[] = [
  { value: "beginner", label: "مبتدی" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "پیشرفته" },
];

export const WEEK_DAYS: { value: number; label: string; short: string }[] = [
  { value: 0, label: "شنبه", short: "ش" },
  { value: 1, label: "یکشنبه", short: "ی" },
  { value: 2, label: "دوشنبه", short: "د" },
  { value: 3, label: "سه‌شنبه", short: "س" },
  { value: 4, label: "چهارشنبه", short: "چ" },
  { value: 5, label: "پنج‌شنبه", short: "پ" },
  { value: 6, label: "جمعه", short: "ج" },
];

export function dayLabel(dayOfWeek: number) {
  return WEEK_DAYS[dayOfWeek]?.label ?? `روز ${dayOfWeek + 1}`;
}

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "؟"
  );
}

/** Progress-bar fills. Semantic `-solid`/activity tokens only, never palette classes. */
export function progressTone(progress: number) {
  if (progress >= 75) return "bg-activity-exercise";
  if (progress >= 40) return "bg-primary-solid";
  return "bg-warning-solid";
}

/** Sorted, de-duplicated facet values for a free-text exercise field. */
export function facetValues(exercises: Exercise[], field: "category" | "muscleGroup" | "equipment") {
  const seen = new Set<string>();
  for (const exercise of exercises) {
    const value = exercise[field];
    if (value) seen.add(value);
  }
  return [...seen].sort((left, right) => left.localeCompare(right, "fa"));
}
