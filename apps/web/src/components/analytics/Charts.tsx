"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
    <div className={cn("flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground", className)}>
      {message}
    </div>
  );
}

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
        <BarChart data={data} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue-bar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--activity-stand))" stopOpacity="0.65" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 5" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
            contentStyle={{ direction: "rtl", maxWidth: 220, borderRadius: "14px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 12px 30px -18px rgba(40, 18, 45, .45)", whiteSpace: "normal", lineHeight: 1.5 }}
            formatter={(value, _name, item) => [formatCurrency(value as number), `${formatPersianNumber(item.payload.transactions)} تراکنش موفق`]}
            labelFormatter={(label) => `درآمد ${label}`}
          />
          <Bar dataKey="revenue" radius={[9, 9, 3, 3]} maxBarSize={compact ? 28 : 44} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out">
            {data.map((entry) => <Cell key={entry.label} fill="url(#revenue-bar)" />)}
          </Bar>
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
        <BarChart data={data} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="session-bar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--activity-exercise))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 5" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "hsl(var(--activity-exercise) / 0.1)" }}
            contentStyle={{ direction: "rtl", maxWidth: 220, borderRadius: "14px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 12px 30px -18px rgba(40, 18, 45, .45)", whiteSpace: "normal", lineHeight: 1.5 }}
            formatter={(value) => [`${formatPersianNumber(value as number)} دقیقه`, "مدت تمرین"]}
            labelFormatter={(label) => `جلسه ${label}`}
          />
          <Bar dataKey="duration" fill="url(#session-bar)" radius={[9, 9, 3, 3]} maxBarSize={compact ? 28 : 44} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
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
          <defs>
            <linearGradient id="athlete-progress-bar" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--activity-stand))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 5" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis dataKey="name" type="category" width={90} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
            contentStyle={{ direction: "rtl", maxWidth: 220, borderRadius: "14px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 12px 30px -18px rgba(40, 18, 45, .45)", whiteSpace: "normal", lineHeight: 1.5 }}
            formatter={(value, _name, item) => [`${formatPersianNumber(value as number)}٪`, item.payload.program ?? "بدون برنامه فعال"]}
          />
          <Bar dataKey="progress" fill="url(#athlete-progress-bar)" radius={[0, 9, 9, 0]} maxBarSize={24} isAnimationActive={!reduceMotion} animationDuration={1000} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
