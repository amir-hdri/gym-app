"use client";

import Link from "next/link";
import { ClipboardList, CreditCard, Dumbbell } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { formatDate, formatCurrency, formatPersianNumber } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns, usePayments, useTrainingPrograms } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { SessionDurationChart } from "@/components/analytics/Charts";
import { paymentMethodLabels, paymentStatusConfig } from "../payment-meta";

function formatClock(value: string) {
  return new Date(value).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes?: number) {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0
    ? `${formatPersianNumber(hours)}:${formatPersianNumber(String(rest).padStart(2, "0"))}`
    : `${formatPersianNumber(rest)} دقیقه`;
}

const programStatusLabels: Record<string, string> = {
  draft: "پیش‌نویس",
  active: "فعال",
  completed: "تکمیل شده",
  archived: "بایگانی",
};

export default function HistoryPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const checkins = useCheckIns(userId);
  const payments = usePayments(userId);
  const programs = useTrainingPrograms();

  const checkinHistory = checkins.data?.data ?? [];
  const paymentHistory = payments.data?.data ?? [];
  const programHistory = programs.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2>تاریخچه</h2>
        <p className="mt-1 leading-6 text-muted-foreground">سوابق حضور، تمرین و پرداخت شما</p>
      </div>

      <Tabs defaultValue="checkins" dir="rtl">
        <TabsList className="w-full">
          <TabsTrigger value="checkins" className="flex-1">
            چک‌این‌ها
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex-1">
            برنامه‌ها
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-1">
            پرداخت‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkins">
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>تاریخچه چک‌این‌ها</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">مدت جلسات تکمیل‌شده</p>
              </CardHeader>
              <CardContent>
                {checkins.isLoading ? (
                  <Loading />
                ) : checkins.isError ? (
                  <ErrorDisplay message={checkins.error?.message} onRetry={checkins.refetch} />
                ) : checkinHistory.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardList className="h-7 w-7" />}
                    title="چک‌اینی ثبت نشده"
                    description="اولین ورود خود را از صفحه چک‌این ثبت کنید."
                    action={
                      <Button asChild variant="outline">
                        <Link href="/athlete/checkin">رفتن به چک‌این</Link>
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-6">
                    <SessionDurationChart checkIns={checkinHistory} />
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>تاریخ</TableHead>
                            <TableHead>ورود</TableHead>
                            <TableHead>خروج</TableHead>
                            <TableHead>مدت</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {checkinHistory.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{formatDate(item.checkInTime)}</TableCell>
                              <TableCell>{formatClock(item.checkInTime)}</TableCell>
                              <TableCell>
                                {item.checkOutTime ? formatClock(item.checkOutTime) : "در جریان"}
                              </TableCell>
                              <TableCell>{formatDuration(item.durationMinutes)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        <TabsContent value="programs">
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>برنامه‌های تمرینی</CardTitle>
              </CardHeader>
              <CardContent>
                {programs.isLoading ? (
                  <Loading />
                ) : programs.isError ? (
                  <ErrorDisplay message={programs.error?.message} onRetry={programs.refetch} />
                ) : programHistory.length === 0 ? (
                  <EmptyState
                    icon={<Dumbbell className="h-7 w-7" />}
                    title="برنامه تمرینی ثبت نشده"
                    description="هنوز مربی شما برنامه‌ای تنظیم نکرده است."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>برنامه</TableHead>
                          <TableHead>بازه</TableHead>
                          <TableHead>حرکات</TableHead>
                          <TableHead>وضعیت</TableHead>
                          <TableHead className="w-20">جزئیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(item.startDate)} — {formatDate(item.endDate)}
                            </TableCell>
                            <TableCell>
                              {formatPersianNumber(item.exercises?.length ?? 0)} حرکت ·{" "}
                              {formatPersianNumber(item.frequencyPerWeek)} روز در هفته
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.status === "active" ? "success" : "secondary"}>
                                {programStatusLabels[item.status] ?? item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/athlete/programs/${item.id}`}
                                className="ring-focus rounded-md text-sm font-bold text-primary hover:underline"
                              >
                                مشاهده
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        <TabsContent value="payments">
          <FadeIn>
            <Card>
              <CardHeader>
                <CardTitle>تاریخچه پرداخت‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.isLoading ? (
                  <Loading />
                ) : payments.isError ? (
                  <ErrorDisplay message={payments.error?.message} onRetry={payments.refetch} />
                ) : paymentHistory.length === 0 ? (
                  <EmptyState
                    icon={<CreditCard className="h-7 w-7" />}
                    title="پرداختی ثبت نشده"
                    description="سوابق پرداخت اشتراک شما اینجا نمایش داده می‌شود."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>تاریخ</TableHead>
                          <TableHead>مبلغ</TableHead>
                          <TableHead>روش پرداخت</TableHead>
                          <TableHead>وضعیت</TableHead>
                          <TableHead className="w-20">جزئیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.map((item) => {
                          const status = paymentStatusConfig[item.status];
                          return (
                            <TableRow key={item.id}>
                              <TableCell>{formatDate(item.paidAt || item.createdAt)}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                              <TableCell>{paymentMethodLabels[item.method] ?? item.method}</TableCell>
                              <TableCell>
                                <Badge variant={status.variant}>{status.label}</Badge>
                              </TableCell>
                              <TableCell>
                                <Link
                                  href={`/athlete/membership/payments/${item.id}`}
                                  className="ring-focus rounded-md text-sm font-bold text-primary hover:underline"
                                >
                                  مشاهده
                                </Link>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </div>
  );
}
