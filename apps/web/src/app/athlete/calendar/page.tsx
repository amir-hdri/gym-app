"use client";

import { useState, useMemo } from "react";
import {
  getDate,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns-jalali";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn, formatPersianNumber } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { getJalaliMonth, groupCheckinsByJalaliDay, moveJalaliMonth } from "./calendar-utils";

const weekDays = [
  { full: "شنبه", short: "ش" },
  { full: "یکشنبه", short: "ی" },
  { full: "دوشنبه", short: "د" },
  { full: "سه‌شنبه", short: "س" },
  { full: "چهارشنبه", short: "چ" },
  { full: "پنج‌شنبه", short: "پ" },
  { full: "جمعه", short: "ج" },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useCheckIns(athleteId);

  const today = new Date();
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(() => getDate(today));

  const { title: monthTitle, daysInMonth, leadingDays: persianFirstDay } = getJalaliMonth(displayedMonth);

  const changeMonth = (amount: number) => {
    setDisplayedMonth((month) => moveJalaliMonth(month, amount));
    setSelectedDay(1);
  };

  const checkinDays = useMemo(() => {
    return groupCheckinsByJalaliDay((data?.data || []).map((checkin) => checkin.checkInTime), displayedMonth);
  }, [data, displayedMonth]);

  const todayCheckinCount = (data?.data || []).filter((checkin) =>
    isSameDay(new Date(checkin.checkInTime), today)
  ).length;

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">تقویم تمرینی</h1><p className="mt-1 text-muted-foreground">برنامه هفتگی و ماهانه</p></div>

      <FadeIn>
        <Card glass>
          <CardHeader>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="ماه قبل" className="ring-focus flex h-11 w-11 items-center justify-center rounded-xl hover:bg-muted"><ChevronRight className="h-5 w-5" /></button>
              <CardTitle>{monthTitle}</CardTitle>
              <button type="button" onClick={() => changeMonth(1)} aria-label="ماه بعد" className="ring-focus flex h-11 w-11 items-center justify-center rounded-xl hover:bg-muted"><ChevronLeft className="h-5 w-5" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-2" role="grid" aria-label={`تقویم ${monthTitle}`}>
              {weekDays.map((day) => (
                <div key={day.full} className="py-2 text-center text-xs font-bold text-muted-foreground sm:text-sm">
                  <span className="sm:hidden" aria-hidden="true">{day.short}</span>
                  <span className="hidden sm:inline">{day.full}</span>
                  <span className="sr-only sm:hidden">{day.full}</span>
                </div>
              ))}
              {Array.from({ length: persianFirstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = isSameMonth(displayedMonth, today) && dayNum === getDate(today);
                const hasCheckin = checkinDays[dayNum];
                return (
                  <button
                    type="button"
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    aria-label={`${formatPersianNumber(dayNum)} ${monthTitle}${hasCheckin ? `، ${formatPersianNumber(hasCheckin)} حضور` : ""}`}
                    aria-pressed={selectedDay === dayNum}
                    className={cn(
                      "ring-focus relative flex min-h-14 min-w-0 flex-col items-center rounded-lg px-0.5 py-2 transition-colors sm:min-h-20 sm:p-2",
                      selectedDay === dayNum ? "bg-primary/10 ring-2 ring-primary/50" : "hover:bg-muted",
                      isToday && selectedDay !== dayNum && "ring-1 ring-primary/40"
                    )}
                  >
                    <span className={cn("text-sm font-medium", isToday && "text-primary")}>{formatPersianNumber(dayNum)}</span>
                    {hasCheckin && (
                      <div className="mt-1 flex flex-col items-center gap-0.5">
                        <Dumbbell className="h-3.5 w-3.5 text-primary" />
                        <span className="hidden text-xs leading-tight text-primary sm:inline">حضور</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl border border-border/70 bg-muted/50 p-4" aria-live="polite">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">روز {formatPersianNumber(selectedDay)} {monthTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {checkinDays[selectedDay]
                      ? `${formatPersianNumber(checkinDays[selectedDay])} چک‌این برای این روز ثبت شده است.`
                      : "برای این روز حضوری ثبت نشده است."}
                  </p>
                </div>
                {checkinDays[selectedDay] ? <Badge variant="success">حضور</Badge> : <Badge variant="secondary">بدون حضور</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card glass>
          <CardHeader><CardTitle>برنامه امروز</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayCheckinCount > 0 ? (
                <div className="flex items-center justify-between rounded-lg bg-white/40 p-4">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">حضور</p>
                      <p className="text-sm text-muted-foreground">{formatPersianNumber(todayCheckinCount)} چک‌این</p>
                    </div>
                  </div>
                  <Badge variant="success">امروز</Badge>
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground">برنامه‌ای برای امروز ثبت نشده است</p>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
