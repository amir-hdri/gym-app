"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber, formatCurrency, formatDateTime } from "@/lib/utils";
import { Users, UserCheck, UserCircle, DollarSign, LogIn, AlertTriangle, Activity } from "lucide-react";
import { ScrollReveal, StaggerScroll, StaggerScrollItem } from "@/components/animations/ScrollReveal";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { useDashboardStats, usePayments } from "@/hooks/use-api";
import { RevenueChart } from "@/components/analytics/Charts";

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
    { label: "کل اعضا", value: s.totalMembers, icon: Users, color: "text-blue-600" },
    { label: "اعضای فعال", value: s.activeMembers, icon: UserCheck, color: "text-green-600" },
    { label: "مربیان", value: s.totalCoaches, icon: UserCircle, color: "text-purple-600" },
    { label: "درآمد ماهانه", value: s.monthlyRevenue, icon: DollarSign, color: "text-emerald-600", isCurrency: true },
    { label: "چک‌این امروز", value: s.todayCheckIns, icon: LogIn, color: "text-orange-600" },
    { label: "اشتراک‌های در حال انقضا", value: s.expiringMemberships, icon: AlertTriangle, color: "text-red-600" },
  ] : [];
  const recentPayments = (paymentsRes?.data || []).slice(-6);
  return (
    <div className="space-y-6">
      <ScrollReveal delay={0.1}>
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-surface p-7 text-white md:p-9">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary/25 blur-[90px]" />
          <div className="relative flex items-center justify-between">
            <div><p className="latin-kicker mb-2 flex items-center gap-2 text-activity-exercise"><Activity className="h-4 w-4" /> CLUB PULSE</p><h1 className="text-3xl font-black md:text-4xl">باشگاه در حرکت است.</h1><p className="mt-2 text-sm text-white/70">خلاصه عملکرد، اعضا و درآمد باشگاه</p></div>
          </div>
        </div>
      </ScrollReveal>

      <StaggerScroll className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
        {stats.map((stat) => (
          <StaggerScrollItem key={stat.label}>
            <Card glass hover>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-3 bg-white/70 backdrop-blur-sm border border-white/20 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {stat.isCurrency ? formatCurrency(stat.value) : formatPersianNumber(stat.value)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </StaggerScrollItem>
        ))}
      </StaggerScroll>

      <ScrollReveal delay={0.2}>
        <Card glass>
          <CardHeader><div><CardTitle>روند درآمد</CardTitle><p className="mt-1 text-xs text-muted-foreground">پرداخت‌های موفق در دوره‌های ثبت‌شده</p></div></CardHeader>
          <CardContent><RevenueChart payments={paymentsRes?.data || []} compact /></CardContent>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.3}>
        <Card glass hover>
        <CardHeader>
          <CardTitle>آخرین پرداخت‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead>روش پرداخت</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((payment) => {
                const ps = paymentStatusConfig[payment.status] || { label: payment.status, variant: "default" as const };
                return (
                <TableRow key={payment.id} className="transition-colors hover:bg-white/30">
                  <TableCell className="font-medium">{payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : payment.userId}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Badge variant={ps.variant}>{ps.label}</Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(payment.paidAt || payment.createdAt)}</TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </ScrollReveal>
    </div>
  );
}
