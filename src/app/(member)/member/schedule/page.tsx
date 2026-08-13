"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sessions } from "@/lib/catalog";
import SessionRow from "@/components/SessionRow";

const chips = ["All", "Meditation", "Sleep Stories", "Music"];

function ExploreInner() {
  const params = useSearchParams();
  const preset = params.get("cat");
  const [q, setQ] = useState("");
  const [chip, setChip] = useState(() => {
    if (preset === "sleep") return "Sleep Stories";
    if (preset === "music") return "Music";
    if (preset === "focus" || preset === "stress") return "Meditation";
    return "All";
  });
  const [showCourses, setShowCourses] = useState(false);

  useEffect(() => {
    if (preset === "sleep") setChip("Sleep Stories");
    else if (preset === "music") setChip("Music");
    else if (preset === "focus" || preset === "stress") setChip("Meditation");
    else if (!preset) setChip("All");
  }, [preset]);

  const items = useMemo(() => {
    return sessions.filter((p) => {
      if (p.kind === "course") return false;
      const matchQ = `${p.title} ${p.meta} ${p.blurb ?? ""}`.toLowerCase().includes(q.toLowerCase());
      if (!matchQ) return false;
      if (chip === "All") return true;
      if (chip === "Sleep Stories") return p.kind === "sleep";
      if (chip === "Music") return p.kind === "music";
      return p.kind === "meditation";
    });
  }, [q, chip]);

  const courses = sessions.filter((s) => s.kind === "course");

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-[34px] text-[#f3eee6]">Explore</h1>

      <label className="card-soft h-12 rounded-full flex items-center gap-3 px-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a847a" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find meditations, sounds..."
          className="bg-transparent outline-none text-[14px] w-full placeholder:text-[#6f6a62]"
          aria-label="Search sessions"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => {
              setChip(c);
              setShowCourses(false);
            }}
            className={`h-9 px-4 rounded-full text-[13px] shrink-0 border ${
              chip === c && !showCourses
                ? "bg-[#e8dfd2] text-[#1a1a1a] border-transparent"
                : "bg-transparent text-[#b8b1a5] border-white/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-[20px] font-medium">Featured Course</h2>
          <button
            type="button"
            onClick={() => setShowCourses((v) => !v)}
            className="text-[13px] text-[#9a9388] underline underline-offset-4 decoration-white/20 h-auto min-h-0 py-1"
          >
            {showCourses ? "Hide" : "See all"}
          </button>
        </div>
        <Link href="/member/bookings?session=zen" className="block relative overflow-hidden rounded-[24px] h-[210px]">
          <img src="/course-zen.jpg" alt="Misty mountains at sunrise" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-left">
            <p className="text-[11px] tracking-[0.16em] text-white/75">7 DAYS OF ZEN</p>
            <p className="font-serif text-[28px] text-white leading-tight mt-1">Mastering Stillness</p>
          </div>
        </Link>
        {showCourses && (
          <div className="mt-3 space-y-2">
            {courses.map((c) => (
              <SessionRow key={c.id} item={c} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[20px] font-medium mb-3">Popular Now</h2>
        <div className="space-y-2.5">
          {items.map((p) => (
            <SessionRow key={p.id} item={p} />
          ))}
          {items.length === 0 && (
            <p className="text-sm text-[#8a847a] py-6 text-center">No sessions match that search.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="pt-10 text-[#8a847a]">Loading…</div>}>
      <ExploreInner />
    </Suspense>
  );
}
