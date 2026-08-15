"use client";

import Link from "next/link";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { formatPersianNumber, formatDate, calculateProgress } from "@/lib/utils";
import { useTrainingPrograms } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/Button";

const statusConfig: Record<string, { label: string; variant: "secondary" | "success" | "info" | "outline" }> = {
  draft: { label: "پیش‌نویس", variant: "secondary" },
  active: { label: "فعال", variant: "success" },
  completed: { label: "تکمیل شده", variant: "info" },
  archived: { label: "بایگانی", variant: "outline" },
};

export default function ProgramsPage() {
  const { data, isLoading, isError, error } = useTrainingPrograms();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const programs = data?.data || [];

  if (programs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">برنامه‌های تمرینی</h1>
          <p className="mt-1 text-muted-foreground">برنامه‌های تمرینی شما</p>
        </div>
        <EmptyState
          icon={<Dumbbell className="h-8 w-8 text-muted-foreground" />}
          title="برنامه تمرینی وجود ندارد"
          description="هنوز برنامه تمرینی برای شما ثبت نشده است"
          action={<Button asChild><Link href="/athlete">بازگشت به داشبورد</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">برنامه‌های تمرینی</h1>
        <p className="mt-1 text-muted-foreground">برنامه‌های تمرینی شما</p>
      </div>

      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => {
          const status = statusConfig[program.status] || statusConfig.draft;
          const completedCount = program.exercises?.filter((e) => e.isCompleted).length || 0;
          const totalCount = program.exercises?.length || 1;
          const progressPercent = calculateProgress(completedCount, totalCount);
          return (
            <StaggerItem key={program.id}>
              <Link href={`/athlete/programs/${program.id}`}>
                <Card
                  glass
                  hover
                  className={`cursor-pointer transition-all ${
                    program.status === "active" ? "ring-2 ring-primary/50" : ""
                  }`}
                >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>مربی: {program.coach?.firstName || ""} {program.coach?.lastName || ""}</p>
                    <p>
                      {formatDate(program.startDate)} - {formatDate(program.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progressPercent} className="flex-1" />
                    <span className="text-sm font-medium">{formatPersianNumber(Math.round(progressPercent))}%</span>
                  </div>
                </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
