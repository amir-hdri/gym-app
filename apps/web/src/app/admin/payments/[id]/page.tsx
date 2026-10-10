"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Printer, Download } from "lucide-react";
import { PageShell, PageHeader, MicroLabelFa } from "@/components/twilight/Page";
import { TwilightCard, CtaButton } from "@/components/twilight/controls";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { usePayment } from "@/hooks/use-api";
import { PAYMENT_METHOD } from "../../_components/admin-data";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
  completed: { label: "موفق", variant: "success" }, pending: { label: "معلق", variant: "warning" }, failed: { label: "ناموفق", variant: "destructive" },
};

const infoRow = "flex items-center justify-between gap-3 px-4 py-3.5";
const infoLabel = "text-[11px] font-semibold text-muted-foreground";
const infoValue = "text-sm font-medium text-foreground";

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = usePayment(params.id);
  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay />;
  const payment = data?.data;
  if (!payment) return <ErrorDisplay message="تراکنش یافت نشد" />;
  const status = statusConfig[payment.status];

  return (
    <PageShell>
      <div>
        <Link
          href="/admin/payments"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight strokeWidth={1.75} className="h-4 w-4" />
          بازگشت به پرداخت‌ها
        </Link>
        <PageHeader
          title="جزئیات تراکنش"
          subtitle={`کد پیگیری: ${payment.referenceId}`}
          action={
            <Badge variant={status.variant} className="px-4 py-1.5 text-sm">
              {status.label}
            </Badge>
          }
        />
      </div>

      <TwilightCard className="p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <MicroLabelFa>مبلغ</MicroLabelFa>
          <p className="font-serif text-4xl font-normal tabular-nums text-foreground">
            {formatCurrency(payment.amount)}
          </p>
        </div>
      </TwilightCard>

      <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        <div className={infoRow}>
          <span className={infoLabel}>پرداخت‌کننده</span>
          <span className={infoValue}>{payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : payment.userId}</span>
        </div>
        <div className={infoRow}>
          <span className={infoLabel}>ایمیل</span>
          <span className={infoValue} dir="ltr">{payment.user?.email}</span>
        </div>
        <div className={infoRow}>
          <span className={infoLabel}>روش پرداخت</span>
          <span className={infoValue}>{PAYMENT_METHOD[payment.method] ?? payment.method}</span>
        </div>
        <div className={infoRow}>
          <span className={infoLabel}>تاریخ</span>
          <span className={`${infoValue} tabular-nums`}>{formatDateTime(payment.paidAt || payment.createdAt)}</span>
        </div>
        <div className={infoRow}>
          <span className={infoLabel}>توضیحات</span>
          <span className="max-w-[60%] text-sm text-muted-foreground">{payment.description}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <CtaButton variant="outline" className="flex-1">
          <Printer strokeWidth={1.75} className="h-4 w-4" />
          چاپ رسید
        </CtaButton>
        <CtaButton variant="outline" className="flex-1">
          <Download strokeWidth={1.75} className="h-4 w-4" />
          دانلود PDF
        </CtaButton>
      </div>
    </PageShell>
  );
}
