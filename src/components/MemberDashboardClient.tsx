"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WorkoutTodoList from "@/components/WorkoutTodoList";
import { getDayNamePersian } from "@/lib/qr";

interface MemberDashboardClientProps {
  member: any;
  routine: any;
  initialStats: any;
  todaySchedules: any[];
  userId: string;
}

export default function MemberDashboardClient({
  member,
  routine,
  initialStats,
  todaySchedules,
  userId,
}: MemberDashboardClientProps) {
  const [stats] = useState(initialStats);
  const [schedules] = useState(todaySchedules);
  const [liveMinutes, setLiveMinutes] = useState(initialStats?.liveMinutes || 0);

  const name = member?.name || "کاربر باشگاه";
  const profile = member?.memberProfile;
  const activeSub = profile?.subscriptions?.find((s: any) => s.status === "ACTIVE");
  const planName = activeSub?.plan?.name || "بدون اشتراک فعال";

  // Calculate remaining days for standard subscriptions
  let expiryDateFarsi = "---";
  let remainingDaysText = "فاقد اشتراک";
  let progressWidth = "0%";
  let remainingDaysVal = 0;

  if (activeSub?.endsAt) {
    const ends = new Date(activeSub.endsAt);
    const start = activeSub.startedAt ? new Date(activeSub.startedAt) : new Date();
    const now = new Date();

    expiryDateFarsi = ends.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const totalDays =
      Math.ceil((ends.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 30;
    remainingDaysVal = Math.max(
      0,
      Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    remainingDaysText = `${remainingDaysVal.toLocaleString("fa-IR")} روز باقی‌مانده`;
    progressWidth = `${Math.min(100, Math.max(0, (remainingDaysVal / totalDays) * 100))}%`;
  }

  // Session package calculations (B5)
  const isSessionBased =
    stats?.isSessionBased ||
    Boolean(activeSub?.plan?.isSessionBased) ||
    Boolean(activeSub?.plan?.maxSessions && activeSub.plan.maxSessions > 0);
  const maxSessions = stats?.maxSessions || activeSub?.plan?.maxSessions || 0;
  const sessionsUsed = stats?.sessionsUsed || activeSub?.sessionsUsed || 0;
  const sessionPercent = maxSessions > 0 ? Math.min(100, Math.round((sessionsUsed / maxSessions) * 100)) : 0;

  // Real-time live minutes counter when inside
  useEffect(() => {
    if (stats?.isInside && stats?.currentCheckInAt) {
      const checkInTime = new Date(stats.currentCheckInAt).getTime();
      const updateTimer = () => {
        const mins = Math.max(0, Math.floor((Date.now() - checkInTime) / 60000));
        setLiveMinutes(mins);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 30000);
      return () => clearInterval(interval);
    }
  }, [stats?.isInside, stats?.currentCheckInAt]);

  const attendanceCount = stats?.totalSessions ?? profile?.attendance?.length ?? 0;
  const progressCount = profile?.progressEntries?.length || 0;
  const pendingPayments =
    profile?.subscriptions
      ?.flatMap((s: any) => s.payments)
      ?.filter((p: any) => p.status === "PENDING")?.length || 0;

  return (
    <div className="space-y-4 sm:space-y-5 text-right" dir="rtl">
      {/* Alert banner if no active subscription */}
      {!activeSub && (
        <div className="relative rounded-2xl p-4 overflow-hidden border border-rose-500/30 bg-rose-950/20 text-right anim-fade-up">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" />
          <p className="text-xs font-bold text-rose-400">شما فاقد اشتراک فعال هستید!</p>
          <p className="text-[10px] text-white/50 mt-1">
            جهت استفاده از گیت‌های ورود باشگاه و ثبت‌نام در سانس‌ها، لطفاً اشتراک جدید تهیه کنید.
          </p>
        </div>
      )}

      {/* Inside Gym Live Banner (B5) */}
      {stats?.isInside && (
        <div className="relative rounded-2xl p-4 overflow-hidden border border-emerald-500/40 bg-emerald-950/40 text-right anim-fade-up shadow-xl shadow-emerald-950/20">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-400" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-300">
                  🟢 شما الان داخل باشگاه هستید
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">
                  زمان ورود:{" "}
                  {stats.currentCheckInAt
                    ? new Date(stats.currentCheckInAt).toLocaleTimeString("fa-IR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "---"}{" "}
                  · مدت حضور زنده:{" "}
                  <span className="font-bold text-emerald-300 font-mono">
                    {liveMinutes} دقیقه
                  </span>
                </p>
              </div>
            </div>

            <Link
              href="/member/membership"
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-all text-center self-start sm:self-auto"
            >
              کد QR خروج 🔴
            </Link>
          </div>
        </div>
      )}

      {/* Hero membership card */}
      <div
        className="relative rounded-2xl overflow-hidden p-4 sm:p-5 anim-scale-in"
        style={{
          background:
            "linear-gradient(135deg,rgba(40,5,15,.9),rgba(30,5,20,.8),rgba(20,5,10,.9))",
          border: "1px solid rgba(255,255,255,.14)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.2),0 16px 48px rgba(0,0,0,.5)",
        }}
      >
        <div
          className="absolute -top-10 -left-10 w-32 h-32 rounded-full animate-float-glow"
          style={{ background: "radial-gradient(circle,rgba(201,24,74,.35),transparent 70%)" }}
        />
        <div
          className="absolute -bottom-8 -right-4 w-24 h-24 rounded-full animate-float-glow"
          style={{
            background: "radial-gradient(circle,rgba(255,77,109,.15),transparent 70%)",
            animationDelay: ".5s",
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="text-right">
              <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">
                عضویت فعال
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">{name}</p>
            </div>
            <span
              className="text-[10px] font-bold px-3 py-1 rounded-full"
              style={{
                background: activeSub ? "rgba(16,185,129,.2)" : "rgba(244,63,94,.2)",
                color: activeSub ? "#34d399" : "#fb7185",
                border: activeSub
                  ? "1px solid rgba(16,185,129,.25)"
                  : "1px solid rgba(244,63,94,.25)",
              }}
            >
              {activeSub ? "فعال" : "غیر فعال"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
            <div
              className="rounded-xl p-2.5 sm:p-3 text-right"
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <p className="text-[9px] text-white/40">طرح اشتراک</p>
              <p className="text-xs font-semibold text-white mt-1 truncate">{planName}</p>
            </div>
            <div
              className="rounded-xl p-2.5 sm:p-3 text-right"
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <p className="text-[9px] text-white/40">تاریخ انقضا</p>
              <p className="text-xs font-semibold text-white mt-1">{expiryDateFarsi}</p>
            </div>
          </div>

          {activeSub && (
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,.08)" }}
              >
                <div
                  className="h-full rounded-full anim-progress"
                  style={{
                    background: "linear-gradient(90deg,#c9184a,#ff758f)",
                    width: isSessionBased ? `${sessionPercent}%` : progressWidth,
                  }}
                />
              </div>
              <p className="text-[9px] text-white/40 whitespace-nowrap">
                {isSessionBased
                  ? `${sessionsUsed} از ${maxSessions} جلسه (${sessionPercent}%)`
                  : remainingDaysText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards: Session Package Progress (8/12) & 3 Stats (B5) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 anim-fade-up" style={{ animationDelay: "100ms" }}>
        {/* KPI 1: Sessions or Days */}
        <div className="glass-card p-3 sm:p-3.5 text-right flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] text-white/40 mb-1 truncate">
              {isSessionBased ? "جلسات مصرف‌شده" : "روزهای باقیمانده"}
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-cyan-400 font-mono">
              {isSessionBased ? `${sessionsUsed}/${maxSessions}` : remainingDaysVal.toLocaleString("fa-IR")}
            </p>
          </div>
          <p className="text-[8px] text-white/30 mt-1.5 truncate">
            {isSessionBased ? `سقف ${maxSessions} جلسه` : "روز تا تمدید"}
          </p>
        </div>

        {/* KPI 2: This Month */}
        <div className="glass-card p-3 sm:p-3.5 text-right flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] text-white/40 mb-1 truncate">حضورهای این ماه</p>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
              {stats?.thisMonthCount ?? attendanceCount}
            </p>
          </div>
          <p className="text-[8px] text-white/30 mt-1.5 truncate">تردد ۳۰ روز</p>
        </div>

        {/* KPI 3: Avg Duration */}
        <div className="glass-card p-3 sm:p-3.5 text-right flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] text-white/40 mb-1 truncate">میانگین مدت</p>
            <p className="text-lg sm:text-xl font-extrabold text-purple-400 font-mono">
              {stats?.avgDurationMinutes ?? 0}{" "}
              <span className="text-[8px] font-normal text-white/40">دقیقه</span>
            </p>
          </div>
          <p className="text-[8px] text-white/30 mt-1.5 truncate">مدت هر جلسه</p>
        </div>
      </div>

      {/* Today Schedule Card (B5) */}
      <div className="glass-card p-4 anim-fade-up text-right" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <h3 className="text-xs font-bold text-white">
              برنامه امروز ({getDayNamePersian(stats?.todayDayIndex ?? 0)})
            </h3>
          </div>
          <Link
            href="/member/schedule"
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            مشاهده تقویم هفتگی ←
          </Link>
        </div>

        {schedules.length === 0 ? (
          <div className="p-3.5 text-center text-xs text-white/35 bg-white/[0.015] rounded-xl border border-white/[0.04]">
            برای امروز سانس تمرینی برنامه‌ریزی نشده است. می‌توانید تمرین آزاد یا روتین روزانه را انجام دهید.
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((sch) => (
              <div
                key={sch.id}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between hover:border-cyan-500/30 transition-all"
              >
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {sch.title || "سانس تمرینی"}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono font-semibold" dir="ltr">
                      {sch.startTime} - {sch.endTime}
                    </span>
                  </div>
                  {sch.routine && (
                    <p className="text-[10px] text-white/50 mt-1">
                      برنامه متصل: {sch.routine.title} ({sch.routine.tasks?.length || 0} حرکت)
                    </p>
                  )}
                </div>

                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold shrink-0">
                  آماده تمرین
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <Link
        href="/member/membership"
        className="btn-primary w-full rounded-2xl py-3.5 text-xs sm:text-sm font-bold anim-glow-pulse flex items-center justify-center gap-2 shadow-lg shadow-rose-950/30"
      >
        <span>کد QR ورود و تمدید اشتراک</span>
        <span>←</span>
      </Link>

      {/* Workout Daily Checklist */}
      <WorkoutTodoList initialRoutine={routine} userId={userId} />

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2 anim-fade-up" style={{ animationDelay: "300ms" }}>
        {[
          {
            label: "QR ورود",
            link: "/member/membership",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="3" height="3" />
              </svg>
            ),
          },
          {
            label: "زمانبندی",
            link: "/member/schedule",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
          },
          {
            label: "پیشرفت",
            link: "/member/progress",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            ),
          },
          {
            label: "فاکتورها",
            link: "/member/payments",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            ),
          },
        ].map((a, i) => (
          <Link
            key={a.label}
            href={a.link}
            className="btn-glass glass-card flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] text-white/70 hover:text-white transition-all"
            style={{ animationDelay: `${i * 50 + 300}ms` }}
          >
            <span className="text-bubblegum_pink">{a.icon}</span>
            <span className="truncate">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Today summary */}
      <div className="glass-card p-4 anim-fade-up text-right" style={{ animationDelay: "450ms" }}>
        <p className="text-xs font-semibold mb-3 text-white/70">خلاصه وضعیت مالی و بدنی</p>
        <ul className="space-y-2.5">
          <li className="flex items-center gap-2.5 text-xs text-white/55 hover:text-white/80 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-indigo-500" />
            <span className="flex-1 text-right">{attendanceCount} حضور ثبت شده در این دوره</span>
          </li>
          <li className="flex items-center gap-2.5 text-xs text-white/55 hover:text-white/80 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
            <span className="flex-1 text-right">{pendingPayments} فاکتور پرداخت نشده</span>
          </li>
          <li className="flex items-center gap-2.5 text-xs text-white/55 hover:text-white/80 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-violet-400" />
            <span className="flex-1 text-right">{progressCount} شاخص پیشرفت بدن ثبت شده</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
