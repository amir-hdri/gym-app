import type { Goal } from "@/lib/types";

export const GOAL_CATEGORIES: { value: Goal["category"]; label: string }[] = [
  { value: "weight_loss", label: "کاهش وزن" },
  { value: "muscle_gain", label: "افزایش عضله" },
  { value: "strength", label: "قدرت" },
  { value: "endurance", label: "استقامت" },
  { value: "flexibility", label: "انعطاف" },
  { value: "custom", label: "سفارشی" },
];

export const goalCategoryLabels: Record<Goal["category"], string> = {
  weight_loss: "کاهش وزن",
  muscle_gain: "افزایش عضله",
  strength: "قدرت",
  endurance: "استقامت",
  flexibility: "انعطاف",
  custom: "سفارشی",
};

/** Progress-bar fills. Semantic `-solid` tokens only, never raw palette classes. */
export const goalCategoryIndicator: Record<Goal["category"], string> = {
  weight_loss: "bg-warning-solid",
  muscle_gain: "bg-activity-move",
  strength: "bg-primary-solid",
  endurance: "bg-info-solid",
  flexibility: "bg-activity-exercise",
  custom: "bg-activity-stand",
};

export const goalStatusConfig: Record<
  Goal["status"],
  { label: string; variant: "secondary" | "success" | "warning" | "info" | "outline" }
> = {
  not_started: { label: "شروع نشده", variant: "secondary" },
  in_progress: { label: "در حال انجام", variant: "warning" },
  achieved: { label: "تکمیل شده", variant: "success" },
  missed: { label: "از دست رفته", variant: "outline" },
  paused: { label: "متوقف شده", variant: "info" },
};
