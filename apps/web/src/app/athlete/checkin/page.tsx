"use client";

import { useState, useEffect, useMemo } from "react";
import { LogIn, LogOut, Timer, QrCode, Building2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCheckIns, useCheckIn, useCheckOut, useCheckOutAt, useBranches } from "@/hooks/use-api";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Loading, ErrorDisplay, EmptyState } from "@/components/ui/DataState";
import { PageShell, PageHeader, MicroLabelFa, SectionTitle } from "@/components/twilight/Page";
import { TwilightCard, CtaButton } from "@/components/twilight/controls";
import { soundEngine } from "@/services/soundEngine";

/** Formats a Date as a `datetime-local` value in the device's local timezone. */
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CheckinPage() {
  const { user } = useAuth();
  const athleteId = user?.id;
  const { data, isLoading, isError, error } = useCheckIns(athleteId);
  const { data: branchesData } = useBranches();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const checkOutAtMutation = useCheckOutAt();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [correctionTime, setCorrectionTime] = useState("");
  const [correctionError, setCorrectionError] = useState<string | null>(null);
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
  const checkedIn = !!openCheckin;
  const checkinTime = openCheckin
    ? new Date(openCheckin.checkInTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const statusMessage = checkedIn
    ? `جلسه از ساعت ${checkinTime} در حال انجام است`
    : "جلسه بازی وجود ندارد — آماده ثبت ورود";

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
      if (!athleteId || !effectiveBranchId) {
        toast.error("شعبه شما مشخص نیست؛ ابتدا شعبه را انتخاب کنید");
        return;
      }
      soundEngine.playBell(528);
      checkInMutation.mutate(
        { userId: athleteId, branchId: effectiveBranchId },
        {
          onSuccess: () => toast.success("ورود شما با موفقیت ثبت شد"),
          onError: (e) => toast.error((e as Error)?.message || "ثبت ورود ناموفق بود"),
        }
      );
    } else {
      const targetId = openCheckin?.id;
      if (!targetId) return;
      soundEngine.playBell(440);
      checkOutMutation.mutate(targetId, {
        onSuccess: () => {
          toast.success("جلسه با موفقیت به پایان رسید");
          setCorrectionTime("");
          setCorrectionError(null);
        },
        onError: (e) => toast.error((e as Error)?.message || "ثبت خروج ناموفق بود"),
      });
    }
  };

  const handleCorrection = () => {
    const targetId = openCheckin?.id;
    if (!targetId) return;
    setCorrectionError(null);
    if (!correctionTime) {
      setCorrectionError("ساعت پایان را وارد کنید");
      return;
    }
    const picked = new Date(correctionTime);
    if (Number.isNaN(picked.getTime())) {
      setCorrectionError("زمان واردشده معتبر نیست");
      return;
    }
    if (picked.getTime() <= new Date(openCheckin.checkInTime).getTime()) {
      setCorrectionError("ساعت پایان باید بعد از ساعت ورود باشد");
      return;
    }
    if (picked.getTime() > Date.now()) {
      setCorrectionError("ساعت پایان نمی‌تواند در آینده باشد");
      return;
    }
    checkOutAtMutation.mutate(
      { id: targetId, checkOutTime: picked.toISOString() },
      {
        onSuccess: () => {
          toast.success("ساعت پایان جلسه اصلاح شد");
          setCorrectionTime("");
        },
        onError: (e) => toast.error((e as Error)?.message || "اصلاح ساعت پایان ناموفق بود"),
      }
    );
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
      <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[26px] border border-border bg-card p-6 shadow-2xl">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

        <div className="flex w-full items-center justify-between text-xs">
          <MicroLabelFa className="text-primary">کارت عضویت دیجیتال</MicroLabelFa>
          <span className="rounded-full border border-blush/40 bg-blush/10 px-2.5 py-0.5 text-[10px] font-semibold text-blush">
            {checkedIn ? "جلسه در حال انجام" : "آماده ثبت"}
          </span>
        </div>

        {/* Simulated QR graphic */}
        <div className="relative my-2 rounded-2xl border-2 border-primary/60 bg-card p-3 shadow-xl">
          <div className="relative flex h-40 w-40 flex-col justify-between overflow-hidden rounded-xl bg-primary-foreground p-2.5">
            <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-1 opacity-90">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-xs ${(i % 2 === 0 || i % 7 === 0 || i < 6 || i > 30) ? "bg-primary" : "bg-secondary"}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary-foreground shadow-lg">
                <QrCode className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-sm font-semibold text-foreground">{fullName || "ورزشکار"}</h2>
          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
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
              <span>پایان جلسه</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" strokeWidth={1.75} />
              <span>ثبت ورود</span>
            </>
          )}
        </CtaButton>
        <div role="status" aria-live="polite" className="text-center text-xs text-muted-foreground">
          {checkInMutation.isPending
            ? "در حال ثبت ورود…"
            : checkOutMutation.isPending
              ? "در حال پایان جلسه…"
              : statusMessage}
        </div>
        {(checkInMutation.isError || checkOutMutation.isError) && (
          <p className="text-center text-sm text-destructive">
            {(checkInMutation.error as Error)?.message || (checkOutMutation.error as Error)?.message || "خطایی رخ داد"}
          </p>
        )}
      </div>

      {/* Session timer box */}
      <TwilightCard className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blush/30 bg-blush/10 text-blush">
            <Timer className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground">مدت زمان حضور امروز</span>
            <p className="text-[10px] text-muted-foreground">
              {checkedIn && checkinTime ? `زمان ورود: ${checkinTime}` : todayPersian}
            </p>
          </div>
        </div>
        <span className="font-sans text-xl font-bold tabular-nums text-blush">{timeStr}</span>
      </TwilightCard>

      {/* Checkout-time correction for the open session */}
      {openCheckin && (
        <TwilightCard className="flex flex-col gap-3">
          <div>
            <MicroLabelFa>اصلاح ساعت پایان جلسه باز</MicroLabelFa>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              اگر خروج را فراموش کرده‌اید ثبت کنید، ساعت واقعی پایان را وارد کنید
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                type="datetime-local"
                label="ساعت پایان"
                value={correctionTime}
                min={toLocalInputValue(new Date(openCheckin.checkInTime))}
                max={toLocalInputValue(new Date())}
                onChange={(e) => {
                  setCorrectionTime(e.target.value);
                  setCorrectionError(null);
                }}
                error={correctionError ?? undefined}
                className="min-h-11"
              />
            </div>
            <CtaButton
              variant="outline"
              onClick={handleCorrection}
              disabled={checkOutAtMutation.isPending}
              className="min-h-11 sm:w-auto"
            >
              {checkOutAtMutation.isPending ? "در حال ثبت…" : "ثبت اصلاح"}
            </CtaButton>
          </div>
        </TwilightCard>
      )}

      {/* Branch selector — hidden when only one branch exists (single-branch rule) */}
      {branches.length > 1 && (
        <TwilightCard className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Building2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
              انتخاب شعبه باشگاه
            </span>
            <span className="text-[10px] text-muted-foreground">{branches.length} شعبه فعال</span>
          </div>
          <div>
            <MicroLabelFa className="mb-1.5 block">شعبه</MicroLabelFa>
            <Select value={effectiveBranchId} onValueChange={setBranchId}>
              <SelectTrigger aria-label="شعبه" className="w-full">
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
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="whitespace-nowrap py-3 pr-4 text-right font-medium">تاریخ</th>
                    <th scope="col" className="whitespace-nowrap py-3 text-right font-medium">ورود</th>
                    <th scope="col" className="whitespace-nowrap py-3 text-right font-medium">خروج</th>
                    <th scope="col" className="whitespace-nowrap py-3 pl-4 text-right font-medium">مدت زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCheckins.map((checkin) => (
                    <tr key={checkin.id} className="border-t border-border transition-colors hover:bg-secondary">
                      <td className="whitespace-nowrap py-2.5 pr-4 text-foreground">{formatDate(checkin.checkInTime)}</td>
                      <td className="whitespace-nowrap py-2.5 tabular-nums text-muted-foreground">{new Date(checkin.checkInTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="whitespace-nowrap py-2.5 tabular-nums text-muted-foreground">{checkin.checkOutTime ? new Date(checkin.checkOutTime).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "---"}</td>
                      <td className="whitespace-nowrap py-2.5 pl-4 tabular-nums text-muted-foreground">{checkin.durationMinutes ? `${Math.floor(checkin.durationMinutes / 60)}:${String(checkin.durationMinutes % 60).padStart(2, "0")}` : "---"}</td>
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
