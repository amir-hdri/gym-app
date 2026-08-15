"use client";

import Link from "next/link";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { formatPersianNumber, calculateProgress, calculateDaysRemaining, cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useGoals } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { Target } from "lucide-react";

const categoryColors: Record<string, string> = {
  weight_loss: "bg-amber-500",
  muscle_gain: "bg-activity-move",
  strength: "bg-blue-500",
  endurance: "bg-purple-500",
};

const categoryLabels: Record<string, string> = {
  weight_loss: "کاهش وزن",
  muscle_gain: "افزایش عضله",
  strength: "قدرت",
  endurance: "استقامت",
  flexibility: "انعطاف",
  custom: "سفارشی",
};

export default function GoalsPage() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useGoals(athleteId);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const goals = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-10">اهداف</h1>
          <p className="mt-1 text-muted-foreground leading-6">اهداف تمرینی خود را دنبال کنید</p>
        </div>
        <Button asChild className="w-full sm:w-auto"><Link href="/athlete/goals/new">هدف جدید</Link></Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-8 w-8 text-muted-foreground" />}
          title="هیچ هدفی ثبت نشده است"
          description="شما هنوز هدف تمرینی ثبت نکرده‌اید"
          action={<Button asChild><Link href="/athlete/goals/new">ثبت هدف جدید</Link></Button>}
        />
      ) : (
        <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const statusVariant = goal.status === "achieved" ? ("success" as const) : ("warning" as const);
            const statusLabel = goal.status === "achieved" ? "تکمیل شده" : "در حال انجام";

            return (
              <StaggerItem key={goal.id}>
                <Card glass hover>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <Badge variant={statusVariant as "success" | "warning"}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <Badge className={cn(categoryColors[goal.category] || "bg-gray-500", "text-white bg-opacity-80 backdrop-blur-sm")}>
                    {categoryLabels[goal.category] || goal.category}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">پیشرفت</span>
                    <span>
                      {formatPersianNumber(goal.currentValue)}/{formatPersianNumber(goal.targetValue)} {goal.unit}
                    </span>
                  </div>
                  <Progress
                    value={calculateProgress(goal.currentValue, goal.targetValue)}
                    indicatorClassName={categoryColors[goal.category] || "bg-gray-500"}
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">زمان باقی‌مانده</span>
                    <span>{formatPersianNumber(calculateDaysRemaining(goal.targetDate))} روز</span>
                  </div>
                </CardContent>
              </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
