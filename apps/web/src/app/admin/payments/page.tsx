"use client";

import Link from "next/link";
import { PageShell, PageHeader, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard, StatCard, EmptyState } from "@/components/twilight/controls";
import { Badge } from "@/components/ui/Badge";
import { formatPersianNumber, formatCurrency, formatDateTime } from "@/lib/utils";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { usePayments } from "@/hooks/use-api";
import { RevenueChart } from "@/components/analytics/Charts";
import { PaymentRowActions } from "../_components/PaymentSheets";
import { ReceiptText } from "lucide-react";

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

const tableHeadCell = "whitespace-nowrap px-4 py-3 text-right align-middle text-[10px] font-semibold text-muted-foreground";
const tableCell = "px-4 py-3 align-middle";

export default function PaymentsPage() {
  const { data, isLoading, isError, refetch } = usePayments();
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay onRetry={refetch} />;
  const payments = data?.data || [];
  const totalRevenue = payments.reduce((sum: number, p) => sum + (p.status === "completed" ? p.amount : 0), 0);
  const totalPending = payments.reduce((sum: number, p) => sum + (p.status === "pending" ? p.amount : 0), 0);
  return (
    <PageShell>
      <PageHeader
        title="پرداخت‌ها"
        subtitle="مدیریت تراکنش‌های مالی باشگاه"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="کل درآمد (موفق)"
          value={<span className="text-primary">{formatCurrency(totalRevenue)}</span>}
        />
        <StatCard
          label="درآمد در انتظار"
          value={<span className="text-primary">{formatCurrency(totalPending)}</span>}
        />
        <StatCard
          label="تعداد تراکنش‌ها"
          value={formatPersianNumber(payments.length)}
        />
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>روند درآمد موفق</SectionTitle>
        <TwilightCard>
          <p className="mb-4 text-xs text-muted-foreground">بر اساس تاریخ پرداخت‌های تکمیل‌شده</p>
          <RevenueChart payments={payments} />
        </TwilightCard>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>لیست تراکنش‌ها</SectionTitle>
        {payments.length === 0 ? (
          <EmptyState
            icon={<ReceiptText strokeWidth={1.75} className="h-5 w-5" />}
            title="هیچ تراکنشی یافت نشد"
            description="هنوز هیچ پرداختی ثبت نشده است"
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm leading-6">
                <thead>
                  <tr>
                    <th scope="col" className={tableHeadCell}>ردیف</th>
                    <th scope="col" className={tableHeadCell}>کاربر</th>
                    <th scope="col" className={tableHeadCell}>مبلغ</th>
                    <th scope="col" className={tableHeadCell}>روش پرداخت</th>
                    <th scope="col" className={tableHeadCell}>وضعیت</th>
                    <th scope="col" className={tableHeadCell}>تاریخ</th>
                    <th scope="col" className={tableHeadCell}>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => (
                    <tr key={payment.id} className="border-t border-border transition-colors hover:bg-secondary">
                      <td className={tableCell}>{formatPersianNumber(idx + 1)}</td>
                      <td className={`${tableCell} font-medium text-foreground`}>{payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : payment.userId}</td>
                      <td className={`${tableCell} font-medium tabular-nums text-foreground`}>{formatCurrency(payment.amount)}</td>
                      <td className={tableCell}>
                        <Badge variant={methodVariants[payment.method]}>
                          {methodLabels[payment.method]}
                        </Badge>
                      </td>
                      <td className={tableCell}>
                        <Badge variant={statusLabels[payment.status].variant}>
                          {statusLabels[payment.status].label}
                        </Badge>
                      </td>
                      <td className={`${tableCell} whitespace-nowrap text-muted-foreground`}>{formatDateTime(payment.paidAt || payment.createdAt)}</td>
                      <td className={tableCell}>
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/payments/${payment.id}`} aria-label={`جزئیات تراکنش ${formatCurrency(payment.amount)} — ${payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : payment.userId}`} className="min-h-11 inline-flex items-center px-2 text-sm font-medium text-primary hover:underline">جزئیات</Link>
                          <PaymentRowActions payment={payment} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
