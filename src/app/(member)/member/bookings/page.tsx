"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveSession } from "@/lib/catalog";

const phases = ["Inhale", "Hold", "Exhale", "Hold"] as const;

function Breathe() {
  const [i, setI] = useState(0);
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setI((n) => (n + 1) % 4), 4000);
    return () => clearInterval(id);
  }, [on]);

  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <p className="text-[11px] tracking-[0.2em] text-[#8a847a]">BREATHE</p>
      <h1 className="font-serif text-[34px] mt-2">Box breath</h1>
      <p className="text-[14px] text-[#8a847a] mt-2">Four counts in each direction.</p>

      <div className="relative mt-14 w-52 h-52 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border border-[#e8dfd2]/25"
          style={{
            transform: on && phases[i] === "Inhale" ? "scale(1.08)" : on && phases[i] === "Exhale" ? "scale(0.86)" : "scale(1)",
            transition: "transform 4s ease-in-out",
          }}
        />
        <div
          className="w-36 h-36 rounded-full bg-[#e8dfd2]/90 text-[#1a1a1a] flex items-center justify-center font-serif text-[28px]"
          style={{
            transform: on && (phases[i] === "Inhale" || (phases[i] === "Hold" && i === 1)) ? "scale(1.12)" : "scale(0.92)",
            transition: "transform 4s ease-in-out",
          }}
        >
          {phases[i]}
        </div>
      </div>

      <button type="button" onClick={() => setOn((v) => !v)} className="mt-12 h-12 px-8 rounded-full bg-[#e8dfd2] text-[#1a1a1a]">
        {on ? "Pause" : "Resume"}
      </button>
    </div>
  );
}

function AudioPlayer({ raw }: { raw: string }) {
  const item = useMemo(() => resolveSession(raw), [raw]);
  const [playing, setPlaying] = useState(false);
  const [sec, setSec] = useState(0);
  const total = item.minutes * 60;

  useEffect(() => {
    setSec(0);
    setPlaying(false);
  }, [item.id]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setSec((s) => Math.min(total, s + 1)), 1000);
    return () => clearInterval(id);
  }, [playing, total]);

  const pct = total ? (sec / total) * 100 : 0;
  const fmt = (n: number) =>
    `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

  return (
    <div className="relative min-h-[72vh] -mx-5 -mt-8 px-5 pt-10 pb-8 overflow-hidden">
      <img src="/hero-dusk.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0c0c0c]/70 to-[#0c0c0c]" />
      <div className="relative flex flex-col items-center text-center">
        <p className="text-[11px] tracking-[0.2em] text-white/60">NOW PLAYING</p>
        <h1 className="font-serif text-[36px] mt-4 max-w-[280px] leading-tight">{item.title}</h1>
        <p className="text-[14px] text-[#b8ae9f] mt-3">{item.meta}</p>
        {item.blurb && <p className="text-[13px] text-white/55 mt-3 max-w-[280px]">{item.blurb}</p>}

        <div className="mt-14 w-full">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-[#e8dfd2] transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[12px] text-[#8a847a] mt-2">
            <span>{fmt(sec)}</span>
            <span>{fmt(total - sec)}</span>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-6">
          <button type="button" onClick={() => setSec((s) => Math.max(0, s - 15))} className="w-12 h-12 rounded-full border border-white/10 text-sm">
            −15
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="w-20 h-20 rounded-full bg-[#e8dfd2] text-[#1a1a1a]"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button type="button" onClick={() => setSec((s) => Math.min(total, s + 15))} className="w-12 h-12 rounded-full border border-white/10 text-sm">
            +15
          </button>
        </div>
      </div>
    </div>
  );
}

function Gate() {
  const params = useSearchParams();
  const raw = params.get("session");
  if (!raw) return <Breathe />;
  return <AudioPlayer raw={raw} />;
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="pt-10 text-[#8a847a]">Loading…</div>}>
      <Gate />
    </Suspense>
  );
}
