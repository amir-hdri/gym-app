"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Dumbbell,
  Wallet,
  Zap,
  Flame,
  Activity,
  Moon,
  Award,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatCurrency, formatPersianNumber } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns, usePayments, useTrainingPrograms, useAthleteActivity } from "@/hooks/use-api";
import { useReadinessHistory } from "@/hooks/use-readiness";
import { AthleteActivityChart } from "@/components/analytics/Charts";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { WeeklyCapsuleChart } from "@/components/twilight/CapsuleChart";
import { PageShell, PageHeader, SectionTitle, MicroLabelFa } from "@/components/twilight/Page";
import {
  TwilightCard,
  RowCard,
  FilterChips,
  EmptyState,
} from "@/components/twilight/controls";
import { cn } from "@/lib/utils";
import { soundEngine } from "@/services/soundEngine";

const TAB_OPTIONS = ["checkins", "workouts", "payments"] as const;
type TabValue = (typeof TAB_OPTIONS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  checkins: "چک‌این‌ها",
  workouts: "تمرینات",
  payments: "پرداخت‌ها",
};

const READINESS_LABELS: Record<string, string> = {
  energized: "پرانرژی",
  pumped: "پمپ عضلانی",
  sore: "کوفتگی عضلانی",
  recovered: "ریکاوری کامل",
  fatigued: "خسته",
};

const READINESS_DOT: Record<string, string> = {
  energized: "bg-activity-exercise",
  pumped: "bg-activity-move",
  sore: "bg-warning",
  recovered: "bg-activity-stand",
  fatigued: "bg-muted-foreground",
};

const READINESS_STATES = [
  {
    id: "energized",
    label: "پرانرژی",
    icon: Zap,
    quote: "سیستم عصبی در اوج آمادگی است. زمان مناسبی برای رکوردهای جدید و وزنه‌های سنگین.",
  },
  {
    id: "pumped",
    label: "پمپ عضلانی",
    icon: Dumbbell,
    quote: "گردش خون و ذخایر گلیکوژن در بهترین حالت است. روی حجم تمرین تمرکز کنید.",
  },
  {
    id: "sore",
    label: "کوفتگی عضلانی",
    icon: Flame,
    quote: "کوفتگی عضلانی تاخیری شناسایی شد. گرم کردن اصولی و فوم رولر را جدی بگیرید.",
  },
  {
    id: "recovered",
    label: "ریکاوری کامل",
    icon: Activity,
    quote: "عضلات بازسازی و شارژ شده‌اند. آماده افزایش وزنه در جلسه بعد.",
  },
  {
    id: "fatigued",
    label: "خسته",
    icon: Moon,
    quote: "به صدای بدن گوش دهید. کاهش بار تمرینی (Deload) یا خواب کافی پیشنهاد می‌شود.",
  },
];

const MILESTONES = [
  {
    id: "m1",
    title: "ورزشکار باانگیزه و متداوم",
    description: "ثبت ۵ روز تمرین متوالی بدون وقفه",
    achieved: true,
    achievedDate: "امروز",
  },
  {
    id: "m2",
    title: "مدال باشگاه صدتایی‌ها",
    description: "رسیدن به مجموع بیش از ۱۰۰ جلسه تمرین حضوری",
    achieved: true,
    achievedDate: "۳ روز پیش",
  },
  {
    id: "m3",
    title: "استاد اجرای لیفت‌های پایه",
    description: "رعایت اضافه بار تدریجی در حرکات اصلی",
    achieved: false,
  },
];

/** Journey-pattern stat card with a Persian-safe label (no letter-spacing). */
function HistoryStatCard({
  label,
  value,
  suffix,
  className,
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between rounded-2xl border border-border bg-card p-4", className)}>
      <MicroLabelFa>{label}</MicroLabelFa>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-sans text-2xl font-normal tabular-nums tracking-tight text-foreground">{value}</span>
        {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const [tab, setTab] = useState<TabValue>("checkins");
  const [selectedReadiness, setSelectedReadiness] = useState<string>("pumped");
  const [readinessMessage, setReadinessMessage] = useState<string | null>(
    "گردش خون و ذخایر گلیکوژن در بهترین حالت است. روی حجم تمرین تمرکز کنید."
  );

  const { data: checkinsData, isLoading: checkinsLoading, isError: checkinsError, error: checkinsErr } = useCheckIns(userId);
  const { data: paymentsData, isLoading: paymentsLoading, isError: paymentsError, error: paymentsErr } = usePayments(userId);
  const { data: programsData, isLoading: programsLoading, isError: programsError, error: programsErr } = useTrainingPrograms();
  const { data: energyData, isLoading: energyLoading, isError: energyError, error: energyErr } = useReadinessHistory(userId, 7);
  const { data: activityData, isLoading: activityLoading, isError: activityError, error: activityErr } = useAthleteActivity(userId, 30);

  const checkinHistory = checkinsData?.data || [];
  const paymentHistory = paymentsData?.data || [];
  const workoutHistory = programsData?.data || [];
  const energyHistory = (energyData?.data || []).slice(0, 7);
  const activityHistory = activityData?.data || [];

  const checkinsLoadingOrError = checkinsLoading || checkinsError;
  const paymentsLoadingOrError = paymentsLoading || paymentsError;
  const programsLoadingOrError = programsLoading || programsError;

  const totalPaid = paymentHistory
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleSelectReadiness = (item: (typeof READINESS_STATES)[0]) => {
    setSelectedReadiness(item.id);
    setReadinessMessage(item.quote);
    soundEngine.playBell(528);
  };

  if (checkinsLoading && paymentsLoading && programsLoading) return <Loading />;

  return (
    <PageShell className="mx-auto max-w-4xl">
      <PageHeader
        title="روند و تاریخچه فعالیت‌ها"
        subtitle="تحلیل اضافه بار، ست‌ها و سوابق فعالیت‌های ورزشی شما"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <HistoryStatCard label="کل جلسات تمرین" value={formatPersianNumber(checkinHistory.length || 142)} suffix="جلسه" />
        <HistoryStatCard label="استریک پیوستگی" value={formatPersianNumber(5)} suffix="روز" />
        <HistoryStatCard label="مجموع پرداخت‌های موفق" value={formatCurrency(totalPaid)} className="col-span-2" />
      </div>

      {/* Physical Readiness Selector (From Twilight Journey Template) */}
      <TwilightCard>
        <div className="flex items-center justify-between mb-3">
          <div>
            <SectionTitle>وضعیت آمادگی جسمانی امروز</SectionTitle>
            <p className="text-xs text-muted-foreground mt-0.5">وضعیت بدن خود را مشخص کنید تا شدت تمرین تطبیق یابد</p>
          </div>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>

        <div className="no-scrollbar flex items-center justify-between gap-2 overflow-x-auto py-1">
          {READINESS_STATES.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedReadiness === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectReadiness(item)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all cursor-pointer min-w-[70px] flex-1",
                  isSelected
                    ? "bg-secondary border-primary text-primary shadow-[0_0_12px_rgba(210,192,165,0.2)]"
                    : "bg-card border-border text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {readinessMessage && (
          <div className="mt-3 p-3 rounded-xl bg-card border border-border text-xs text-primary leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <span>{readinessMessage}</span>
          </div>
        )}
      </TwilightCard>

      {/* Tab filter chips */}
      <FilterChips
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
        labels={TAB_LABELS}
        pillId="athlete-history-filter"
      />

      {tab === "checkins" && (
        <>
        <TwilightCard>
          <SectionTitle>حجم فعالیت و جلسات هفتگی</SectionTitle>
          <p className="mt-1 text-xs text-muted-foreground">مدت جلسات تکمیل‌شده در ۷ روز اخیر</p>
          <div className="mt-4">
            {checkinsLoadingOrError ? (
              checkinsLoading ? <Loading /> : <ErrorDisplay message={checkinsErr?.message} />
            ) : checkinHistory.length === 0 ? (
              <EmptyState title="چک‌اینی ثبت نشده" description="هنوز ورودی ثبت نکرده‌اید" />
            ) : (
              <div className="space-y-6">
                <WeeklyCapsuleChart checkIns={checkinHistory} />
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          <th className="whitespace-nowrap py-3 pr-4 text-right font-medium">تاریخ</th>
                          <th className="whitespace-nowrap py-3 text-right font-medium">ورود</th>
                          <th className="whitespace-nowrap py-3 text-right font-medium">خروج</th>
                          <th className="whitespace-nowrap py-3 pl-4 text-right font-medium">مدت زمان</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkinHistory.map((item) => (
                          <tr key={item.id} className="border-t border-border transition-colors hover:bg-secondary">
                            <td className="whitespace-nowrap py-2.5 pr-4 text-foreground">{formatDate(item.checkInTime)}</td>
                            <td className="whitespace-nowrap py-2.5 tabular-nums text-muted-foreground">{new Date(item.checkInTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="whitespace-nowrap py-2.5 tabular-nums text-muted-foreground">{item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                            <td className="whitespace-nowrap py-2.5 pl-4 tabular-nums text-muted-foreground">{item.durationMinutes ? `${Math.floor(item.durationMinutes / 60)}:${String(item.durationMinutes % 60).padStart(2, "0")}` : "---"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TwilightCard>

        <TwilightCard>
          <SectionTitle>انرژی ۷ روز اخیر</SectionTitle>
          <p className="mt-1 text-xs text-muted-foreground">وضعیت‌های ثبت‌شده آمادگی جسمانی</p>
          <div className="mt-4">
            {energyLoading ? (
              <Loading />
            ) : energyError ? (
              <ErrorDisplay message={energyErr?.message} />
            ) : energyHistory.length === 0 ? (
              <EmptyState title="وضعیتی ثبت نشده" description="وضعیت آمادگی خود را از داشبورد ثبت کنید" />
            ) : (
              <ol aria-live="polite" className="flex items-stretch gap-1.5 overflow-x-auto">
                {energyHistory.map((row) => (
                  <li
                    key={row.day}
                    title={`${formatDate(row.day)}: ${READINESS_LABELS[row.state] ?? row.state}`}
                    className="flex min-w-[44px] flex-1 flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-1 py-2"
                  >
                    <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", READINESS_DOT[row.state] ?? "bg-muted-foreground")} />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(row.day, { weekday: "short" })}
                    </span>
                    <span className="sr-only">{`${formatDate(row.day)}: ${READINESS_LABELS[row.state] ?? row.state}`}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TwilightCard>

        <TwilightCard>
          <SectionTitle>فعالیت ۳۰ روز اخیر</SectionTitle>
          <p className="mt-1 text-xs text-muted-foreground">مدت حضور و حرکات تکمیل‌شده روزانه</p>
          <div className="mt-4">
            {activityLoading ? (
              <Loading />
            ) : activityError ? (
              <ErrorDisplay message={activityErr?.message} />
            ) : activityHistory.length === 0 ? (
              <EmptyState title="فعالیتی ثبت نشده" description="هنوز جلسه‌ای در ۳۰ روز اخیر ثبت نشده است" />
            ) : (
              <AthleteActivityChart data={activityHistory} />
            )}
          </div>
        </TwilightCard>
        </>
      )}

      {tab === "workouts" && (
        <div className="flex flex-col gap-3">
          <SectionTitle>تاریخچه برنامه‌های تمرینی</SectionTitle>
          {programsLoadingOrError ? (
            programsLoading ? <Loading /> : <ErrorDisplay message={programsErr?.message} />
          ) : workoutHistory.length === 0 ? (
            <EmptyState
              icon={<Dumbbell className="h-5 w-5" strokeWidth={1.75} />}
              title="برنامه تمرینی ثبت نشده"
              description="هنوز برنامه تمرینی ندارید"
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {workoutHistory.map((item) => (
                <RowCard
                  key={item.id}
                  icon={<Dumbbell className="h-4 w-4" strokeWidth={1.75} />}
                  title={item.name}
                  subtitle={`${item.exercises?.length || 0} تمرین · ${formatPersianNumber(item.frequencyPerWeek)} روز/هفته`}
                  trailing={
                    <span className="text-[11px] text-muted-foreground">{formatDate(item.startDate)}</span>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="flex flex-col gap-3">
          <SectionTitle>تاریخچه پرداخت‌ها</SectionTitle>
          {paymentsLoadingOrError ? (
            paymentsLoading ? <Loading /> : <ErrorDisplay message={paymentsErr?.message} />
          ) : paymentHistory.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-5 w-5" strokeWidth={1.75} />}
              title="پرداختی ثبت نشده"
              description="هنوز پرداختی انجام نداده‌اید"
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {paymentHistory.map((item) => (
                <RowCard
                  key={item.id}
                  icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />}
                  title={formatCurrency(item.amount)}
                  subtitle={`${item.method} · ${formatDate(item.paidAt || item.createdAt)}`}
                  trailing={
                    <Badge variant={item.status === "completed" ? "success" : "secondary"}>{item.status}</Badge>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Milestones & Badges Section */}
      <div className="flex flex-col gap-3 mt-2">
        <SectionTitle>دستاوردها و نشان‌های افتخار</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {MILESTONES.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-primary shrink-0">
                  <Award className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground leading-tight">{m.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                </div>
              </div>
              {m.achieved ? (
                <div className="flex items-center gap-1 text-[11px] font-medium text-primary bg-border px-2.5 py-1 rounded-full border border-primary/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{m.achievedDate}</span>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">در حال پیشرفت</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
