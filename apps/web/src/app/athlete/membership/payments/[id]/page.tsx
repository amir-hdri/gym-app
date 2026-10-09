"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Printer, Download, CheckCircle, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, formatPersianNumber } from "@/lib/utils";
import { usePayment } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";
import { PageShell, PageHeader, SectionTitle, MicroLabelFa } from "@/components/twilight/Page";
import { TwilightCard } from "@/components/twilight/controls";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = usePayment(params.id);
  const p = data?.data;

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;
  if (!p) return <ErrorDisplay message="پرداخت یافت نشد" />;

  const isCompleted = p.status === "completed";

  return (
    <PageShell>
      <Button variant="ghost" size="sm" asChild className="self-start">
        <Link href="/athlete/membership">
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} /> بازگشت به عضویت
        </Link>
      </Button>

      <PageHeader
        title="فاکتور پرداخت"
        subtitle={`شماره فاکتور: ${p.referenceId || p.id}`}
        action={
          <Badge variant={isCompleted ? "success" : "secondary"} className="px-4 py-1.5 text-sm">
            {isCompleted ? "موفق" : p.status}
          </Badge>
        }
      />

      <TwilightCard className="p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-secondary text-primary shadow-lg">
            <Receipt className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <p className="font-sans text-3xl font-normal tabular-nums text-foreground">
            {formatCurrency(p.amount)}
          </p>
          <MicroLabelFa>مبلغ پرداخت</MicroLabelFa>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border pt-6 md:grid-cols-2">
          <div className="space-y-1">
            <MicroLabelFa>تاریخ</MicroLabelFa>
            <p className="text-sm font-medium text-foreground">{formatDate(p.paidAt || p.createdAt)}</p>
          </div>
          <div className="space-y-1">
            <MicroLabelFa>روش پرداخت</MicroLabelFa>
            <p className="text-sm font-medium text-foreground">{p.method}</p>
          </div>
          <div className="space-y-1">
            <MicroLabelFa>وضعیت</MicroLabelFa>
            <p className="text-sm font-medium text-foreground">{isCompleted ? "موفق" : p.status}</p>
          </div>
          <div className="space-y-1">
            <MicroLabelFa>توضیحات</MicroLabelFa>
            <p className="text-sm text-muted-foreground">{p.description || "---"}</p>
          </div>
        </div>

        {isCompleted && (
          <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-primary/40 bg-card p-4">
            <CheckCircle className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <span className="text-sm text-foreground">این پرداخت با موفقیت انجام شده است</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
          <Button variant="outline">
            <Printer className="h-4 w-4" strokeWidth={1.75} /> چاپ
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4" strokeWidth={1.75} /> دانلود PDF
          </Button>
        </div>
      </TwilightCard>

      <section className="flex flex-col gap-3">
        <SectionTitle>خلاصه</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <MicroLabelFa>شماره پیگیری</MicroLabelFa>
            <p className="mt-2 break-all font-sans text-sm text-foreground" dir="ltr">
              {p.referenceId || p.id}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <MicroLabelFa>مبلغ به عدد</MicroLabelFa>
            <p className="mt-2 font-sans text-sm tabular-nums text-foreground">
              {formatPersianNumber(p.amount)}
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
