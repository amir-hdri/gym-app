"use client";

import { useState, useEffect, useMemo } from "react";
import { LogIn, LogOut, Timer, QrCode, Building2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns, useCheckIn, useCheckOut, useBranches } from "@/hooks/use-api";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { PageShell, PageHeader, MicroLabelFa, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard, CtaButton } from "@/components/twilight/controls";
import { soundEngine } from "@/services/soundEngine";

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
  const effectiveBranchName = branches.find((b) => b.id === effectiveBranchId)?.name || user?.branchName || "";

  const todayPersian = formatDate(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = currentTime.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  const handleCheckin = () => {
    if (!checkedIn) {
      soundEngine.playBell(528);
      setLocalCheckedIn(true);
      setLocalCheckinTime(new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }));
      if (athleteId && effectiveBranchId) {
        checkInMutation.mutate({ userId: athleteId, branchId: effectiveBranchId }, {
          onSuccess: () => { setLocalCheckedIn(false); setLocalCheckinTime(null); },
          onError: () => { setLocalCheckedIn(false); setLocalCheckinTime(null); }
        });
      }
    } else {
      soundEngine.playBell(440);
      setLocalCheckedIn(false);
      setLocalCheckinTime(null);
      const targetId = openCheckin?.id;
      if (targetId) checkOutMutation.mutate(targetId);
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={(error as Error)?.message} />;

  return (
    <PageShell className="mx-auto max-w-xl">
      <PageHeader
        title="چک‌این و ورود به باشگاه"
        subtitle="ثبت ورود خودکار با اسکن QR و مدیریت زمان تمرین"
      />

      {/* Digital pass card */}
      <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[26px] border border-[#232934] bg-[#141820] p-6 shadow-2xl">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#d2c0a5]/5 blur-2xl" />

        <div className="flex w-full items-center justify-between text-xs">
          <MicroLabelFa className="text-[#d2c0a5]">کارت عضویت دیجیتال</MicroLabelFa>
          <span className="rounded-full border border-[#d2c0a5]/40 bg-[#1e2532] px-2.5 py-0.5 text-[10px] font-semibold text-[#d2c0a5]">
            {checkedIn ? "جلسه در حال انجام" : "آماده ثبت"}
          </span>
        </div>

        {/* Simulated QR graphic */}
        <div className="relative my-2 rounded-2xl border-2 border-[#d2c0a5]/60 bg-white/95 p-3 shadow-xl">
          <div className="relative flex h-40 w-40 flex-col justify-between overflow-hidden rounded-xl bg-[#121417] p-2.5">
            <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-1 opacity-90">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-xs ${(i % 2 === 0 || i % 7 === 0 || i < 6 || i > 30) ? "bg-[#d2c0a5]" : "bg-[#202732]"}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d2c0a5] bg-[#121417] shadow-lg">
                <QrCode className="h-5 w-5 text-[#d2c0a5]" strokeWidth={1.75} />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-semibold text-white">{fullName || "ورزشکار"}</h3>
          <p className="mt-0.5 font-sans text-[11px] text-[#8e98a8]">
            {effectiveBranchName || todayPersian}
          </p>
        </div>

        <CtaButton
          variant={checkedIn ? "outline" : "cream"}
          onClick={handleCheckin}
          disabled={checkInMutation.isPending || checkOutMutation.isPending || (!checkedIn && !effectiveBranchId)}
        >
          {checkedIn ? (
            <>
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              <span>خروج (چک‌اوت)</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" strokeWidth={1.75} />
              <span>ورود (چک‌این)</span>
            </>
          )}
        </CtaButton>
        {(checkInMutation.isError || checkOutMutation.isError) && (
          <p className="text-center text-sm text-destructive">
            {(checkInMutation.error as Error)?.message || (checkOutMutation.error as Error)?.message || "خطایی رخ داد"}
          </p>
        )}
      </div>

      {/* Session timer box */}
      <TwilightCard className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#2c3748] bg-[#202734] text-[#d2c0a5]">
            <Timer className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-xs font-semibold text-white">مدت زمان حضور امروز</span>
            <p className="text-[10px] text-[#8e98a8]">
              {checkedIn && checkinTime ? `زمان ورود: ${checkinTime}` : todayPersian}
            </p>
          </div>
        </div>
        <span className="font-sans text-xl font-bold tabular-nums text-[#d2c0a5]">{timeStr}</span>
      </TwilightCard>

      {/* Branch selector — hidden when only one branch exists (single-branch rule) */}
      {branches.length > 1 && (
        <TwilightCard className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-white">
              <Building2 className="h-4 w-4 text-[#d2c0a5]" strokeWidth={1.75} />
              انتخاب شعبه باشگاه
            </span>
            <span className="text-[10px] text-[#8e98a8]">{branches.length} شعبه فعال</span>
          </div>
          <div>
            <MicroLabelFa className="mb-1.5 block">شعبه</MicroLabelFa>
            <Select value={effectiveBranchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب شعبه" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b: { id: string; name: string }) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </TwilightCard>
      )}

      {/* Recent checkins */}
      <div className="flex flex-col gap-3">
        <SectionTitle>تاریخچه چک‌این‌های اخیر</SectionTitle>
        {recentCheckins.length === 0 ? (
          <EmptyState title="هیچ چک‌اینی ثبت نشده" description="هنوز ورودی ثبت نکرده‌اید" />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#232934] bg-[#161a22]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[#8e98a8]">
                    <th scope="col" className="whitespace-nowrap py-3 pr-4 text-right font-medium">تاریخ</th>
                    <th scope="col" className="whitespace-nowrap py-3 text-right font-medium">ورود</th>
                    <th scope="col" className="whitespace-nowrap py-3 text-right font-medium">خروج</th>
                    <th scope="col" className="whitespace-nowrap py-3 pl-4 text-right font-medium">مدت زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCheckins.map((checkin) => (
                    <tr key={checkin.id} className="border-t border-[#1e2430] transition-colors hover:bg-[#1a202a]">
                      <td className="whitespace-nowrap py-2.5 pr-4 text-white">{formatDate(checkin.checkInTime)}</td>
                      <td className="whitespace-nowrap py-2.5 tabular-nums text-[#c9cfd9]">{new Date(checkin.checkInTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="whitespace-nowrap py-2.5 tabular-nums text-[#c9cfd9]">{checkin.checkOutTime ? new Date(checkin.checkOutTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                      <td className="whitespace-nowrap py-2.5 pl-4 tabular-nums text-[#c9cfd9]">{checkin.durationMinutes ? `${Math.floor(checkin.durationMinutes / 60)}:${String(checkin.durationMinutes % 60).padStart(2, "0")}` : "---"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
