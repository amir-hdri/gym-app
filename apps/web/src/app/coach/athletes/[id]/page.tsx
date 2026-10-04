"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Phone, Mail, Calendar, Award, ChevronRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard, EmptyState } from "@/components/twilight/controls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatPersianNumber, getInitials, generateAvatarColor, formatDate, calculateProgress } from "@/lib/utils";
import { useUser, useGoals, useTrainingPrograms, useCheckIns } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { SessionDurationChart } from "@/components/analytics/Charts";

const persianDays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

export default function AthleteDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: userData, isLoading: userLoading, isError: userError, error: userErr, refetch: refetchUser } = useUser(params.id);
  const { data: goalsData, isLoading: goalsLoading } = useGoals(params.id);
  const { data: programsData, isLoading: programsLoading } = useTrainingPrograms();
  const { data: checkInsData, isLoading: checkinsLoading } = useCheckIns(params.id);

  if (userLoading) return <Loading />;
  if (userError) return <ErrorDisplay message={userErr?.message} onRetry={refetchUser} />;

  const athlete = userData?.data;
  if (!athlete) return null;

  const athletePrograms = (programsData?.data || []).filter((p) => p.athleteId === params.id);
  const athleteGoals = goalsData?.data || [];
  const athleteHistory = checkInsData?.data || [];

  const name = `${athlete.firstName} ${athlete.lastName}`;

  const groupedPrograms = athletePrograms.flatMap((program) => {
    const grouped: Record<number, typeof program.exercises> = {};
    for (const ex of program.exercises) {
      if (!grouped[ex.dayOfWeek]) grouped[ex.dayOfWeek] = [];
      grouped[ex.dayOfWeek].push(ex);
    }
    return Object.entries(grouped).map(([dayNum, exercises]) => ({
      day: persianDays[Number(dayNum)] || `روز ${Number(dayNum) + 1}`,
      exercises: exercises.map((ex) => ({
        name: ex.exercise?.name || "بدون نام",
        sets: ex.sets,
        reps: Number(ex.reps) || 0,
        weight: ex.weight || 0,
        rest: `${ex.restSeconds} ثانیه`,
      })),
    }));
  });

  return (
    <PageShell>
      <PageHeader
        title={name}
        subtitle={`${athlete.role === "athlete" ? "ورزشکار" : "کاربر"} · عضویت از ${formatDate(athlete.createdAt)}`}
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/coach/athletes">
              <ChevronRight className="h-4 w-4" />
              بازگشت
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col items-center pt-2">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#d2c0a5] bg-gradient-to-br from-[#2a3444] to-[#141a22] shadow-xl">
          <Avatar className="h-full w-full">
            <AvatarFallback className={`text-2xl ${generateAvatarColor(name)}`}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={athlete.status === "active" ? "success" : "secondary"}>
            {athlete.status === "active" ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#8e98a8]">
          <span className="flex items-center gap-1.5" dir="ltr">
            <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
            {athlete.phone}
          </span>
          <span className="flex items-center gap-1.5" dir="ltr">
            <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
            {athlete.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" strokeWidth={1.75} />
            {athlete.role === "athlete" ? "ورزشکار" : "کاربر"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
            عضویت از {formatDate(athlete.createdAt)}
          </span>
        </div>
      </div>

      <Tabs defaultValue="program" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl border border-[#232934] bg-[#161a22] p-1">
          <TabsTrigger value="program" className="rounded-lg data-[state=active]:bg-[#d2c0a5] data-[state=active]:text-[#121417] data-[state=active]:shadow-none">برنامه تمرینی</TabsTrigger>
          <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-[#d2c0a5] data-[state=active]:text-[#121417] data-[state=active]:shadow-none">پیشرفت</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-[#d2c0a5] data-[state=active]:text-[#121417] data-[state=active]:shadow-none">تاریخچه</TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="mt-4 space-y-4">
          {programsLoading ? (
            <Loading message="در حال بارگذاری برنامه..." />
          ) : groupedPrograms.length === 0 ? (
            <EmptyState title="برنامه‌ای ثبت نشده" description="هیچ برنامه تمرینی برای این شاگرد ثبت نشده است" />
          ) : (
            groupedPrograms.map((day) => (
              <div key={day.day}>
                <SectionTitle className="mb-3">{day.day}</SectionTitle>
                <TwilightCard className="divide-y divide-[#1e2430] p-0">
                  {day.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5 first:pt-3.5 last:pb-3.5">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2c3444] bg-[#202632] text-[#d2c0a5]">
                          <Dumbbell className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{ex.name}</p>
                          <p className="mt-0.5 text-[11px] text-[#8e98a8]">
                            {formatPersianNumber(ex.sets)} ست × {formatPersianNumber(ex.reps)} تکرار
                            {ex.weight > 0 && ` | ${formatPersianNumber(ex.weight)} کیلوگرم`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{ex.rest}</Badge>
                    </div>
                  ))}
                </TwilightCard>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-4 space-y-4">
          {goalsLoading ? (
            <Loading message="در حال بارگذاری اهداف..." />
          ) : athleteGoals.length === 0 ? (
            <EmptyState title="هدفی ثبت نشده" description="هیچ هدفی برای این شاگرد ثبت نشده است" />
          ) : (
            athleteGoals.map((goal) => (
              <TwilightCard key={goal.id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{goal.title}</span>
                  <span className="text-xs tabular-nums text-[#8e98a8]">
                    {formatPersianNumber(goal.currentValue)} / {formatPersianNumber(goal.targetValue)} {goal.unit}
                  </span>
                </div>
                <Progress value={calculateProgress(goal.currentValue, goal.targetValue)} indicatorClassName="bg-none bg-[#d2c0a5]" className="bg-white/10" />
                <p className="mt-1.5 text-[11px] text-[#8e98a8]">
                  {formatPersianNumber(Math.round(calculateProgress(goal.currentValue, goal.targetValue)))}٪ تکمیل شده
                </p>
              </TwilightCard>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {checkinsLoading ? (
            <Loading message="در حال بارگذاری تاریخچه..." />
          ) : athleteHistory.length === 0 ? (
            <EmptyState title="چک‌اینی ثبت نشده" description="هیچ چک‌اینی برای این شاگرد ثبت نشده است" />
          ) : (
            <>
              <div>
                <SectionTitle className="mb-3">ریتم تمرین</SectionTitle>
                <TwilightCard>
                  <p className="mb-3 text-[11px] text-[#8e98a8]">مدت جلسات تکمیل‌شده شاگرد</p>
                  <SessionDurationChart checkIns={athleteHistory} />
                </TwilightCard>
              </div>
              <div className="flex flex-col gap-2">
                {athleteHistory.map((checkin) => {
                  const duration = checkin.durationMinutes ? `${checkin.durationMinutes} دقیقه` : "–";
                  return (
                    <TwilightCard key={checkin.id} className="flex items-center justify-between !p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">تمرین</p>
                        <p className="text-[11px] text-[#8e98a8]">{formatDate(checkin.checkInTime)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs tabular-nums text-[#8e98a8]">{duration}</span>
                        <Badge variant={checkin.sessionDeducted ? "success" : "secondary"}>
                          {checkin.sessionDeducted ? "انجام شده" : "ثبت شده"}
                        </Badge>
                      </div>
                    </TwilightCard>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
