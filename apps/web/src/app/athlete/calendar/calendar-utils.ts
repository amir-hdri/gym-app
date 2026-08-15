import { addMonths, format, getDate, getDaysInMonth, isSameMonth, startOfMonth } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import { formatPersianNumber } from "@/lib/utils";

export function getJalaliMonth(date: Date) {
  const firstDay = startOfMonth(date);

  return {
    firstDay,
    title: formatPersianNumber(format(firstDay, "MMMM yyyy", { locale: faIR })),
    daysInMonth: getDaysInMonth(firstDay),
    leadingDays: (firstDay.getDay() + 1) % 7,
  };
}

export function moveJalaliMonth(date: Date, amount: number) {
  return startOfMonth(addMonths(date, amount));
}

export function groupCheckinsByJalaliDay(checkInTimes: string[], displayedMonth: Date) {
  const days: Record<number, number> = {};

  checkInTimes.forEach((checkInTime) => {
    const date = new Date(checkInTime);
    if (isSameMonth(date, displayedMonth)) {
      const day = getDate(date);
      days[day] = (days[day] || 0) + 1;
    }
  });

  return days;
}
