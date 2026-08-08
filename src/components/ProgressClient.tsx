"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addProgressEntry } from "@/server/actions/progress";

interface ProgressItem {
  id: string;
  metricType: string;
  value: any;
  unit: string | null;
  notes: string | null;
  measuredAt: Date | string;
}

interface WorkoutProgressItem {
  date: string;
  count: number;
}

interface WorkoutSetsProgressItem {
  dateStr: string;
  exerciseName: string;
  maxWeight: number;
}

interface ProgressClientProps {
  initialEntries: ProgressItem[];
  initialWorkoutProgress: WorkoutProgressItem[];
  initialWorkoutSetsProgress: WorkoutSetsProgressItem[];
}

const metricTypeLabels: Record<string, string> = {
  WEIGHT: "وزن بدن",
  BODY_FAT: "درصد چربی",
  CHEST: "دور سینه",
  WAIST: "دور کمر",
  ARM: "دور بازو",
  THIGH: "دور ران",
  BENCH_PRESS: "پرس سینه",
  SQUAT: "اسکات",
  DEADLIFT: "ددلیفت",
  CUSTOM: "سایر موارد",
};

const metricColors: Record<string, string> = {
  WEIGHT: "#60a5fa",
  BODY_FAT: "#34d399",
  CHEST: "#c084fc",
  WAIST: "#22d3ee",
  BENCH_PRESS: "#fb7185",
  SQUAT: "#fbbf24",
  DEADLIFT: "#f472b6",
  CUSTOM: "#a7f3d0",
};

export default function ProgressClient({ initialEntries, initialWorkoutProgress, initialWorkoutSetsProgress }: ProgressClientProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<ProgressItem[]>(initialEntries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metricType, setMetricType] = useState("WEIGHT");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || isNaN(Number(value))) return;

    startTransition(async () => {
      try {
        await addProgressEntry(metricType, Number(value), unit, notes);
        setIsModalOpen(false);
        setValue("");
        setNotes("");
        // Reload page to reflect updated data
        router.refresh();
      } catch (err: any) {
        alert(err.message || "خطا در ثبت شاخص");
      }
    });
  };

  // Group by metric type to show current stats
  const latestMetrics: Record<string, ProgressItem> = {};
  [...entries].reverse().forEach(entry => {
    latestMetrics[entry.metricType] = entry;
  });

  // Calculate Overall Progress (First vs Latest)
  const metricHistory: Record<string, ProgressItem[]> = {};
  entries.forEach(entry => {
    if (!metricHistory[entry.metricType]) {
      metricHistory[entry.metricType] = [];
    }
    metricHistory[entry.metricType].push(entry);
  });

  const progressComparisons = Object.entries(metricHistory).map(([type, hist]) => {
    const sorted = [...hist].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const diff = Number(latest.value) - Number(first.value);
    
    return {
      type,
      label: metricTypeLabels[type] || type,
      firstVal: Number(first.value),
      latestVal: Number(latest.value),
      diff,
      unit: latest.unit || "",
    };
  });

  // Group sets progress by exercise
  const exerciseProgress: Record<string, Array<{ dateStr: string; maxWeight: number }>> = {};
  initialWorkoutSetsProgress.forEach(item => {
    if (!exerciseProgress[item.exerciseName]) {
      exerciseProgress[item.exerciseName] = [];
    }
    if (item.maxWeight > 0) {
      exerciseProgress[item.exerciseName].push({
        dateStr: item.dateStr,
        maxWeight: item.maxWeight
      });
    }
  });

  return (
    <div className="space-y-5 text-right relative">
      {/* Title */}
      <div className="flex items-center justify-between flex-row-reverse anim-fade-up">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">تناسب اندام</p>
          <h1 className="text-2xl font-bold gradient-text">تحلیل پیشرفت بدن</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg shadow-rose-950/40">
          + ثبت شاخص جدید
        </button>
      </div>

      {/* Workout Routine Activity Chart */}
      <div className="glass-card p-4 anim-fade-up text-right space-y-4" style={{ animationDelay: "60ms" }}>
        <div>
          <h3 className="text-xs font-bold text-white/80">فعالیت تمرینی روزانه</h3>
          <p className="text-[9px] text-white/35 mt-0.5">تعداد تمرین‌های چک‌شده و انجام‌شده در روزهای اخیر</p>
        </div>

        {initialWorkoutProgress.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-4">هنوز تمرینی انجام نداده‌اید. برنامه امروز خود را بررسی کنید.</p>
        ) : (
          <div className="flex items-end justify-between h-28 pt-4 px-2 bg-white/[0.01] border border-white/[0.04] rounded-xl flex-row-reverse">
            {initialWorkoutProgress.slice(-7).map((wp, idx) => {
              const date = new Date(wp.date);
              const dayName = date.toLocaleDateString("fa-IR", { weekday: "narrow" });
              const dateNum = date.toLocaleDateString("fa-IR", { day: "numeric" });
              const heightPct = Math.min(100, (wp.count / 8) * 100);

              return (
                <div key={wp.date || idx} className="flex flex-col items-center gap-2 group w-8">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute bg-rose-900 border border-rose-500/30 text-white text-[9px] px-1.5 py-0.5 rounded -translate-y-8 pointer-events-none whitespace-nowrap">
                    {wp.count} حرکت
                  </span>
                  
                  <div className="w-4 bg-white/[0.06] h-16 rounded-full flex items-end overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-t from-rose-600 to-bubblegum_pink rounded-full transition-all duration-500" 
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  
                  <span className="text-[9px] text-white/40">{dayName} · {dateNum}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strength Progress Section (Weights Tracked in Sets) */}
      {Object.keys(exerciseProgress).length > 0 && (
        <div className="glass-card p-4 anim-fade-up text-right space-y-4" style={{ animationDelay: "120ms" }}>
          <div>
            <h3 className="text-xs font-bold text-white/80">نمودار پیشرفت قدرت عضلانی</h3>
            <p className="text-[9px] text-white/35 mt-0.5">پایش تغییرات حداکثر وزنه جابجا شده در طول جلسات</p>
          </div>

          <div className="space-y-4">
            {Object.entries(exerciseProgress).map(([exercise, logs]) => {
              const sortedLogs = [...logs].sort((a,b) => a.dateStr.localeCompare(b.dateStr));
              if (sortedLogs.length === 0) return null;

              const latest = sortedLogs[sortedLogs.length - 1];
              const first = sortedLogs[0];
              const diff = latest.maxWeight - first.maxWeight;
              const maxWeightLimit = Math.max(...sortedLogs.map(l => l.maxWeight), 50);

              return (
                <div key={exercise} className="bg-white/[0.015] border border-white/[0.04] p-3 rounded-xl space-y-3">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <p className="text-xs font-semibold text-white/95">{exercise}</p>
                    <div className="flex items-center gap-1.5 flex-row-reverse">
                      <span className="text-[10px] text-white/40">آخرین رکورد: {latest.maxWeight} کیلوگرم</span>
                      {diff > 0 && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                          +{diff} kg ↑
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal progression bar list */}
                  <div className="flex items-end justify-start gap-4 h-16 pt-2 bg-black/10 rounded-lg px-2 overflow-x-auto flex-row-reverse">
                    {sortedLogs.slice(-6).map((log, idx) => {
                      const pct = (log.maxWeight / maxWeightLimit) * 80 + 20; // scale between 20% and 100%
                      const date = new Date(log.dateStr);
                      const displayDate = date.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
                      return (
                        <div key={log.dateStr || idx} className="flex flex-col items-center gap-1 group w-12 shrink-0">
                          <span className="text-[8px] text-white/70 font-mono">{log.maxWeight}kg</span>
                          <div className="w-2.5 bg-white/5 h-8 rounded-full flex items-end">
                            <div 
                              className="w-full bg-cyan-400 rounded-full transition-all duration-300"
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[7px] text-white/30 whitespace-nowrap">{displayDate}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid of current body metrics */}
      <div className="grid grid-cols-2 gap-3">
        {Object.keys(latestMetrics).length === 0 ? (
          <div className="col-span-2 glass-card p-8 text-center text-white/30 text-xs">
            هنوز هیچ شاخصی ثبت نشده است. از دکمه بالا برای اضافه کردن استفاده کنید.
          </div>
        ) : (
          Object.entries(latestMetrics).map(([type, m], i) => {
            const label = metricTypeLabels[type] || type;
            const color = metricColors[type] || "#ffffff";
            const dateStr = new Date(m.measuredAt).toLocaleDateString("fa-IR", { month: "short", day: "numeric" });
            return (
              <div key={type} className="glass-card p-4 anim-fade-up text-right" style={{animationDelay:`${i*50+180}ms`}}>
                <div className="flex items-center justify-between mb-2 flex-row-reverse">
                  <p className="text-[10px] text-white/35">{label}</p>
                  <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{background:color, boxShadow:`0 0 8px ${color}`}}/>
                </div>
                <p className="text-xl font-bold" style={{color}}>{Number(m.value).toLocaleString("fa-IR")} <span className="text-[10px] font-normal text-white/50">{m.unit || ""}</span></p>
                <p className="text-[9px] mt-1.5 text-white/30">آخرین ثبت: {dateStr}</p>
              </div>
            );
          })
        )}
      </div>

      {/* First vs Latest Comparisons */}
      {progressComparisons.length > 0 && (
        <div className="glass-card p-4 anim-fade-up text-right space-y-3" style={{ animationDelay: "280ms" }}>
          <div>
            <h3 className="text-xs font-bold text-white/80">تحلیل کلی تغییرات بدن</h3>
            <p className="text-[9px] text-white/35 mt-0.5">مقایسه اولین مقدار ثبت‌شده با آخرین مقدار</p>
          </div>
          
          <div className="space-y-2">
            {progressComparisons.map((c) => {
              const hasReduced = c.diff < 0;
              const diffText = c.diff === 0 ? "بدون تغییر" : `${Math.abs(c.diff).toLocaleString("fa-IR")} ${c.unit}`;
              const isWeightOrFat = ["WEIGHT", "BODY_FAT", "WAIST"].includes(c.type);
              const isGood = (isWeightOrFat && hasReduced) || (!isWeightOrFat && c.diff > 0);

              return (
                <div key={c.type} className="flex justify-between items-center text-xs p-2.5 bg-white/[0.015] border border-white/[0.04] rounded-xl flex-row-reverse">
                  <div>
                    <span className="font-semibold text-white">{c.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="text-right text-[10px] text-white/40">
                      <span>شروع: {c.firstVal.toLocaleString("fa-IR")}</span> · <span>کنونی: {c.latestVal.toLocaleString("fa-IR")}</span>
                    </div>

                    <div className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      c.diff === 0 
                        ? "bg-white/10 text-white/60" 
                        : isGood 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {c.diff > 0 ? "↑ +" : c.diff < 0 ? "↓ -" : ""} {diffText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History list */}
      {entries.length > 0 && (
        <div className="glass-card overflow-hidden mt-4 anim-fade-up" style={{animationDelay:"340ms"}}>
          <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-bold text-white/70">
            تاریخچه ثبت شاخص‌ها
          </div>
          <div className="divide-y divide-white/[0.04]">
            {entries.slice(0, 10).map(entry => {
              const label = metricTypeLabels[entry.metricType] || entry.metricType;
              const dateStr = new Date(entry.measuredAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
              return (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3 text-xs flex-row-reverse">
                  <div className="text-right">
                    <p className="font-semibold">{label}</p>
                    <p className="text-[9px] text-white/35 mt-0.5">{dateStr}</p>
                  </div>
                  <div className="text-left font-bold text-bubblegum_pink" dir="ltr">
                    {Number(entry.value).toLocaleString("fa-IR")} {entry.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Progress Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md anim-fade-in">
          <div className="w-full max-w-sm glass-strong p-6 rounded-2xl border border-white/20 text-right">
            <h2 className="text-base font-bold mb-4 text-white">ثبت شاخص پیشرفت جدید</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold mb-1.5 text-white/40">نوع شاخص</label>
                <select 
                  value={metricType} 
                  onChange={(e) => {
                    setMetricType(e.target.value);
                    if (e.target.value === "BODY_FAT") setUnit("%");
                    else if (["WEIGHT", "BENCH_PRESS", "SQUAT", "DEADLIFT"].includes(e.target.value)) setUnit("kg");
                    else setUnit("cm");
                  }}
                  className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-right bg-[#1a0309] border border-white/10 text-white">
                  {Object.entries(metricTypeLabels).map(([type, label]) => (
                    <option key={type} value={type} className="bg-[#24050e] text-white">{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold mb-1.5 text-white/40">مقدار</label>
                  <input 
                    type="text" 
                    placeholder="مثال: ۷۵" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)}
                    required
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-left" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold mb-1.5 text-white/40">واحد</label>
                  <input 
                    type="text" 
                    placeholder="kg" 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)}
                    className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-center" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold mb-1.5 text-white/40">یادداشت (اختیاری)</label>
                <input 
                  type="text" 
                  placeholder="توضیحات کوتاه…" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-glass w-full rounded-xl px-3 py-2.5 text-xs text-right" 
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 flex-row-reverse">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="btn-primary rounded-xl px-4 py-2.5 text-xs font-bold">
                  {isPending ? "در حال ثبت..." : "ثبت شاخص"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-glass glass-card rounded-xl px-4 py-2.5 text-xs font-semibold text-white/60">
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
