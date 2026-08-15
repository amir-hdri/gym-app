"use client";

import { FadeIn } from "@/components/animations/FadeIn";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns, usePayments, useTrainingPrograms } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { SessionDurationChart } from "@/components/analytics/Charts";

export default function HistoryPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: checkinsData, isLoading: checkinsLoading, isError: checkinsError, error: checkinsErr } = useCheckIns(userId);
  const { data: paymentsData, isLoading: paymentsLoading, isError: paymentsError, error: paymentsErr } = usePayments(userId);
  const { data: programsData, isLoading: programsLoading, isError: programsError, error: programsErr } = useTrainingPrograms();

  const checkinHistory = checkinsData?.data || [];
  const paymentHistory = paymentsData?.data || [];
  const workoutHistory = programsData?.data || [];

  const checkinsLoadingOrError = checkinsLoading || checkinsError;
  const paymentsLoadingOrError = paymentsLoading || paymentsError;
  const programsLoadingOrError = programsLoading || programsError;

  if (checkinsLoading && paymentsLoading && programsLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">تاریخچه</h1>
        <p className="mt-1 text-muted-foreground">سوابق فعالیت‌های شما</p>
      </div>

      <Tabs defaultValue="checkins" dir="rtl">
        <TabsList className="bg-white/40 backdrop-blur-xl border border-white/30">
          <TabsTrigger value="checkins">چک‌این‌ها</TabsTrigger>
          <TabsTrigger value="workouts">تمرینات</TabsTrigger>
          <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="checkins">
          <FadeIn>
          <Card glass>
            <CardHeader>
              <div><CardTitle>تاریخچه چک‌این‌ها</CardTitle><p className="mt-1 text-xs text-muted-foreground">مدت جلسات تکمیل‌شده</p></div>
            </CardHeader>
            <CardContent>
              {checkinsLoadingOrError ? (
                checkinsLoading ? <Loading /> : <ErrorDisplay message={checkinsErr?.message} />
              ) : checkinHistory.length === 0 ? (
                <EmptyState title="چک‌اینی ثبت نشده" description="هنوز ورودی ثبت نکرده‌اید" />
              ) : (
                <div className="space-y-6">
                  <SessionDurationChart checkIns={checkinHistory} />
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                <th className="py-2 text-right font-medium whitespace-nowrap">تاریخ</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">ورود</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">خروج</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">مدت زمان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkinHistory.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2">{formatDate(item.checkInTime)}</td>
                          <td className="py-2">{new Date(item.checkInTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="py-2">{item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                          <td className="py-2">{item.durationMinutes ? `${Math.floor(item.durationMinutes / 60)}:${String(item.durationMinutes % 60).padStart(2, "0")}` : "---"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        </TabsContent>

        <TabsContent value="workouts">
          <FadeIn>
          <Card glass>
            <CardHeader>
              <CardTitle>تاریخچه تمرینات</CardTitle>
            </CardHeader>
            <CardContent>
              {programsLoadingOrError ? (
                programsLoading ? <Loading /> : <ErrorDisplay message={programsErr?.message} />
              ) : workoutHistory.length === 0 ? (
                <EmptyState title="برنامه تمرینی ثبت نشده" description="هنوز برنامه تمرینی ندارید" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                <th className="py-2 text-right font-medium whitespace-nowrap">تاریخ</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">برنامه</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">تمرینات</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">مدت زمان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workoutHistory.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2">{formatDate(item.startDate)}</td>
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">{item.exercises?.length || 0} تمرین</td>
                          <td className="py-2">{item.frequencyPerWeek} روز/هفته</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        </TabsContent>

        <TabsContent value="payments">
          <FadeIn>
          <Card glass>
            <CardHeader>
              <CardTitle>تاریخچه پرداخت‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoadingOrError ? (
                paymentsLoading ? <Loading /> : <ErrorDisplay message={paymentsErr?.message} />
              ) : paymentHistory.length === 0 ? (
                <EmptyState title="پرداختی ثبت نشده" description="هنوز پرداختی انجام نداده‌اید" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                <th className="py-2 text-right font-medium whitespace-nowrap">تاریخ</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">مبلغ</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">روش پرداخت</th>
                <th className="py-2 text-right font-medium whitespace-nowrap">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2">{formatDate(item.paidAt || item.createdAt)}</td>
                          <td className="py-2">{formatCurrency(item.amount)}</td>
                          <td className="py-2">{item.method}</td>
                          <td className="py-2">
                            <Badge variant={item.status === "completed" ? "success" : "secondary"}>{item.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
