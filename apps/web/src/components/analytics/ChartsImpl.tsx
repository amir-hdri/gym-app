"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
        "flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center text-sm text-muted-foreground",
        className
      )}
    >
      {message}
    </div>
  );
}

// Twilight — shared tooltip style, resolved from the active theme tokens so
// charts recolor with the rest of the UI (var() in presentation attributes
// and inline styles follows the .dark class automatically).
const twilightTooltip = {
  cursor: { fill: "color-mix(in srgb, var(--color-primary) 8%, transparent)" },
  contentStyle: {
    direction: "rtl" as const,
    maxWidth: 220,
    borderRadius: "12px",
    border: "1px solid var(--color-border)",
    background: "var(--color-popover)",
    color: "var(--color-popover-foreground)",
    boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
    whiteSpace: "normal" as const,
    lineHeight: 1.5,
    fontFamily: "var(--font-sans)",
    fontSize: "12px",
  },
  labelStyle: { color: "var(--color-foreground)", fontWeight: 600 },
  itemStyle: { color: "var(--color-muted-foreground)" },
};

const twilightGrid = "var(--color-border)";
const twilightTick = { fill: "var(--color-muted-foreground)", fontSize: 11, fontFamily: "var(--font-sans)" };

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
          <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={compact ? 22 : 28} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
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
          <Bar dataKey="duration" fill="var(--color-muted-foreground)" radius={[6, 6, 0, 0]} maxBarSize={compact ? 22 : 28} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
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
          <Bar dataKey="progress" fill="var(--color-primary)" radius={[0, 6, 6, 0]} maxBarSize={20} isAnimationActive={!reduceMotion} animationDuration={1000} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---- Analytics series (GET /dashboard/*-trend etc.) ----

export function AttendanceTrendChart({
  data, compact = false,
}: {
  data: { date: string; checkIns: number; uniqueMembers: number }[];
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const rows = data.map((d) => ({ ...d, label: chartDate(d.date, dayFormatter) }));
  if (rows.length < 2) {
    return <EmptyChart className={compact ? "h-44" : undefined} message="برای نمایش روند حضور، حداقل دو روز داده لازم است." />;
  }
  return (
    <div className={cn(compact ? "h-44" : "h-72")} dir="ltr" role="img" aria-label="نمودار روند حضور روزانه">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 4, left: -12, bottom: 0 }} barCategoryGap={compact ? "30%" : "18%"}>
          <CartesianGrid vertical={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={twilightTick} minTickGap={28} />
          <YAxis hide />
          <Tooltip
            cursor={twilightTooltip.cursor}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value, name) => [
              formatPersianNumber(value as number),
              name === "checkIns" ? "ورود" : "عضو یکتا",
            ] as any}
          />
          <Bar dataKey="checkIns" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={compact ? 22 : 28} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueTrendChart({
  data, compact = false,
}: {
  data: { month: string; revenue: number; payments: number }[];
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const rows = data.map((d) => ({ ...d, label: chartDate(`${d.month}-01`, monthFormatter) }));
  if (rows.length < 2) {
    return <EmptyChart className={compact ? "h-44" : undefined} message="برای نمایش روند درآمد، حداقل دو ماه داده لازم است." />;
  }
  return (
    <div className={cn(compact ? "h-44" : "h-72")} dir="ltr" role="img" aria-label="نمودار روند درآمد ماهانه">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 4, left: -12, bottom: 0 }} barCategoryGap={compact ? "30%" : "24%"}>
          <CartesianGrid vertical={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={twilightTick} />
          <YAxis hide />
          <Tooltip
            cursor={twilightTooltip.cursor}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value) => [formatCurrency(value as number), "درآمد"] as any}
          />
          <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={compact ? 22 : 28} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueSeriesChart({
  labels, values, period = "monthly", compact = false,
}: {
  labels: string[];
  values: number[];
  period?: "daily" | "monthly";
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const rows = labels.map((label, i) => ({
    label: period === "daily" ? chartDate(label, dayFormatter) : chartDate(`${label}-01`, monthFormatter),
    revenue: values[i] ?? 0,
  }));
  if (rows.length < 2) {
    return <EmptyChart className={compact ? "h-44" : undefined} message="برای نمایش سری درآمد، حداقل دو نقطه داده لازم است." />;
  }
  return (
    <div className={cn(compact ? "h-44" : "h-72")} dir="ltr" role="img" aria-label="نمودار سری زمانی درآمد">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={twilightTick} minTickGap={28} />
          <YAxis hide />
          <Tooltip
            cursor={{ stroke: "color-mix(in srgb, var(--color-primary) 30%, transparent)" }}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value) => [formatCurrency(value as number), "درآمد"] as any}
          />
          <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MembershipDistributionChart({
  data,
}: {
  data: { planId: string; planName: string; count: number; revenue: number }[];
}) {
  const reduceMotion = useReducedMotion();
  if (data.length < 1) {
    return <EmptyChart message="هنوز عضویتی برای نمایش توزیع پلن‌ها ثبت نشده است." />;
  }
  return (
    <div className="h-72" dir="ltr" role="img" aria-label="نمودار توزیع اعضا بین پلن‌ها">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 10, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis type="number" hide />
          <YAxis dataKey="planName" type="category" width={90} tickLine={false} axisLine={false} tick={twilightTick} />
          <Tooltip
            cursor={twilightTooltip.cursor}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value, _name, item) => [`${formatPersianNumber(value as number)} عضو`, formatCurrency((item.payload as any).revenue)] as any}
          />
          <Bar dataKey="count" fill="var(--color-activity-exercise)" radius={[0, 6, 6, 0]} maxBarSize={20} isAnimationActive={!reduceMotion} animationDuration={1000} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PeakHoursChart({
  data, compact = false,
}: {
  data: { hour: number; checkIns: number }[];
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const rows = data.map((d) => ({ ...d, label: formatPersianNumber(d.hour) }));
  const peak = rows.reduce((m, r) => (r.checkIns > m.checkIns ? r : m), rows[0] ?? { checkIns: 0 });
  if (rows.length < 2 || peak.checkIns === 0) {
    return <EmptyChart className={compact ? "h-44" : undefined} message="برای نمایش ساعات اوج، داده حضور کافی نیست." />;
  }
  return (
    <div className={cn(compact ? "h-44" : "h-72")} dir="ltr" role="img" aria-label="نمودار ساعات اوج حضور">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 4, left: -12, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={twilightTick} />
          <YAxis hide />
          <Tooltip
            cursor={twilightTooltip.cursor}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value) => [`${formatPersianNumber(value as number)} ورود`, "ساعت"] as any}
          />
          <Bar dataKey="checkIns" fill="var(--color-activity-stand)" radius={[6, 6, 0, 0]} maxBarSize={compact ? 18 : 22} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AthleteActivityChart({
  data, compact = false,
}: {
  data: { date: string; checkedIn: boolean; durationMinutes: number; exercisesCompleted: number }[];
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const rows = data.map((d) => ({ ...d, label: chartDate(d.date, dayFormatter) }));
  if (rows.filter((r) => r.checkedIn).length < 2) {
    return <EmptyChart className={compact ? "h-44" : undefined} message="برای نمایش فعالیت، حداقل دو روز حضور لازم است." />;
  }
  return (
    <div className={cn(compact ? "h-44" : "h-72")} dir="ltr" role="img" aria-label="نمودار فعالیت روزانه ورزشکار">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 4, left: -12, bottom: 0 }} barCategoryGap={compact ? "30%" : "18%"}>
          <CartesianGrid vertical={false} stroke={twilightGrid} strokeDasharray="3 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={twilightTick} minTickGap={28} />
          <YAxis hide />
          <Tooltip
            cursor={twilightTooltip.cursor}
            contentStyle={twilightTooltip.contentStyle as any}
            formatter={(value, name) => [
              name === "durationMinutes"
                ? `${formatPersianNumber(value as number)} دقیقه`
                : `${formatPersianNumber(value as number)} حرکت`,
              name === "durationMinutes" ? "مدت حضور" : "حرکات تکمیل‌شده",
            ] as any}
          />
          <Bar dataKey="durationMinutes" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={compact ? 22 : 28} isAnimationActive={!reduceMotion} animationDuration={900} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
