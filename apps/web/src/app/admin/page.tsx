"use client";

import { Badge } from "@/components/ui/Badge";
import { formatPersianNumber, formatCurrency, formatDateTime } from "@/lib/utils";
import { Users, UserCheck, UserCircle, DollarSign, LogIn, AlertTriangle, Activity } from "lucide-react";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useDashboardStats, usePayments } from "@/hooks/use-api";
import { RevenueChart } from "@/components/analytics/Charts";
import { PageShell, SectionTitle, MicroLabel } from "@/components/twilight/Page";
import { StatCard } from "@/components/twilight/controls";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";
import { PAYMENT_METHOD, PAYMENT_STATUS } from "./_components/admin-data";

export default function AdminDashboard() {
  const { data: statsRes, isLoading, isError } = useDashboardStats();
  const { data: paymentsRes } = usePayments();
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const s = statsRes?.data;
  // `member` flags the MEMBER's own living data for the blush wash — staff
  // aggregates, finance and alert counts stay neutral.
  const stats = s ? [
    { label: "کل اعضا", value: s.totalMembers ?? s.totalUsers ?? 0, icon: Users, color: "text-primary", member: true },
    { label: "اعضای فعال", value: s.activeMembers ?? 0, icon: UserCheck, color: "text-primary", member: true },
    { label: "مربیان", value: s.totalCoaches ?? 0, icon: UserCircle, color: "text-primary", member: false },
    { label: "درآمد ماهانه", value: s.monthlyRevenue ?? s.totalRevenue ?? 0, icon: DollarSign, color: "text-primary", isCurrency: true, member: false },
    { label: "چک‌این امروز", value: s.todayCheckIns ?? s.todayCheckins ?? 0, icon: LogIn, color: "text-warning", member: true },
    { label: "اشتراک‌های در حال انقضا", value: s.expiringMemberships ?? 0, icon: AlertTriangle, color: "text-destructive", member: false },
  ] : [];
  const recentPayments = (paymentsRes?.data || []).slice(-6);
  return (
    <PageShell>
      <div className="relative h-48 overflow-hidden rounded-[26px] border border-logo-ink-inverse/10">
        <div className="absolute inset-0">
          <GymBackdrop />
        </div>
        <div className="absolute inset-0 p-6">
          <MicroLabel className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" strokeWidth={1.75} />
            CLUB PULSE
          </MicroLabel>
          <h1 className="mt-3 font-serif text-[26px] font-normal text-logo-ink-inverse">باشگاه در حرکت است.</h1>
          <p className="mt-2 text-sm text-logo-ink-inverse/70">خلاصه عملکرد، اعضا و درآمد باشگاه</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.isCurrency ? formatCurrency(stat.value) : formatPersianNumber(stat.value)}
            tone={stat.member ? "blush" : "default"}
          />
        ))}
      </div>

      <section>
        <SectionTitle>روند درآمد</SectionTitle>
        <p className="mt-1 text-xs text-muted-foreground">پرداخت‌های موفق در دوره‌های ثبت‌شده</p>
        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <RevenueChart payments={paymentsRes?.data || []} compact />
        </div>
      </section>

      <section>
        <SectionTitle>آخرین پرداخت‌ها</SectionTitle>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground">کاربر</th>
                  <th scope="col" className="px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground">مبلغ</th>
                  <th scope="col" className="px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground">روش پرداخت</th>
                  <th scope="col" className="px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground">وضعیت</th>
                  <th scope="col" className="px-4 py-3 text-right text-[10px] font-semibold text-muted-foreground">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => {
                  const ps = PAYMENT_STATUS[payment.status] ?? { label: payment.status, variant: "default" as const };
                  return (
                    <tr key={payment.id} className="border-t border-border transition-colors hover:bg-secondary">
                      <td className="px-4 py-3 font-medium text-foreground">{payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : payment.userId}</td>
                      <td className="px-4 py-3 text-foreground">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-foreground">{PAYMENT_METHOD[payment.method] ?? payment.method}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(payment.paidAt || payment.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
