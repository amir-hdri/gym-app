"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "framer-motion";
import type { CheckIn, CoachDashboardData, Payment } from "@/lib/types";
import { cn, formatCurrency, formatPersianNumber } from "@/lib/utils";

const monthFormatter = new Intl.DateTimeFormat("fa-IR", { month: "short" });
const dayFormatter = new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" });

function chartDate(value: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(value));
}

function EmptyChart({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-64 items-center justify-center rounded-xl border border-dashed border-[#232934] bg-[#161a22] px-6 text-center text-sm text-[#8e98a8]",
        className
      )}
    >
      {message}
    </div>
  );
}

// Twilight — shared tooltip style
const twilightTooltip = {
  cursor: { fill: "rgba(210,192,165,0.08)" },
  contentStyle: {
    direction: "rtl" as const,
    maxWidth: 220,
    borderRadius: "12px",
    border: "1px solid #232934",
    background: "#161a22",
    color: "#f5f3ef",
    boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
    whiteSpace: "normal" as const,
    lineHeight: 1.5,
    fontFamily: "var(--font-vazirmatn), system-ui, sans-serif",
    fontSize: "12px",
  },
  labelStyle: { color: "#f5f3ef", fontWeight: 600 },
  itemStyle: { color: "#8e98a8" },
};

const twilightGrid = "#1e2430";
const twilightTick = { fill: "#8e98a8", fontSize: 11, fontFamily: "var(--font-vazirmatn), system-ui, sans-serif" };

export function RevenueChart({ payments, compact = false }: { payments: Payment[]; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const revenueByMonth = payments
    .filter((payment) => payment.status === "completed")
    .reduce<Record<string, { date: string; revenue: number; transactions: number }>>((months, payment) => {
      const date = payment.paidAt ?? payment.createdAt;
      const key = date.slice(0, 7);
      const current = months[key] ?? { date, revenue: 0, transactions: 0 };
      current.revenue += payment.amount;
      current.transactions += 1;
      months[key] = current;
      return months;
    }, {});
  const data = Object.entries(revenueByMonth)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(compact ? -6 : 0)
    .map(([, value]) => ({ ...value, label: chartDate(value.date, monthFormatter) }));

  if (data.length < 2) {
    return <EmptyChart className={compact ? "h-44" : undefined} message="برای نمایش روند درآمد، حداقل دو پرداخت موفق لازم است." />;
  }

  return (
    <div className={cn(compact ? "h-44" : "h-72")} dir="ltr" role="img" aria-label="نمودار درآمد پرداخت‌های موفق به تفکیک ماه">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: -12, bottom: 0 }} barCategoryGap={compact ? "30%" : "24%"}>
          <CartesianGrid vertical={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={twilightTick} />
          <YAxis hide />
          <Tooltip
            cursor={twilightTooltip.cursor}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value, _name, item) => [formatCurrency(value as number), `${formatPersianNumber(item.payload.transactions)} تراکنش موفق`] as any}
            labelFormatter={(label) => `درآمد ${label}`}
          />
          <Bar dataKey="revenue" fill="#d2c0a5" radius={[6, 6, 0, 0]} maxBarSize={compact ? 22 : 28} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SessionDurationChart({ checkIns, compact = false }: { checkIns: CheckIn[]; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const data = checkIns
    .filter((checkIn) => checkIn.checkOutTime && typeof checkIn.durationMinutes === "number")
    .sort((left, right) => new Date(left.checkInTime).getTime() - new Date(right.checkInTime).getTime())
    .slice(compact ? -5 : 0)
    .map((checkIn) => ({
      label: chartDate(checkIn.checkInTime, dayFormatter),
      duration: checkIn.durationMinutes ?? 0,
      checkInTime: checkIn.checkInTime,
    }));

  if (data.length < 2) {
    return <EmptyChart className={compact ? "h-44" : undefined} message="برای نمایش روند جلسات، حداقل دو جلسه تکمیل‌شده لازم است." />;
  }

  return (
    <div className={cn(compact ? "h-44" : "h-72")} dir="ltr" role="img" aria-label="نمودار مدت جلسات تکمیل‌شده به تفکیک تاریخ">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: -12, bottom: 0 }} barCategoryGap={compact ? "30%" : "24%"}>
          <CartesianGrid vertical={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={twilightTick} />
          <YAxis hide />
          <Tooltip
            cursor={twilightTooltip.cursor}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value) => [`${formatPersianNumber(value as number)} دقیقه`, "مدت تمرین"] as any}
            labelFormatter={(label) => `جلسه ${label}`}
          />
          <Bar dataKey="duration" fill="#8e98a8" radius={[6, 6, 0, 0]} maxBarSize={compact ? 22 : 28} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type CoachAthlete = CoachDashboardData["athletes"][number];

export function AthleteProgressChart({ athletes }: { athletes: CoachAthlete[] }) {
  const reduceMotion = useReducedMotion();
  const data = athletes
    .map((athlete) => ({ name: athlete.name, progress: athlete.progress, program: athlete.currentProgram?.name }))
    .sort((left, right) => right.progress - left.progress)
    .slice(0, 7);

  if (data.length < 2) {
    return <EmptyChart message="برای مقایسه پیشرفت، حداقل دو شاگرد دارای برنامه لازم است." />;
  }

  return (
    <div className="h-72" dir="ltr" role="img" aria-label="نمودار مقایسه درصد تکمیل برنامه شاگردان">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 10, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis dataKey="name" type="category" width={90} tickLine={false} axisLine={false} tick={twilightTick} />
          <Tooltip
            cursor={twilightTooltip.cursor}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value, _name, item) => [`${formatPersianNumber(value as number)}٪`, (item.payload as any).program ?? "بدون برنامه فعال"] as any}
          />
          <Bar dataKey="progress" fill="#d2c0a5" radius={[0, 6, 6, 0]} maxBarSize={20} isAnimationActive={!reduceMotion} animationDuration={1000} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
