"use client";

import { useState } from "react";
import { Dumbbell, Clock, Flame, Calendar, CheckCircle2, Trophy, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { ScrollReveal, StaggerScroll, StaggerScrollItem } from "@/components/animations/ScrollReveal";
import { formatPersianNumber, formatDate, calculateProgress, cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAthleteDashboard } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { WorkoutExerciseRow } from "./WorkoutExerciseRow";
import { SessionDurationChart } from "@/components/analytics/Charts";

export default function AthleteDashboard() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useAthleteDashboard(athleteId);

  const [exerciseOverrides, setExerciseOverrides] = useState<Record<string, boolean>>({});
  const [checkedIn, setCheckedIn] = useState(false);

  const name = user?.firstName;
  const today = new Date();
  const todayPersian = formatDate(today, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const dashboardData = data?.data;
  const todayExercises = dashboardData?.todayExercises || [];
  const stats = dashboardData?.stats;
  const recentGoals = dashboardData?.upcomingGoals || [];

  const completedExercises = todayExercises.filter((exercise) => exerciseOverrides[exercise.id] ?? exercise.isCompleted).length;
  const completionPercent = calculateProgress(completedExercises, todayExercises.length);
  const membership = dashboardData?.membership;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <ScrollReveal direction="none">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-surface p-6 text-white shadow-[0_25px_70px_-30px_rgba(60,20,60,.7)] md:p-8">
          <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-activity-stand/30 blur-[80px]" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-xs font-bold text-activity-exercise">{todayPersian}</p>
               <h1 className="text-3xl font-black tracking-tight md:text-4xl">سلام{name ? ` ${name}` : ""}،</h1>
              <p className="mt-2 text-sm text-white/70">امروز وقتشه یک قدم دیگه جلو بری.</p>
              <div className="mt-5 flex items-center gap-3">
                <Button size="sm" variant={checkedIn ? "destructive" : "default"} onClick={() => setCheckedIn(!checkedIn)}>
                  {checkedIn ? "پایان تمرین" : "شروع تمرین"}
                </Button>
                {todayExercises.length > 0 && <span className="text-xs text-white/70">{formatPersianNumber(todayExercises.length)} حرکت در برنامه امروز</span>}
              </div>
            </div>
            <div className="flex items-center gap-5 self-center">
              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-6 py-5 text-center backdrop-blur-sm">
                <p className="text-3xl font-black">{formatPersianNumber(Math.round(completionPercent))}٪</p>
                <p className="mt-1 text-xs text-white/70">تکمیل تمرین امروز</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Quick Stats - Horizontal Row */}
      <StaggerScroll className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.05}>
        {[
          { label: "اعتبار عضویت", value: membership ? formatDate(membership.endDate) : "ثبت نشده", sub: membership?.status === "active" ? "عضویت فعال" : "عضویت فعال ندارید", icon: Calendar, accent: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" },
          { label: "جلسات قابل استفاده", value: membership ? `${formatPersianNumber(membership.sessionsRemaining)} جلسه` : "—", sub: membership ? `از ${formatPersianNumber(membership.sessionsTotal)} جلسه` : "داده‌ای ثبت نشده", icon: Clock, accent: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" },
          { label: "تمرین امروز", value: `${formatPersianNumber(todayExercises.length)} حرکت`, sub: dashboardData?.currentProgram?.name ?? "برنامه‌ای ثبت نشده", icon: Dumbbell, accent: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400" },
          { label: "کل جلسات", value: stats ? formatPersianNumber(stats.totalSessions) : "—", sub: stats ? "جلسه" : "داده‌ای ثبت نشده", icon: Trophy, accent: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400" },
        ].map((stat, i) => (
          <StaggerScrollItem key={stat.label}>
            <Card glass hover className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1.5 leading-5">{stat.label}</p>
                    <p className="text-xl font-bold leading-7 break-words">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-5">{stat.sub}</p>
                  </div>
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", stat.accent)}>
                    <stat.icon className="h-4.5 w-4.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerScrollItem>
        ))}
      </StaggerScroll>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Workout - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <ScrollReveal delay={0.1}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-activity-move to-activity-stand text-white shadow-sm">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>برنامه تمرینی امروز</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{dashboardData?.currentProgram?.name ?? "برنامه‌ای برای امروز ثبت نشده"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {formatPersianNumber(Math.round(completionPercent))}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={completionPercent} className="h-2" />
                <div className="space-y-2">
                  {todayExercises.length > 0 ? todayExercises.map((exercise) => {
                    const isChecked = exerciseOverrides[exercise.id] ?? exercise.isCompleted;
                    return (
                      <WorkoutExerciseRow
                        key={exercise.id}
                        exercise={exercise}
                        checked={isChecked}
                        onCheckedChange={(checked) => setExerciseOverrides((current) => ({ ...current, [exercise.id]: checked }))}
                      />
                    );
                  }) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">امروز برنامه‌ای ندارید</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Progress Stats */}
          <ScrollReveal delay={0.2}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>پیشرفت هفتگی</CardTitle>
                     <p className="text-xs text-muted-foreground mt-0.5">جلسات تکمیل‌شده اخیر</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SessionDurationChart checkIns={dashboardData?.recentCheckIns ?? []} compact />
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {[
                    { label: "جلسات انجام‌شده", value: stats ? formatPersianNumber(stats.completedSessions) : "—" },
                    { label: "حرکت‌های امروز", value: formatPersianNumber(todayExercises.length) },
                    { label: "اهداف فعال", value: formatPersianNumber(recentGoals.length) },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        {/* Right Column - Goals */}
        <div className="space-y-6">
          <ScrollReveal delay={0.15}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>اهداف فعال</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">پیگیری اهداف ورزشی</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {recentGoals.length > 0 ? recentGoals.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPersianNumber(goal.currentValue)}/{formatPersianNumber(goal.targetValue)} {goal.unit}
                      </span>
                    </div>
                    <Progress value={calculateProgress(goal.currentValue, goal.targetValue)} className="h-1.5" />
                  </div>
                )) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">هدفی تعریف نشده</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>

        </div>
      </div>
    </div>
  );
}
