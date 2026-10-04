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

const paymentStatusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" }> = {
  completed: { label: "موفق", variant: "success" },
  pending: { label: "معلق", variant: "warning" },
  failed: { label: "ناموفق", variant: "destructive" },
  refunded: { label: "بازگشت داده شده", variant: "default" },
};

export default function AdminDashboard() {
  const { data: statsRes, isLoading, isError } = useDashboardStats();
  const { data: paymentsRes } = usePayments();
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const s = statsRes?.data;
  const stats = s ? [
    { label: "کل اعضا", value: s.totalMembers ?? s.totalUsers ?? 0, icon: Users, color: "text-[#d2c0a5]" },
    { label: "اعضای فعال", value: s.activeMembers ?? 0, icon: UserCheck, color: "text-[#d2c0a5]" },
    { label: "مربیان", value: s.totalCoaches ?? 0, icon: UserCircle, color: "text-primary" },
    { label: "درآمد ماهانه", value: s.monthlyRevenue ?? s.totalRevenue ?? 0, icon: DollarSign, color: "text-[#d2c0a5]", isCurrency: true },
    { label: "چک‌این امروز", value: s.todayCheckIns ?? s.todayCheckins ?? 0, icon: LogIn, color: "text-warning" },
    { label: "اشتراک‌های در حال انقضا", value: s.expiringMemberships ?? 0, icon: AlertTriangle, color: "text-destructive" },
  ] : [];
  const recentPayments = (paymentsRes?.data || []).slice(-6);
  return (
    <PageShell>
      <div className="relative h-48 overflow-hidden rounded-[26px] border border-white/10">
        <div className="absolute inset-0">
          <GymBackdrop />
        </div>
        <div className="absolute inset-0 p-6">
          <MicroLabel className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" strokeWidth={1.75} />
            CLUB PULSE
          </MicroLabel>
          <h1 className="mt-3 font-serif text-[26px] font-normal text-white">باشگاه در حرکت است.</h1>
          <p className="mt-2 text-sm text-white/70">خلاصه عملکرد، اعضا و درآمد باشگاه</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.isCurrency ? formatCurrency(stat.value) : formatPersianNumber(stat.value)}
          />
        ))}
      </div>

      <section>
        <SectionTitle>روند درآمد</SectionTitle>
        <p className="mt-1 text-xs text-[#8e98a8]">پرداخت‌های موفق در دوره‌های ثبت‌شده</p>
        <div className="mt-3 rounded-2xl border border-[#232934] bg-[#161a22] p-4">
          <RevenueChart payments={paymentsRes?.data || []} compact />
        </div>
      </section>

      <section>
        <SectionTitle>آخرین پرداخت‌ها</SectionTitle>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[#1e2430]">
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-[#8e98a8]">کاربر</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-[#8e98a8]">مبلغ</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-[#8e98a8]">روش پرداخت</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-[#8e98a8]">وضعیت</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-[#8e98a8]">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => {
                  const ps = paymentStatusConfig[payment.status] || { label: payment.status, variant: "default" as const };
                  return (
                    <tr key={payment.id} className="border-t border-[#1e2430] transition-colors hover:bg-[#1a202a]">
                      <td className="px-4 py-3 font-medium text-white">{payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : payment.userId}</td>
                      <td className="px-4 py-3 text-white">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-white">{payment.method}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[#8e98a8]">{formatDateTime(payment.paidAt || payment.createdAt)}</td>
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
