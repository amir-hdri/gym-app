"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

/**
 * Weekly Activity Capsule Chart — ported from the Twilight Meditation
 * source (GymJourneyScreen "Weekly Activity Capsule Chart").
 * Seven vertical pill-capsule tracks with cream fills; today renders as the
 * signature circular pin (Saturday in the source). Shows the last 7 days as
 * a rolling window so the chart is always populated.
 */

export interface CapsuleCheckIn {
  checkInTime: string;
  durationMinutes?: number | null;
}

interface DayDatum {
  key: string;
  label: string;
  short: string;
  sessions: number;
  minutes: number;
  isPin: boolean;
}

/** Persian weekday meta indexed by JS getDay(): 0=Sun … 6=Sat */
const FA_WEEKDAY: Array<{ label: string; short: string }> = [
  { label: "یکشنبه", short: "ی" }, // 0 Sun
  { label: "دوشنبه", short: "د" }, // 1 Mon
  { label: "سه‌شنبه", short: "س" }, // 2 Tue
  { label: "چهارشنبه", short: "چ" }, // 3 Wed
  { label: "پنج‌شنبه", short: "پ" }, // 4 Thu
  { label: "جمعه", short: "ج" }, // 5 Fri
  { label: "شنبه", short: "ش" }, // 6 Sat
];

export function WeeklyCapsuleChart({ checkIns }: { checkIns: CapsuleCheckIn[] }) {
  // Rolling 7-day window ending today (rightmost = today in RTL).
  const days: DayDatum[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(today);
      dayStart.setDate(today.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      let sessions = 0;
      let minutes = 0;
      for (const c of checkIns) {
        const t = new Date(c.checkInTime).getTime();
        if (t >= dayStart.getTime() && t < dayEnd.getTime()) {
          sessions += 1;
          minutes += Number(c.durationMinutes || 0);
        }
      }
      const meta = FA_WEEKDAY[dayStart.getDay()];
      return { key: `d${i}`, label: meta.label, short: meta.short, sessions, minutes, isPin: i === 0 };
    });
  }, [checkIns]);

  const [selectedKey, setSelectedKey] = useState<string | null>("d0");
  const active = days.find((d) => d.key === selectedKey) ?? days[0];
  const maxMinutes = Math.max(...days.map((d) => d.minutes), 1);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      {/* Section Header with Legend */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base font-normal text-foreground">حجم فعالیت هفتگی</h2>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>دقیقه</span>
        </div>
      </div>

      {/* Selected Day Info Banner */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs">
        <span className="font-medium text-muted-foreground">
          {active.label} · {active.sessions > 0 ? `${active.sessions} جلسه` : "بدون جلسه"}
        </span>
        <span className="font-semibold tabular-nums text-primary">
          {active.minutes} دقیقه
        </span>
      </div>

      {/* Custom Capsule Bars */}
      <div className="flex items-end justify-between gap-1.5 px-1 pb-1 pt-2">
        {days.map((item, idx) => {
          const isSelected = selectedKey === item.key;
          const pct = item.minutes > 0 ? Math.max((item.minutes / maxMinutes) * 100, 10) : 0;

          return (
            <motion.button
              key={item.key}
              onClick={() => setSelectedKey(item.key)}
              whileTap={{ scale: 0.92 }}
              className="group flex flex-1 cursor-pointer flex-col items-center gap-2.5 focus:outline-none"
              aria-label={`${item.label}: ${item.minutes} دقیقه`}
            >
              {/* Vertical Pill Capsule Track */}
              <div
                className={`relative flex h-36 w-8 flex-col items-center justify-end overflow-hidden rounded-full bg-secondary p-1 transition-colors sm:w-9 ${
                  isSelected ? "bg-secondary ring-1 ring-primary/70" : "hover:bg-secondary"
                }`}
              >
                {/* Filled Inner Cream Capsule with organic spring growth */}
                {item.isPin ? (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05 + 0.15, type: "spring", stiffness: 350, damping: 25 }}
                    className="aspect-square w-full rounded-full bg-primary shadow-xs"
                  />
                ) : (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: idx * 0.05 + 0.1, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full rounded-full bg-primary shadow-xs"
                  >
                    {isSelected && (
                      <div className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary/40" />
                    )}
                  </motion.div>
                )}
              </div>

              {/* Day Label */}
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isSelected ? "font-bold text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                {item.short}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
