"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Printer, Download, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/FadeIn";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePayment } from "@/hooks/use-api";
import { Loading, ErrorDisplay } from "@/components/ui/DataState";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = usePayment(params.id);
  const p = data?.data;

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;
  if (!p) return <ErrorDisplay message="پرداخت یافت نشد" />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href="/athlete/membership"><ChevronRight className="h-4 w-4" /> بازگشت به عضویت</Link>
      </Button>

      <FadeIn>
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>فاکتور پرداخت</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">شماره فاکتور: {p.referenceId || p.id}</p>
            </div>
            <Badge variant={p.status === "completed" ? "success" : "secondary"} className="text-base px-4 py-1.5">{p.status === "completed" ? "موفق" : p.status}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div><p className="text-sm text-muted-foreground">تاریخ</p><p className="text-lg font-semibold">{formatDate(p.paidAt || p.createdAt)}</p></div>
                <div><p className="text-sm text-muted-foreground">روش پرداخت</p><p className="text-lg font-semibold">{p.method}</p></div>
              </div>
              <div className="space-y-4">
                <div><p className="text-sm text-muted-foreground">مبلغ</p><p className="text-3xl font-bold text-green-600">{formatCurrency(p.amount)}</p></div>
                <div><p className="text-sm text-muted-foreground">توضیحات</p><p>{p.description || "---"}</p></div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-green-50 p-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700">این پرداخت با موفقیت انجام شده است</span>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-6">
              <Button variant="outline"><Printer className="h-4 w-4" /> چاپ</Button>
              <Button variant="outline"><Download className="h-4 w-4" /> دانلود PDF</Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
