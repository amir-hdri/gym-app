import type { Membership, Payment } from "@/lib/types";

export const paymentStatusConfig: Record<
  Payment["status"],
  { label: string; variant: "secondary" | "success" | "warning" | "info" | "destructive" | "outline" }
> = {
  pending: { label: "در انتظار", variant: "warning" },
  completed: { label: "موفق", variant: "success" },
  failed: { label: "ناموفق", variant: "destructive" },
  refunded: { label: "بازگشت داده شده", variant: "info" },
  cancelled: { label: "لغو شده", variant: "outline" },
};

export const paymentMethodLabels: Record<Payment["method"], string> = {
  card: "کارت بانکی",
  cash: "نقدی",
  wallet: "کیف پول",
  bank_transfer: "انتقال بانکی",
};

export const membershipStatusConfig: Record<
  Membership["status"],
  { label: string; variant: "secondary" | "success" | "warning" | "info" | "outline" }
> = {
  active: { label: "فعال", variant: "success" },
  expired: { label: "منقضی شده", variant: "outline" },
  frozen: { label: "متوقف شده", variant: "info" },
  cancelled: { label: "لغو شده", variant: "secondary" },
};
