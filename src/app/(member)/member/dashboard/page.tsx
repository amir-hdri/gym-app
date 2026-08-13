"use client";

import Link from "next/link";
import SessionRow from "@/components/SessionRow";
import { sessions } from "@/lib/catalog";

const cats = [
  { label: "Sleep", href: "/member/schedule?cat=sleep", d: "M14 4a7 7 0 1 0 6 10A8 8 0 0 1 14 4z" },
  { label: "Focus", href: "/member/schedule?cat=focus", d: "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 2v2M12 20v2M2 12h2M20 12h2" },
  { label: "Breathing", href: "/member/bookings", d: "M3 14c3.5-6 7-6 9 0 2 6 5.5 6 9 0" },
  { label: "Stress", href: "/member/schedule?cat=stress", d: "M4 12c2.5-1.5 4-1.5 6 0s3.5 1.5 6 0 3.5-1.5 6 0M4 17c2.5-1.5 4-1.5 6 0s3.5 1.5 6 0 3.5-1.5 6 0" },
  { label: "Music", href: "/member/schedule?cat=music", d: "M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" },
];

export default function HomePage() {
  const continueItems = ["morning", "anxiety"]
    .map((id) => sessions.find((s) => s.id === id))
    .filter(Boolean) as typeof sessions;

  return (
    <div className="space-y-7">
      <header className="flex items-start justify-between pt-1 gap-3">
        <div>
          <h1 className="font-serif text-[34px] leading-none text-[#f3eee6]">Good evening</h1>
          <p className="mt-2 text-[14px] text-[#8d877d]">Ready to wind down?</p>
        </div>
        <Link
          href="/member/progress"
          className="mt-1 flex items-center gap-1.5 rounded-full border border-white/10 px-3 h-8 text-[11px] tracking-[0.08em] text-[#cfc6b8] shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 12c2-5 4-5 5 0s3 5 5 0" />
          </svg>
          5 DAYS
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-[28px] min-h-[340px]">
        <img src="/hero-dusk.jpg" alt="Misty mountains at dusk" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/55" />
        <div className="relative p-6 flex flex-col min-h-[340px]">
          <p className="text-[11px] tracking-[0.18em] text-white/70">DAILY RECOMMENDATION</p>
          <h2 className="font-serif text-[36px] leading-[1.05] mt-4 text-white max-w-[240px]">The Art of Letting Go</h2>
          <p className="mt-4 text-[14px] leading-relaxed text-white/75 max-w-[280px]">
            A gentle, grounding practice to release the mental weight of the day and prepare the mind for deep rest.
          </p>
          <div className="mt-auto pt-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] text-white/75">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v5l3 2" />
              </svg>
              15 min · Sleep
            </div>
            <Link
              href="/member/bookings?session=letting-go"
              className="inline-flex h-10 px-5 rounded-full bg-black/35 border border-white/15 text-white text-sm backdrop-blur-md items-center"
            >
              Begin
              <svg className="ml-1.5" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 6v12l10-6z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {cats.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="shrink-0 w-[76px] h-[86px] card-soft rounded-[22px] flex flex-col items-center justify-center gap-2 text-[12px] text-[#c9c2b6]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d={c.d} />
            </svg>
            {c.label}
          </Link>
        ))}
      </section>

      <section className="space-y-2.5">
        <h3 className="text-[20px] font-medium text-[#f0ebe3]">Continue listening</h3>
        {continueItems.map((item) => (
          <SessionRow key={item.id} item={item} />
        ))}
      </section>
    </div>
  );
}
