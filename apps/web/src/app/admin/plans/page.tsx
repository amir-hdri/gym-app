"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatPersianNumber, cn } from "@/lib/utils";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { EmptyState, CtaButton, TwilightCard } from "@/components/twilight/controls";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { useMembershipPlans } from "@/hooks/use-api";
import type { MembershipPlan } from "@/lib/types";

const durationLabel = (days: number) => {
  if (days >= 365) return "یک سال";
  if (days >= 180) return "شش ماه";
  if (days >= 90) return "سه ماه";
  if (days >= 30) return "یک ماه";
  return `${days} روز`;
};

export default function PlansPage() {
  const { data, isLoading, isError, refetch } = useMembershipPlans();
  const [planList, setPlanList] = useState<MembershipPlan[] | null>(null);
  const plans = planList ?? data?.data ?? [];

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay onRetry={refetch} />;

  const toggleStatus = (id: string) => {
    setPlanList((prev) =>
      (prev ?? data?.data ?? []).map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <PageShell>
      <PageHeader
        title="پلن‌های اشتراک"
        subtitle="مدیریت طرح‌های اشتراک باشگاه"
        action={
          <Link
            href="/admin/plans"
            className="flex items-center gap-2 rounded-xl bg-[#d2c0a5] px-4 py-3 text-xs font-bold text-[#121417] transition-colors hover:bg-[#ded1bc]"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            افزودن پلن جدید
          </Link>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-5 w-5" strokeWidth={1.75} />}
          title="هیچ پلنی یافت نشد"
          description="هنوز هیچ پلن اشتراکی تعریف نشده است"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <TwilightCard key={plan.id} className={cn(!plan.isActive && "opacity-60")}>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-normal text-white">{plan.name}</h3>
                <Badge variant={plan.isActive ? "success" : "secondary"}>
                  {plan.isActive ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="font-sans text-3xl font-normal tabular-nums text-white">{formatCurrency(plan.price)}</p>
                <p className="mt-1 text-xs text-[#8e98a8]">{durationLabel(plan.durationDays)}</p>
              </div>
              <p className="mt-3 text-sm text-[#8e98a8]">
                <span className="font-medium tabular-nums text-white">{formatPersianNumber(plan.sessionsCount)}</span> جلسه
              </p>
              <ul className="mt-3 space-y-2 border-t border-[#1e2430] pt-3">
                {(plan.features ?? []).map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-white">
                    <Check className="h-4 w-4 shrink-0 text-[#d2c0a5]" strokeWidth={1.75} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <CtaButton
                variant={plan.isActive ? "outline" : "cream"}
                onClick={() => toggleStatus(plan.id)}
                className="mt-4"
              >
                {plan.isActive ? "غیرفعال کردن" : "فعال کردن"}
              </CtaButton>
            </TwilightCard>
          ))}
        </div>
      )}
    </PageShell>
  );
}
