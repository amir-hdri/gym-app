"use client";

import { useState, useMemo } from "react";
import {
  getDate,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns-jalali";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatPersianNumber } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { getJalaliMonth, groupCheckinsByJalaliDay, moveJalaliMonth } from "./calendar-utils";
import { PageShell, PageHeader } from "@/components/twilight/Page";
import { TwilightCard, CircleIconButton, RowCard } from "@/components/twilight/controls";

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
    <PageShell className="mx-auto max-w-4xl">
      <PageHeader
        title="تقویم تمرینی"
        subtitle="برنامه هفتگی و ماهانه"
      />

      <TwilightCard>
        <div className="flex items-center justify-between">
          <CircleIconButton label="ماه قبل" onClick={() => changeMonth(-1)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d2c0a5]/60">
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </CircleIconButton>
          <h2 className="font-serif text-lg font-normal text-white">{monthTitle}</h2>
          <CircleIconButton label="ماه بعد" onClick={() => changeMonth(1)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d2c0a5]/60">
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </CircleIconButton>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-0.5 sm:gap-2" role="grid" aria-label={`تقویم ${monthTitle}`}>
          {weekDays.map((day) => (
            <div key={day.full} className="py-2 text-center text-xs font-bold text-[#8e98a8] sm:text-sm">
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
                  "relative flex min-h-14 min-w-0 flex-col items-center rounded-lg px-0.5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d2c0a5]/60 sm:min-h-20 sm:p-2",
                  selectedDay === dayNum
                    ? "bg-[#d2c0a5]/15 ring-2 ring-[#d2c0a5]/60"
                    : "hover:bg-[#1a202a]",
                  isToday && selectedDay !== dayNum && "ring-1 ring-[#d2c0a5]/40"
                )}
              >
                <span className={cn("text-sm font-medium", isToday ? "text-[#d2c0a5]" : "text-white")}>
                  {formatPersianNumber(dayNum)}
                </span>
                {hasCheckin && (
                  <div className="mt-1 flex flex-col items-center gap-0.5">
                    <Dumbbell className="h-3.5 w-3.5 text-[#d2c0a5]" strokeWidth={1.75} />
                    <span className="hidden text-xs leading-tight text-[#d2c0a5] sm:inline">حضور</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-[#232934] bg-[#1a202a] p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">روز {formatPersianNumber(selectedDay)} {monthTitle}</p>
              <p className="mt-1 text-sm text-[#8e98a8]">
                {checkinDays[selectedDay]
                  ? `${formatPersianNumber(checkinDays[selectedDay])} چک‌این برای این روز ثبت شده است.`
                  : "برای این روز حضوری ثبت نشده است."}
              </p>
            </div>
            {checkinDays[selectedDay] ? <Badge variant="success">حضور</Badge> : <Badge variant="secondary">بدون حضور</Badge>}
          </div>
        </div>
      </TwilightCard>

      <TwilightCard>
        <h2 className="font-serif text-lg font-normal text-white">برنامه امروز</h2>
        <div className="mt-3">
          {todayCheckinCount > 0 ? (
            <RowCard
              icon={<Dumbbell className="h-5 w-5" strokeWidth={1.75} />}
              title="حضور"
              subtitle={`${formatPersianNumber(todayCheckinCount)} چک‌این`}
              trailing={<Badge variant="success">امروز</Badge>}
            />
          ) : (
            <p className="py-4 text-center text-[#8e98a8]">برنامه‌ای برای امروز ثبت نشده است</p>
          )}
        </div>
      </TwilightCard>
    </PageShell>
  );
}
