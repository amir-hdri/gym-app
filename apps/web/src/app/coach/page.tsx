"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardList, Plus, Dumbbell, MessageSquare, ChevronLeft } from "lucide-react";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { RowCard, StatCard, TwilightCard } from "@/components/twilight/controls";
import { Progress } from "@/components/ui/Progress";
import { formatPersianNumber, getInitials, formatRelativeTime } from "@/lib/utils";
import { useCoachDashboard } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useAuth } from "@/components/auth/AuthProvider";
import { AthleteProgressChart } from "@/components/analytics/Charts";

function getProgressClass(progress: number) {
  if (progress >= 80) return "bg-none bg-primary";
  if (progress >= 50) return "bg-none bg-primary";
  return "bg-none bg-muted";
}

const quickActions = [
  { label: "شاگرد جدید", icon: Plus, href: "/coach/athletes/new" },
  { label: "برنامه جدید", icon: ClipboardList, href: "/coach/programs/new" },
  { label: "حرکت جدید", icon: Dumbbell, href: "/coach/exercises/new" },
  { label: "پیام‌ها", icon: MessageSquare, href: "/coach/messages" },
];

export default function CoachDashboard() {
  const { user } = useAuth();
  const coachId = user?.id;
  const { data, isLoading, isError, error } = useCoachDashboard(coachId);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const dashboard = data?.data;
  if (!dashboard) return null;

  const athletes = dashboard.athletes ?? [];

  return (
    <PageShell>
      <PageHeader
        title={`سلام، ${user?.firstName ?? "مربی"}`}
        subtitle="جلسه‌ها، بازبینی‌ها و پیشرفت شاگردانت در یک نگاه."
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="شاگردان" value={formatPersianNumber(dashboard.totalAthletes ?? dashboard.athletesCount ?? 0)} />
        <StatCard label="برنامه‌های فعال" value={formatPersianNumber(dashboard.activePrograms ?? 0)} />
        <StatCard label="جلسات امروز" value={formatPersianNumber(dashboard.todaySessions ?? 0)} />
        <StatCard label="اهداف در انتظار" value={formatPersianNumber(dashboard.pendingGoals ?? 0)} />
      </div>

      <div>
        <SectionTitle className="mb-3">اقدامات سریع</SectionTitle>
        <div className="flex items-center justify-around py-1">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group flex shrink-0 flex-col items-center gap-2 focus:outline-none">
                <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors group-hover:border-primary/50 group-hover:bg-secondary group-hover:text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <span className="text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle className="mb-3">نبض پیشرفت شاگردان</SectionTitle>
        <TwilightCard>
          <p className="mb-3 text-[11px] text-muted-foreground">درصد تکمیل فعلی حرکت‌های هر برنامه</p>
          <AthleteProgressChart athletes={athletes} />
        </TwilightCard>
      </div>

      <div>
        <SectionTitle
          className="mb-3"
          action={
            <Link href="/coach/athletes" className="flex items-center gap-1 text-xs text-primary">
              همه شاگردان
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          }
        >
          شاگردان من
        </SectionTitle>
        {athletes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">هنوز شاگردی به شما منتسب نشده است.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {athletes.map((athlete) => (
              <Link key={athlete.id} href={`/coach/athletes/${athlete.id}`} className="block">
                <RowCard
                  icon={<span className="font-serif text-sm text-primary">{getInitials(athlete.name)}</span>}
                  title={athlete.name}
                  subtitle={
                    <>
                      {athlete.currentProgram?.name || "بدون برنامه"}
                      {" · "}
                      آخرین چک‌این: {athlete.lastCheckIn ? formatRelativeTime(athlete.lastCheckIn) : "-"}
                    </>
                  }
                  trailing={
                    <div className="flex w-24 flex-col items-end gap-1.5">
                      <span className="text-xs font-medium tabular-nums text-foreground">
                        {formatPersianNumber(athlete.progress)}٪
                      </span>
                      <Progress value={athlete.progress} indicatorClassName={getProgressClass(athlete.progress)} className="h-1.5 bg-border" />
                    </div>
                  }
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
