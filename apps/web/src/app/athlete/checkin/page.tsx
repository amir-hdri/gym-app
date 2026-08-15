"use client";

import { useState, useEffect } from "react";
import { LogIn, LogOut, Clock } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns, useCheckIn, useCheckOut } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";

export default function CheckinPage() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useCheckIns(athleteId);
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [checkedIn, setCheckedIn] = useState(false);
  const [checkinTime, setCheckinTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayPersian = formatDate(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = currentTime.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const recentCheckins = data?.data || [];

  const handleCheckin = () => {
    if (!checkedIn) {
      setCheckedIn(true);
      setCheckinTime(new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }));
      if (athleteId) {
        checkInMutation.mutate({ userId: athleteId, branchId: "b1" });
      }
    } else {
      setCheckedIn(false);
      setCheckinTime(null);
      checkOutMutation.mutate("last");
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={error?.message} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight leading-10">چک‌این</h1>
        <p className="mt-1 text-muted-foreground">ورود و خروج خود را ثبت کنید</p>
      </div>

      <FadeIn>
        <Card glass className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-6 py-10">
          <Clock className="h-16 w-16 text-primary" />
          <div className="text-center">
            <p className="text-4xl font-bold">{timeStr}</p>
            <p className="mt-2 text-muted-foreground">{todayPersian}</p>
          </div>
          {checkedIn && checkinTime && (
            <p className="text-sm text-muted-foreground">
              زمان ورود: {checkinTime}
            </p>
          )}
          <Button
            size="xl"
            variant={checkedIn ? "destructive" : "success"}
            onClick={handleCheckin}
            className="w-full max-w-xs gap-3 backdrop-blur-xl bg-white/20 border border-white/30 shadow-xl"
          >
            {checkedIn ? (
              <>
                <LogOut className="h-5 w-5" />
                خروج (چک‌اوت)
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                ورود (چک‌این)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card glass>
        <CardHeader>
          <CardTitle>تاریخچه چک‌این‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCheckins.length === 0 ? (
            <EmptyState title="هیچ چک‌اینی ثبت نشده" description="هنوز ورودی ثبت نکرده‌اید" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 text-right font-medium">تاریخ</th>
                    <th className="py-2 text-right font-medium">ورود</th>
                    <th className="py-2 text-right font-medium">خروج</th>
                    <th className="py-2 text-right font-medium">مدت زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCheckins.map((checkin) => (
                    <tr key={checkin.id} className="border-b last:border-0">
                      <td className="py-2">{formatDate(checkin.checkInTime)}</td>
                      <td className="py-2">{new Date(checkin.checkInTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-2">{checkin.checkOutTime ? new Date(checkin.checkOutTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                      <td className="py-2">{checkin.durationMinutes ? `${Math.floor(checkin.durationMinutes / 60)}:${String(checkin.durationMinutes % 60).padStart(2, "0")}` : "---"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}
