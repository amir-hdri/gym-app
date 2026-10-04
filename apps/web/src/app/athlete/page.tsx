"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dumbbell,
  Clock,
  Calendar,
  Trophy,
  TrendingUp,
  Activity,
  Flame,
  QrCode,
  History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { formatPersianNumber, formatDate, calculateProgress } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAthleteDashboard, useCompleteProgramExercise } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { WorkoutExerciseRow } from "./WorkoutExerciseRow";
import { SessionDurationChart } from "@/components/analytics/Charts";
import { PageShell, MicroLabelFa, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard, RowCard, CtaButton, EmptyState } from "@/components/twilight/controls";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";

const categories: { id: string; label: string; icon: LucideIcon; href: string }[] = [
  { id: "checkin", label: "چک‌این", icon: QrCode, href: "/athlete/checkin" },
  { id: "calendar", label: "تقویم", icon: Calendar, href: "/athlete/calendar" },
  { id: "history", label: "تاریخچه", icon: History, href: "/athlete/history" },
  { id: "programs", label: "برنامه‌ها", icon: Dumbbell, href: "/athlete/programs" },
];

export default function AthleteDashboard() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useAthleteDashboard(athleteId);

  const [exerciseOverrides, setExerciseOverrides] = useState<Record<string, boolean>>({});
  const [checkedIn, setCheckedIn] = useState(false);
  const completeMutation = useCompleteProgramExercise();

  const name = user?.firstName;
  const today = new Date();
  const todayPersian = formatDate(today, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  const dashboardData = data?.data;
  const currentProgramId = (dashboardData as { currentProgram?: { id: string } } | undefined)?.currentProgram?.id;
  const todayExercises = dashboardData?.todayExercises || [];
  const stats = dashboardData?.stats;
  const recentGoals = dashboardData?.upcomingGoals || [];

  const completedExercises = todayExercises.filter((exercise) => exerciseOverrides[exercise.id] ?? exercise.isCompleted).length;
  const completionPercent = calculateProgress(completedExercises, todayExercises.length);
  const membership = dashboardData?.membership;

  return (
    <PageShell className="mx-auto max-w-7xl">
      {/* Greeting + streak pill */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <MicroLabelFa>{todayPersian}</MicroLabelFa>
          <h1 className="mt-1 font-serif text-[26px] font-normal leading-tight tracking-tight text-[#f5f3ef]">
            سلام{name ? ` ${name}` : ""}،
          </h1>
          <p className="mt-1 font-sans text-xs text-[#9ba3af]">امروز وقتشه یک قدم دیگه جلو بری.</p>
        </div>
        <Link
          href="/athlete/history"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#2b313d] bg-[#181c22] px-3 py-1.5 text-xs text-[#e5d9c5]"
          title="مشاهده تاریخچه"
        >
          <Flame className="h-3.5 w-3.5 fill-[#d2c0a5]/25 text-[#d2c0a5]" strokeWidth={1.75} />
          <span className="font-sans text-[11px] font-semibold tracking-wider">
            {stats ? formatPersianNumber(stats.currentStreak) : "—"} روز
          </span>
        </Link>
      </div>

      {/* Hero: today's program */}
      <div className="relative cursor-default overflow-hidden rounded-[26px] border border-white/10">
        <div className="h-[270px] w-full">
          <GymBackdrop />
        </div>
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
          <div>
            <MicroLabelFa className="mb-2 text-[#d2c0a5]">برنامه امروز</MicroLabelFa>
            <h2 className="max-w-[290px] font-serif text-[26px] font-medium leading-snug tracking-tight text-white">
              {dashboardData?.currentProgram?.name ?? "برنامه تمرینی امروز"}
            </h2>
            <p className="mt-2.5 max-w-[290px] text-xs leading-relaxed text-[#d1d5db]/90">
              {todayExercises.length > 0
                ? `${formatPersianNumber(todayExercises.length)} حرکت در برنامه امروز`
                : "امروز برنامه‌ای ندارید"}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#e5e7eb]">
              <Clock className="h-3.5 w-3.5 text-[#d2c0a5]" strokeWidth={1.75} />
              <span>
                {formatPersianNumber(Math.round(completionPercent))}٪ تکمیل
              </span>
            </div>
            <CtaButton
              variant={checkedIn ? "outline" : "cream"}
              onClick={() => setCheckedIn(!checkedIn)}
              className="w-auto shrink-0 px-5"
            >
              {checkedIn ? "پایان تمرین" : "شروع تمرین"}
            </CtaButton>
          </div>
        </div>
      </div>

      {/* Category circles */}
      <div className="no-scrollbar flex items-center justify-between gap-3 overflow-x-auto py-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link key={cat.id} href={cat.href} className="group flex shrink-0 flex-col items-center gap-2">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-[#262c37] bg-[#181d24] text-[#9ca3af] shadow-sm transition-colors group-hover:border-[#d2c0a5]/50 group-hover:bg-[#1f2530] group-hover:text-[#d2c0a5]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span className="text-[11px] text-[#9ca3af] transition-colors group-hover:text-white">
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Membership row */}
      <Link href="/athlete/membership">
        <RowCard
          icon={<Calendar className="h-4 w-4" strokeWidth={1.75} />}
          title={membership?.status === "active" ? "عضویت فعال" : "عضویت فعال ندارید"}
          subtitle={
            membership
              ? `اعتبار تا ${formatDate(membership.endDate)} · ${formatPersianNumber(membership.sessionsRemaining)} جلسه از ${formatPersianNumber(membership.sessionsTotal)} جلسه`
              : "ثبت نشده"
          }
        />
      </Link>

      {/* Today's exercises */}
      <div className="flex flex-col gap-3">
        <SectionTitle
          action={
            <span className="font-sans text-xs text-[#d2c0a5]">
              {formatPersianNumber(completedExercises)}/{formatPersianNumber(todayExercises.length)} تکمیل شده
            </span>
          }
        >
          برنامه تمرینی امروز
        </SectionTitle>
        {todayExercises.length > 0 ? (
          <div className="flex flex-col gap-2">
            {todayExercises.map((exercise) => {
              const isChecked = exerciseOverrides[exercise.id] ?? exercise.isCompleted;
              return (
                <WorkoutExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    setExerciseOverrides((current) => ({ ...current, [exercise.id]: checked }));
                    if (checked && currentProgramId && exercise.id) {
                      completeMutation.mutate(
                        { programId: currentProgramId, exerciseId: exercise.id },
                        { onError: () => toast.error("ثبت تمرین ناموفق بود") },
                      );
                    }
                  }}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Activity className="h-5 w-5" strokeWidth={1.75} />}
            title="امروز برنامه‌ای ندارید"
          />
        )}
      </div>

      {/* Weekly progress */}
      <TwilightCard>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2c3444] bg-[#202632] text-[#d2c0a5]">
            <TrendingUp className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-serif text-lg font-normal text-white">پیشرفت هفتگی</h2>
            <p className="mt-0.5 text-xs text-[#8e98a8]">جلسات تکمیل‌شده اخیر</p>
          </div>
        </div>
        <div className="mt-4">
          <SessionDurationChart checkIns={dashboardData?.recentCheckIns ?? []} compact />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "جلسات انجام‌شده", value: stats ? formatPersianNumber(stats.completedSessions) : "—" },
            { label: "کل جلسات", value: stats ? formatPersianNumber(stats.totalSessions) : "—" },
            { label: "حرکات امروز", value: formatPersianNumber(todayExercises.length) },
            { label: "اهداف فعال", value: formatPersianNumber(recentGoals.length) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-[#1a202a] p-3 text-center">
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="mt-0.5 text-[11px] text-[#8e98a8]">{s.label}</p>
            </div>
          ))}
        </div>
      </TwilightCard>

      {/* Goals */}
      <TwilightCard>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2c3444] bg-[#202632] text-[#d2c0a5]">
            <Trophy className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-serif text-lg font-normal text-white">اهداف فعال</h2>
            <p className="mt-0.5 text-xs text-[#8e98a8]">پیگیری اهداف ورزشی</p>
          </div>
        </div>
        <div className="mt-5 space-y-5">
          {recentGoals.length > 0 ? recentGoals.map((goal) => (
            <div key={goal.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-white">{goal.title}</span>
                <span className="text-xs text-[#8e98a8]">
                  {formatPersianNumber(goal.currentValue)}/{formatPersianNumber(goal.targetValue)} {goal.unit}
                </span>
              </div>
              <Progress value={calculateProgress(goal.currentValue, goal.targetValue)} className="h-1.5" />
            </div>
          )) : (
            <div className="py-6 text-center text-[#8e98a8]">
              <Trophy className="mx-auto mb-2 h-8 w-8 opacity-40" strokeWidth={1.75} />
              <p className="text-sm">هدفی تعریف نشده</p>
            </div>
          )}
        </div>
      </TwilightCard>
    </PageShell>
  );
}
