"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Phone, Mail, Calendar, Award, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
  const { data: userData, isLoading: userLoading, isError: userError, error: userErr } = useUser(params.id);
  const { data: goalsData, isLoading: goalsLoading } = useGoals(params.id);
  const { data: programsData, isLoading: programsLoading } = useTrainingPrograms();
  const { data: checkInsData, isLoading: checkinsLoading } = useCheckIns(params.id);

  if (userLoading) return <Loading />;
  if (userError) return <ErrorDisplay message={userErr?.message} />;

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
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/coach/athletes">
            <ChevronRight className="h-4 w-4" />
            بازگشت به شاگردان
          </Link>
        </Button>
      </div>

      <Card glass>
        <CardContent className="flex items-center gap-6 p-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className={"text-2xl " + generateAvatarColor(name)}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{name}</h1>
              <Badge variant={athlete.status === "active" ? "success" : "secondary"}>
                {athlete.status === "active" ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {athlete.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {athlete.email}
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                {athlete.role === "athlete" ? "ورزشکار" : "کاربر"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                عضویت از {formatDate(athlete.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="program" dir="rtl">
        <TabsList>
          <TabsTrigger value="program">برنامه تمرینی</TabsTrigger>
          <TabsTrigger value="progress">پیشرفت</TabsTrigger>
          <TabsTrigger value="history">تاریخچه</TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="space-y-4">
          {programsLoading ? (
            <Loading message="در حال بارگذاری برنامه..." />
          ) : groupedPrograms.length === 0 ? (
            <Card glass>
              <CardContent className="p-6 text-center text-muted-foreground">
                هیچ برنامه تمرینی ثبت نشده است
              </CardContent>
            </Card>
          ) : (
            groupedPrograms.map((day) => (
              <Card key={day.day} glass>
                <CardHeader>
                  <CardTitle className="text-lg">{day.day}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {day.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex-1">
                          <p className="font-medium">{ex.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPersianNumber(ex.sets)} ست × {formatPersianNumber(ex.reps)} تکرار
                            {ex.weight > 0 && ` | ${formatPersianNumber(ex.weight)} کیلوگرم`}
                          </p>
                        </div>
                        <Badge variant="outline">{ex.rest}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {goalsLoading ? (
            <Loading message="در حال بارگذاری اهداف..." />
          ) : athleteGoals.length === 0 ? (
            <Card glass>
              <CardContent className="p-6 text-center text-muted-foreground">
                هیچ هدفی ثبت نشده است
              </CardContent>
            </Card>
          ) : (
            athleteGoals.map((goal) => (
              <Card key={goal.id} glass>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatPersianNumber(goal.currentValue)} / {formatPersianNumber(goal.targetValue)} {goal.unit}
                    </span>
                  </div>
                  <Progress value={calculateProgress(goal.currentValue, goal.targetValue)} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPersianNumber(Math.round(calculateProgress(goal.currentValue, goal.targetValue)))}% تکمیل شده
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {checkinsLoading ? (
            <Loading message="در حال بارگذاری تاریخچه..." />
          ) : athleteHistory.length === 0 ? (
            <Card glass>
              <CardContent className="p-6 text-center text-muted-foreground">
                هیچ چک‌اینی ثبت نشده است
              </CardContent>
            </Card>
          ) : (
            <>
              <Card glass>
                <CardHeader><div><CardTitle>ریتم تمرین</CardTitle><p className="mt-1 text-xs text-muted-foreground">مدت جلسات تکمیل‌شده شاگرد</p></div></CardHeader>
                <CardContent><SessionDurationChart checkIns={athleteHistory} /></CardContent>
              </Card>
              {athleteHistory.map((checkin) => {
              const duration = checkin.durationMinutes ? `${checkin.durationMinutes} دقیقه` : "–";
              return (
                <Card key={checkin.id} glass>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <p className="font-medium">تمرین</p>
                      <p className="text-sm text-muted-foreground">{formatDate(checkin.checkInTime)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{duration}</span>
                      <Badge variant={checkin.sessionDeducted ? "success" : "secondary"}>
                        {checkin.sessionDeducted ? "انجام شده" : "ثبت شده"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
