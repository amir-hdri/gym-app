"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Dumbbell, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns, usePayments, useTrainingPrograms } from "@/hooks/use-api";
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

const TAB_OPTIONS = ["checkins", "workouts", "payments"] as const;
type TabValue = (typeof TAB_OPTIONS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  checkins: "چک‌این‌ها",
  workouts: "تمرینات",
  payments: "پرداخت‌ها",
};

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
    <div className={cn("flex flex-col justify-between rounded-2xl border border-[#232934] bg-[#161a22] p-4", className)}>
      <MicroLabelFa>{label}</MicroLabelFa>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-sans text-2xl font-normal tabular-nums tracking-tight text-white">{value}</span>
        {suffix ? <span className="text-xs text-[#8e98a8]">{suffix}</span> : null}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const [tab, setTab] = useState<TabValue>("checkins");

  const { data: checkinsData, isLoading: checkinsLoading, isError: checkinsError, error: checkinsErr } = useCheckIns(userId);
  const { data: paymentsData, isLoading: paymentsLoading, isError: paymentsError, error: paymentsErr } = usePayments(userId);
  const { data: programsData, isLoading: programsLoading, isError: programsError, error: programsErr } = useTrainingPrograms();

  const checkinHistory = checkinsData?.data || [];
  const paymentHistory = paymentsData?.data || [];
  const workoutHistory = programsData?.data || [];

  const checkinsLoadingOrError = checkinsLoading || checkinsError;
  const paymentsLoadingOrError = paymentsLoading || paymentsError;
  const programsLoadingOrError = programsLoading || programsError;

  const totalPaid = paymentHistory
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (checkinsLoading && paymentsLoading && programsLoading) return <Loading />;

  return (
    <PageShell className="mx-auto max-w-4xl">
      <PageHeader
        title="تاریخچه"
        subtitle="سوابق فعالیت‌های شما"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <HistoryStatCard label="کل چک‌این‌ها" value={checkinHistory.length} suffix="جلسه" />
        <HistoryStatCard label="برنامه‌های تمرینی" value={workoutHistory.length} suffix="برنامه" />
        <HistoryStatCard label="مجموع پرداخت‌های موفق" value={formatCurrency(totalPaid)} className="col-span-2" />
      </div>

      {/* Tab filter chips */}
      <FilterChips
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
        labels={TAB_LABELS}
        pillId="athlete-history-filter"
      />

      {tab === "checkins" && (
        <TwilightCard>
          <SectionTitle>تاریخچه چک‌این‌ها</SectionTitle>
          <p className="mt-1 text-xs text-[#8e98a8]">مدت جلسات تکمیل‌شده در ۷ روز اخیر</p>
          <div className="mt-4">
            {checkinsLoadingOrError ? (
              checkinsLoading ? <Loading /> : <ErrorDisplay message={checkinsErr?.message} />
            ) : checkinHistory.length === 0 ? (
              <EmptyState title="چک‌اینی ثبت نشده" description="هنوز ورودی ثبت نکرده‌اید" />
            ) : (
              <div className="space-y-6">
                <WeeklyCapsuleChart checkIns={checkinHistory} />
                <div className="overflow-hidden rounded-xl border border-[#1e2430]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-[#8e98a8]">
                          <th className="whitespace-nowrap py-3 pr-4 text-right font-medium">تاریخ</th>
                          <th className="whitespace-nowrap py-3 text-right font-medium">ورود</th>
                          <th className="whitespace-nowrap py-3 text-right font-medium">خروج</th>
                          <th className="whitespace-nowrap py-3 pl-4 text-right font-medium">مدت زمان</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkinHistory.map((item) => (
                          <tr key={item.id} className="border-t border-[#1e2430] transition-colors hover:bg-[#1a202a]">
                            <td className="whitespace-nowrap py-2.5 pr-4 text-white">{formatDate(item.checkInTime)}</td>
                            <td className="whitespace-nowrap py-2.5 tabular-nums text-[#c9cfd9]">{new Date(item.checkInTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="whitespace-nowrap py-2.5 tabular-nums text-[#c9cfd9]">{item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                            <td className="whitespace-nowrap py-2.5 pl-4 tabular-nums text-[#c9cfd9]">{item.durationMinutes ? `${Math.floor(item.durationMinutes / 60)}:${String(item.durationMinutes % 60).padStart(2, "0")}` : "---"}</td>
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
      )}

      {tab === "workouts" && (
        <div className="flex flex-col gap-3">
          <SectionTitle>تاریخچه تمرینات</SectionTitle>
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
                  subtitle={`${item.exercises?.length || 0} تمرین · ${item.frequencyPerWeek} روز/هفته`}
                  trailing={
                    <span className="text-[11px] text-[#8e98a8]">{formatDate(item.startDate)}</span>
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
    </PageShell>
  );
}
