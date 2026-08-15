"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/Table";
import { formatPersianNumber, formatCurrency, formatDateTime } from "@/lib/utils";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { usePayments } from "@/hooks/use-api";
import { RevenueChart } from "@/components/analytics/Charts";

const methodLabels: Record<string, string> = {
  card: "کارت",
  cash: "نقدی",
  wallet: "کیف پول",
  bank_transfer: "حواله بانکی",
};

const methodVariants: Record<string, "default" | "secondary" | "outline" | "info"> = {
  card: "default",
  cash: "secondary",
  wallet: "info",
  bank_transfer: "outline",
};

const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  completed: { label: "موفق", variant: "success" },
  pending: { label: "معلق", variant: "warning" },
  failed: { label: "ناموفق", variant: "destructive" },
  refunded: { label: "بازگشت داده شده", variant: "secondary" },
};

export default function PaymentsPage() {
  const { data, isLoading, isError } = usePayments();
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const payments = data?.data || [];
  const totalRevenue = payments.reduce((sum: number, p) => sum + (p.status === "completed" ? p.amount : 0), 0);
  const totalPending = payments.reduce((sum: number, p) => sum + (p.status === "pending" ? p.amount : 0), 0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">پرداخت‌ها</h1>
        <p className="text-muted-foreground">مدیریت تراکنش‌های مالی باشگاه</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card glass>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">کل درآمد (موفق)</p>
            <p className="inline-block rounded-lg bg-white/70 backdrop-blur-sm border border-white/20 px-3 py-1 text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card glass>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">درآمد در انتظار</p>
            <p className="inline-block rounded-lg bg-white/70 backdrop-blur-sm border border-white/20 px-3 py-1 text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        <Card glass>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">تعداد تراکنش‌ها</p>
            <p className="inline-block rounded-lg bg-white/70 backdrop-blur-sm border border-white/20 px-3 py-1 text-2xl font-bold">{formatPersianNumber(payments.length)}</p>
          </CardContent>
        </Card>
      </div>

      <Card glass>
        <CardHeader>
          <div>
            <CardTitle>روند درآمد موفق</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">بر اساس تاریخ پرداخت‌های تکمیل‌شده</p>
          </div>
        </CardHeader>
        <CardContent><RevenueChart payments={payments} /></CardContent>
      </Card>

      <Card glass>
        <CardHeader>
          <CardTitle>لیست تراکنش‌ها</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <EmptyState title="هیچ تراکنشی یافت نشد" description="هنوز هیچ پرداختی ثبت نشده است" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ردیف</TableHead>
                  <TableHead>کاربر</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>روش پرداخت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead className="w-24">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, idx) => (
                  <TableRow key={payment.id} className="transition-colors hover:bg-white/30">
                    <TableCell>{formatPersianNumber(idx + 1)}</TableCell>
                    <TableCell className="font-medium">{payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : payment.userId}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={methodVariants[payment.method]}>
                        {methodLabels[payment.method]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[payment.status].variant}>
                        {statusLabels[payment.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(payment.paidAt || payment.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/payments/${payment.id}`} className="text-sm text-primary hover:underline">جزئیات</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
