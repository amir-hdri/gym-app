/**
 * Goal vocabulary for the coach portal.
 *
 * `Goal.status` and `Goal.category` are English enums on the wire; these are the
 * Persian labels and the badge tone each one maps to. Kept beside the coach
 * pages rather than in `lib/` because they are presentation, not data.
 */
import type { Goal } from "@/lib/types";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "info" | "destructive" | "outline";

export const goalStatusConfig: Record<Goal["status"], { label: string; variant: BadgeVariant }> = {
  not_started: { label: "شروع نشده", variant: "secondary" },
  in_progress: { label: "در جریان", variant: "info" },
  achieved: { label: "رسیده", variant: "success" },
  missed: { label: "از دست رفته", variant: "destructive" },
  paused: { label: "متوقف", variant: "warning" },
};

export const GOAL_STATUSES: { value: Goal["status"]; label: string }[] = [
  { value: "not_started", label: "شروع نشده" },
  { value: "in_progress", label: "در جریان" },
  { value: "achieved", label: "رسیده" },
  { value: "paused", label: "متوقف" },
  { value: "missed", label: "از دست رفته" },
];

export const goalCategoryLabels: Record<Goal["category"], string> = {
  weight_loss: "کاهش وزن",
  muscle_gain: "افزایش حجم",
  strength: "قدرت",
  endurance: "استقامت",
  flexibility: "انعطاف",
  custom: "سفارشی",
};
