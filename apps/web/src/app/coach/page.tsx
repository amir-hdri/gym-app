"use client";

import * as React from "react";
import { Users, ClipboardList, CalendarCheck, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggerScroll, StaggerScrollItem } from "@/components/animations/ScrollReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { formatPersianNumber, getInitials, generateAvatarColor, formatRelativeTime, cn } from "@/lib/utils";
import { useCoachDashboard } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useAuth } from "@/components/auth/AuthProvider";
import { AthleteProgressChart } from "@/components/analytics/Charts";

function getProgressColor(progress: number) {
  if (progress >= 80) return "bg-activity-move";
  if (progress >= 50) return "bg-amber-500";
  return "bg-blue-500";
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const coachId = user?.id;
  const { data, isLoading, isError, error } = useCoachDashboard(coachId);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const dashboard = data?.data;
  if (!dashboard) return null;

  const statCards = [
    { label: "تعداد شاگردان", value: dashboard.totalAthletes, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { label: "برنامه‌های فعال", value: dashboard.activePrograms, icon: ClipboardList, color: "text-activity-move", bg: "bg-activity-move/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-activity-stand via-primary to-activity-move p-7 text-white shadow-[0_25px_70px_-30px_rgba(155,92,255,.8)] md:p-9">
        <div className="absolute -left-12 -top-20 h-64 w-64 rounded-full bg-white/15 blur-[70px]" />
        <div className="relative flex items-center justify-between gap-5">
          <div>
            <p className="latin-kicker mb-2 flex items-center gap-2 text-white/70"><Sparkles className="h-4 w-4" /> COACH STUDIO</p>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">اثر تو، قدرت آن‌هاست.</h1>
            <p className="mt-2 text-sm text-white/65">جلسه‌ها، بازبینی‌ها و پیشرفت شاگردانت در یک نگاه.</p>
          </div>
          <div className="hidden rounded-[1.5rem] border border-white/20 bg-white/10 px-6 py-4 text-center backdrop-blur-xl sm:block"><p className="text-3xl font-black">{formatPersianNumber(dashboard.totalAthletes)}</p><p className="text-xs text-white/75">شاگرد</p></div>
        </div>
      </div>

      <StaggerScroll className="grid gap-4 md:grid-cols-2" stagger={0.08}>
        {statCards.map((stat) => (
          <StaggerScrollItem key={stat.label}>
            <Card glass hover>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <div className={stat.bg + " rounded-lg p-2"}>
                  <stat.icon className={"h-5 w-5 " + stat.color} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatPersianNumber(stat.value)}</div>
              </CardContent>
            </Card>
          </StaggerScrollItem>
        ))}
      </StaggerScroll>

      <ScrollReveal delay={0.15}>
        <Card glass>
          <CardHeader>
            <div><CardTitle>نبض پیشرفت شاگردان</CardTitle><p className="mt-1 text-xs text-muted-foreground">درصد تکمیل فعلی حرکت‌های هر برنامه</p></div>
          </CardHeader>
          <CardContent><AthleteProgressChart athletes={dashboard.athletes} /></CardContent>
        </Card>
      </ScrollReveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal>
          <Card glass>
            <CardHeader>
              <CardTitle>شاگردان من</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StaggerScroll stagger={0.06}>
                {dashboard.athletes.map((athlete) => (
                  <StaggerScrollItem key={athlete.id}>
                    <div className={cn("flex items-center gap-4 rounded-lg p-4")}>
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={generateAvatarColor(athlete.name)}>
                          {getInitials(athlete.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-medium truncate max-w-full">{athlete.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            آخرین چک‌این: {athlete.lastCheckIn ? formatRelativeTime(athlete.lastCheckIn) : "-"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{athlete.currentProgram?.name || "بدون برنامه"}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <Progress value={athlete.progress} indicatorClassName={getProgressColor(athlete.progress)} />
                          <span className="text-xs font-medium tabular-nums">{formatPersianNumber(athlete.progress)}%</span>
                        </div>
                      </div>
                    </div>
                  </StaggerScrollItem>
                ))}
              </StaggerScroll>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <Card glass>
            <CardHeader>
              <CardTitle>برنامه امروز</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
                <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-bold">زمان‌بندی جلسه‌ای ثبت نشده است</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">پس از اتصال برنامه جلسات، زمان و وضعیت هر جلسه در این بخش نمایش داده می‌شود.</p>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
}
