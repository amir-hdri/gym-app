"use client";

import { useState } from "react";

const moods = ["Calm", "Tired", "Anxious", "Clear"];

export default function JourneyPage() {
  const bars = [38, 62, 78, 92, 48, 22, 58];
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const [mood, setMood] = useState<string | null>(null);

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-serif text-[34px] text-[#f3eee6]">Your Journey</h1>
        <p className="mt-2 text-[14px] text-[#8d877d]">Reflect on your growth</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-soft rounded-[24px] p-5">
          <p className="text-[11px] tracking-[0.14em] text-[#8a847a]">TOTAL TIME</p>
          <p className="mt-3 font-serif text-[36px] leading-none">
            12.5 <span className="text-[16px] text-[#8a847a]">hrs</span>
          </p>
        </div>
        <div className="card-soft rounded-[24px] p-5">
          <p className="text-[11px] tracking-[0.14em] text-[#8a847a]">CURRENT STREAK</p>
          <p className="mt-3 font-serif text-[36px] leading-none">
            5 <span className="text-[16px] text-[#8a847a]">days</span>
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[20px] font-medium">Weekly Activity</h2>
          <span className="text-[11px] text-[#8a847a] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d8cfc0]" />
            MINS
          </span>
        </div>
        <div className="card-soft rounded-[24px] p-5">
          <div className="h-[180px] flex items-end justify-between gap-2">
            {bars.map((h, i) => (
              <div key={days[i]} className="flex-1 flex flex-col items-center gap-3 min-w-0">
                <div className="w-full max-w-[28px] h-[150px] bar relative overflow-hidden">
                  <div className="bar-fill absolute bottom-0 left-0 right-0" style={{ height: `${h}%` }} />
                </div>
                <span className="text-[10px] tracking-wider text-[#7c766c]">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[20px] font-medium mb-3">Recent Milestones</h2>
        <div className="card-soft rounded-[24px] px-4 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#242424] flex items-center justify-center text-[#d8cfc0] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="8" r="4" />
              <path d="M8 12.5 7 20l5-2 5 2-1-7.5" />
            </svg>
          </div>
          <div>
            <p className="text-[15px]">Consistent Mindset</p>
            <p className="text-[12px] text-[#8a847a]">Meditated for 5 consecutive days</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[20px] font-medium mb-3">How are you feeling?</h2>
        <div className="grid grid-cols-2 gap-2">
          {moods.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={`h-12 rounded-[18px] text-sm ${
                mood === m ? "bg-[#e8dfd2] text-[#1a1a1a]" : "card-soft text-[#cfc6b8]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
