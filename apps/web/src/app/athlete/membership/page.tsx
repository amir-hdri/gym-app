"use client";

import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber, formatCurrency, formatDate, calculateProgress } from "@/lib/utils";
import { CreditCard, Calendar, Award, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMemberships, usePayments } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";

export default function MembershipPage() {
  const { user } = useAuth();
  const athleteId = user?.id;

  const { data: membershipsData, isLoading: membershipsLoading, isError: membershipsError, error: membershipsErr } = useMemberships();
  const { data: paymentsData, isLoading: paymentsLoading, isError: paymentsError, error: paymentsErr } = usePayments(athleteId);

  const allMemberships = membershipsData?.data || [];
  const membership = allMemberships.find((m) => m.userId === user?.id) || allMemberships[0];
  const payments = paymentsData?.data || [];

  if (membershipsLoading || paymentsLoading) return <Loading />;
  if (membershipsError) return <ErrorDisplay message={membershipsErr?.message} />;
  if (paymentsError) return <ErrorDisplay message={paymentsErr?.message} />;

  if (!membership) {
    return (
      <div className="space-y-6">
        <div>
        <h1 className="text-3xl font-bold tracking-tight leading-10">عضویت و پرداخت</h1>
          <p className="mt-1 text-muted-foreground">وضعیت اشتراک و سوابق پرداخت</p>
        </div>
        <EmptyState
          title="اشتراک فعالی وجود ندارد"
          description="شما هنوز اشتراکی خریداری نکرده‌اید"
        />
      </div>
    );
  }

  const remaining = membership.sessionsRemaining;
  const progress = calculateProgress(membership.sessionsUsed, membership.sessionsTotal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">عضویت و پرداخت</h1>
        <p className="mt-1 text-muted-foreground">وضعیت اشتراک و سوابق پرداخت</p>
      </div>

      <FadeIn>
        <Card glass>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{membership.plan?.name || "اشتراک"}</h2>
                  <Badge variant={membership.status === "active" ? "success" : "secondary"}>
                    {membership.status === "active" ? "فعال" : membership.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />شروع: {formatDate(membership.startDate)}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />پایان: {formatDate(membership.endDate)}</span>
                  <span className="flex items-center gap-1"><CreditCard className="h-4 w-4" />مبلغ: {formatCurrency(membership.finalPrice)}</span>
                </div>
              </div>
              <div className="shrink-0 rounded-lg bg-white/70 p-3 text-center backdrop-blur-sm border border-white/20">
                <p className="text-3xl font-bold text-green-600">{formatPersianNumber(remaining)}</p>
                <p className="text-xs text-muted-foreground">جلسه باقی‌مانده</p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">جلسات استفاده شده</span>
                <span>{formatPersianNumber(membership.sessionsUsed)} / {formatPersianNumber(membership.sessionsTotal)}</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">جلسات باقی‌مانده</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPersianNumber(remaining)}</div>
              <p className="text-xs text-muted-foreground">از {formatPersianNumber(membership.sessionsTotal)} جلسه</p>
            </CardContent>
          </Card>
          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">وضعیت اشتراک</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">فعال</div>
              <p className="text-xs text-muted-foreground">تا {formatDate(membership.endDate)}</p>
            </CardContent>
          </Card>
          <Card glass hover>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">پرداخت بعدی</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDate(membership.endDate)}</div>
              <p className="text-xs text-muted-foreground">تاریخ سررسید</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card glass>
          <CardHeader><CardTitle>تاریخچه پرداخت‌ها</CardTitle></CardHeader>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <EmptyState title="پرداختی ثبت نشده" description="هنوز پرداختی انجام نداده‌اید" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>روش پرداخت</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead className="w-20">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell><Badge variant={p.status === "completed" ? "success" : "secondary"}>{p.status === "completed" ? "موفق" : p.status}</Badge></TableCell>
                      <TableCell>{formatDate(p.paidAt || p.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/athlete/membership/payments/${p.id}`} className="text-sm text-primary hover:underline">جزئیات</Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
