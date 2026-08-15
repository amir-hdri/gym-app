"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatPersianNumber, cn } from "@/lib/utils";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { useMembershipPlans } from "@/hooks/use-api";
import type { MembershipPlan } from "@/lib/types";

const durationLabel = (days: number) => {
  if (days >= 365) return "یک سال";
  if (days >= 180) return "شش ماه";
  if (days >= 90) return "سه ماه";
  if (days >= 30) return "یک ماه";
  return `${days} روز`;
};

const borderColors = ["border-blue-200 dark:border-blue-800", "border-gray-300 dark:border-gray-600", "border-yellow-300 dark:border-yellow-700", "border-purple-300 dark:border-purple-700", "border-green-200 dark:border-green-800", "border-red-200 dark:border-red-800"];

export default function PlansPage() {
  const { data, isLoading, isError } = useMembershipPlans();
  const [planList, setPlanList] = useState<MembershipPlan[] | null>(null);
  const plans = planList ?? data?.data ?? [];

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;

  const toggleStatus = (id: string) => {
    setPlanList((prev) =>
      (prev ?? data?.data ?? []).map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">پلن‌های اشتراک</h1>
          <p className="text-muted-foreground">مدیریت طرح‌های اشتراک باشگاه</p>
        </div>
        <Button asChild>
          <Link href="/admin/plans">
            <Plus className="ml-2 h-4 w-4" />
            افزودن پلن جدید
          </Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState title="هیچ پلنی یافت نشد" description="هنوز هیچ پلن اشتراکی تعریف نشده است" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, idx) => (
            <Card key={plan.id} glass className={cn("border-t-4", borderColors[idx % borderColors.length], !plan.isActive && "opacity-60")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant={plan.isActive ? "success" : "secondary"} className="bg-muted/50">
                    {plan.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="inline-block rounded-lg bg-muted/50 px-4 py-2">
                  <p className="text-3xl font-bold">{formatCurrency(plan.price)}</p>
                  <p className="text-sm text-muted-foreground">{durationLabel(plan.durationDays)}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{formatPersianNumber(plan.sessionsCount)}</span> جلسه
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="bg-muted/50 px-2 py-0.5 rounded">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.isActive ? "outline" : "default"}
                  className={cn("w-full", plan.isActive ? "bg-muted/50 border-white/30" : "")}
                  onClick={() => toggleStatus(plan.id)}
                >
                  {plan.isActive ? "غیرفعال کردن" : "فعال کردن"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
