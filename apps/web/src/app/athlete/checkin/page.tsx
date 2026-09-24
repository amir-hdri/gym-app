"use client";

import { useState, useEffect, useMemo } from "react";
import { LogIn, LogOut, Clock } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns, useCheckIn, useCheckOut, useBranches } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";

export default function CheckinPage() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useCheckIns(athleteId);
  const { data: branchesData } = useBranches();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [localCheckedIn, setLocalCheckedIn] = useState(false);
  const [localCheckinTime, setLocalCheckinTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const branches: { id: string; name: string }[] = useMemo(() => {
    const d = branchesData as unknown;
    if (d && typeof d === "object" && "data" in (d as Record<string, unknown>)) return ((d as { data: { id: string; name: string }[] }).data) || [];
    if (Array.isArray(d)) return d as { id: string; name: string }[];
    return [];
  }, [branchesData]);
  const [branchId, setBranchId] = useState<string>("");

  const recentCheckins = useMemo(() => {
    const raw = (data as unknown as { data?: unknown })?.data;
    return Array.isArray(raw) ? raw as { id: string; checkInTime: string; checkOutTime?: string | null; durationMinutes?: number }[] : [];
  }, [data]);
  const openCheckin = useMemo(
    () => recentCheckins.find((c) => !c.checkOutTime),
    [recentCheckins]
  );
  const checkedIn = !!openCheckin || localCheckedIn;
  const checkinTime = openCheckin
    ? new Date(openCheckin.checkInTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    : localCheckinTime;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const defaultBranchId = useMemo(() => user?.branchId || branches[0]?.id || "", [user?.branchId, branches]);
  const effectiveBranchId = branchId || defaultBranchId;

  const todayPersian = formatDate(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = currentTime.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const handleCheckin = () => {
    if (!checkedIn) {
      setLocalCheckedIn(true);
      setLocalCheckinTime(new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }));
      if (athleteId && effectiveBranchId) {
        checkInMutation.mutate({ userId: athleteId, branchId: effectiveBranchId }, {
          onSuccess: () => { setLocalCheckedIn(false); setLocalCheckinTime(null); },
          onError: () => { setLocalCheckedIn(false); setLocalCheckinTime(null); }
        });
      }
    } else {
      setLocalCheckedIn(false);
      setLocalCheckinTime(null);
      const targetId = openCheckin?.id;
      if (targetId) checkOutMutation.mutate(targetId);
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={(error as Error)?.message} />;

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
            <p className="text-4xl font-bold tabular-nums">{timeStr}</p>
            <p className="mt-2 text-muted-foreground">{todayPersian}</p>
          </div>
          {branches.length > 0 && (
            <div className="w-full max-w-xs">
              <label className="mb-1.5 block text-xs text-muted-foreground">شعبه</label>
              <Select value={effectiveBranchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب شعبه" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b:{id:string;name:string})=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {checkedIn && checkinTime && <p className="text-sm text-muted-foreground">زمان ورود: {checkinTime}</p>}
          <Button
            size="xl"
            variant={checkedIn ? "destructive" : "success"}
            onClick={handleCheckin}
            className="w-full max-w-xs gap-3 backdrop-blur-xl bg-white/20 border border-white/30 shadow-xl"
            disabled={checkInMutation.isPending || checkOutMutation.isPending || (!checkedIn && !effectiveBranchId)}
          >
            {checkedIn ? <><LogOut className="h-5 w-5" />خروج (چک‌اوت)</> : <><LogIn className="h-5 w-5" />ورود (چک‌این)</>}
          </Button>
          {(checkInMutation.isError || checkOutMutation.isError) && (
            <p className="text-sm text-destructive text-center">
              {(checkInMutation.error as Error)?.message || (checkOutMutation.error as Error)?.message || "خطایی رخ داد"}
            </p>
          )}
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
                    <th scope="col" className="py-2 text-right font-medium">تاریخ</th>
                    <th scope="col" className="py-2 text-right font-medium">ورود</th>
                    <th scope="col" className="py-2 text-right font-medium">خروج</th>
                    <th scope="col" className="py-2 text-right font-medium">مدت زمان</th>
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
