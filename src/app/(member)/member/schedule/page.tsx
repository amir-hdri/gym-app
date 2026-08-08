export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { getMemberWeeklySchedule } from "@/server/actions/schedules";
import { getTodayDayOfWeek, getDayNamePersian } from "@/lib/qr";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MemberSchedulePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const weeklySchedule = await getMemberWeeklySchedule(session.user.id);
  const currentTodayIndex = getTodayDayOfWeek();

  return (
    <div className="space-y-4 sm:space-y-5 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
            برنامه هفتگی مربی
          </p>
          <h1 className="text-xl sm:text-2xl font-bold gradient-text">زمانبندی و سانس‌های تمرین</h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
            امروز: {getDayNamePersian(currentTodayIndex)}
          </span>
        </div>
      </div>

      {/* Overview Card */}
      <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-white/10 text-right anim-fade-up">
        <p className="text-xs font-bold text-white mb-1">
          تقویم جلسات و سانس‌های تمرینی شما
        </p>
        <p className="text-[10px] sm:text-[11px] text-white/50 leading-relaxed">
          برنامه تمرینی هفتگی شما بر اساس زمانبندی تنظیم‌شده توسط مربی در زیر نمایش داده شده است.
        </p>
      </div>

      {/* 7-Day Grouped Weekly Schedule (B6) */}
      <div className="space-y-3.5 sm:space-y-4 anim-fade-up" style={{ animationDelay: "80ms" }}>
        {weeklySchedule.map((dayGroup: any, idx: number) => {
          const isCurrentToday = dayGroup.dayIndex === currentTodayIndex;
          const hasSchedules = dayGroup.schedules && dayGroup.schedules.length > 0;

          return (
            <div
              key={dayGroup.dayIndex}
              className={`glass-card p-3.5 sm:p-4 rounded-2xl transition-all border ${
                isCurrentToday
                  ? "border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-950/20"
                  : "border-white/[0.08]"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06] mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCurrentToday
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-white/[0.04] text-white/60 border border-white/10"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        isCurrentToday ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {dayGroup.dayName}
                    </h3>
                  </div>
                </div>

                {isCurrentToday && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 animate-pulse">
                    امروز
                  </span>
                )}
              </div>

              {/* Day's Schedules */}
              {!hasSchedules ? (
                <div className="py-3 text-center text-xs text-white/30 bg-white/[0.015] rounded-xl border border-dashed border-white/[0.05]">
                  استراحت یا بدون سانس مشخص
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {dayGroup.schedules.map((sch: any) => (
                    <div
                      key={sch.id}
                      className="p-3 sm:p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] space-y-2 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {sch.title || "سانس تمرینی"}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold"
                            dir="ltr"
                          >
                            {sch.startTime} - {sch.endTime}
                          </span>
                        </div>

                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                          فعال
                        </span>
                      </div>

                      {sch.note && (
                        <p className="text-[10px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                          نکته مربی: {sch.note}
                        </p>
                      )}

                      {/* Connected Routine */}
                      {sch.routine && (
                        <div className="mt-2 pt-2 border-t border-white/[0.04]">
                          <p className="text-[11px] font-semibold text-white/70">
                            حرکات برنامه: {sch.routine.title}
                          </p>
                          {sch.routine.tasks && sch.routine.tasks.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                              {sch.routine.tasks.map((t: any, tIdx: number) => (
                                <div
                                  key={t.id || tIdx}
                                  className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] flex justify-between items-center"
                                >
                                  <span className="text-white/80 truncate">{t.exerciseName}</span>
                                  <span className="text-cyan-400 font-mono shrink-0 mr-2" dir="ltr">
                                    {t.sets}×{t.reps}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Back to Dashboard Link */}
      <div className="pt-2">
        <Link
          href="/member/dashboard"
          className="btn-glass w-full rounded-2xl py-3.5 text-xs font-semibold text-white/70 text-center block hover:text-white transition-all"
        >
          &rarr; بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
