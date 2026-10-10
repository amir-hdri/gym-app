"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { formatPersianNumber, calculateProgress, calculateDaysRemaining } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGoals } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { StatCard, RowCard, EmptyState, CtaButton } from "@/components/twilight/controls";
import { Target } from "lucide-react";

const categoryLabels: Record<string, string> = {
  weight_loss: "کاهش وزن",
  muscle_gain: "افزایش عضله",
  strength: "قدرت",
  endurance: "استقامت",
  flexibility: "انعطاف",
  custom: "سفارشی",
};

export default function GoalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useGoals(athleteId);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const goals = data?.data || [];
  const achievedCount = goals.filter((g) => g.status === "achieved").length;

  return (
    <PageShell>
      <PageHeader
        title="اهداف"
        subtitle="اهداف تمرینی خود را دنبال کنید"
        action={<CtaButton className="w-auto px-5" onClick={() => router.push("/athlete/goals/new")}>هدف جدید</CtaButton>}
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" strokeWidth={1.75} />}
          title="هیچ هدفی ثبت نشده است"
          description="شما هنوز هدف تمرینی ثبت نکرده‌اید"
          action={<CtaButton onClick={() => router.push("/athlete/goals/new")}>ثبت هدف جدید</CtaButton>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="کل اهداف" value={formatPersianNumber(goals.length)} />
            <StatCard label="تکمیل شده" value={formatPersianNumber(achievedCount)} />
          </div>

          <div className="flex flex-col gap-2.5">
            {goals.map((goal) => {
              const statusVariant = goal.status === "achieved" ? ("success" as const) : ("warning" as const);
              const statusLabel = goal.status === "achieved" ? "تکمیل شده" : "در حال انجام";
              const progress = Math.round(calculateProgress(goal.currentValue, goal.targetValue));

              return (
                <RowCard
                  key={goal.id}
                  className="cursor-default"
                  icon={<Target className="h-5 w-5" strokeWidth={1.75} />}
                  title={goal.title}
                  subtitle={`${categoryLabels[goal.category] || goal.category} · ${formatPersianNumber(goal.currentValue)}/${formatPersianNumber(goal.targetValue)} ${goal.unit} · ${formatPersianNumber(progress)}٪ پیشرفت · ${formatPersianNumber(calculateDaysRemaining(goal.targetDate))} روز باقی‌مانده`}
                  trailing={
                    <Badge
                      variant={statusVariant as "success" | "warning"}
                      className={goal.status === "achieved" ? "border-transparent bg-blush-solid text-blush-foreground" : undefined}
                    >
                      {statusLabel}
                    </Badge>
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </PageShell>
  );
}
