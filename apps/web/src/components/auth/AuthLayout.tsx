"use client";

import { Heart, Sparkles } from "lucide-react";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";
import { MicroLabel } from "@/components/twilight/Page";

/**
 * Reference wordmark: cream dot + serif name + muted latin kicker
 * (matches components/layout/Header.tsx).
 */
export function LumiWordmark() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-[#d2c0a5] shadow-[0_0_8px_rgba(210,192,165,0.8)]" />
      <span className="font-serif text-lg font-semibold tracking-tight text-white">لومی</span>
      <span dir="ltr" className="pt-0.5 text-[10px] font-normal tracking-widest text-[#8e98a8]">
        LUMI WELLNESS
      </span>
    </div>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
}

export function AuthLayout({ children, showLogo = true }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#0c0e12] lg:flex-row lg:items-center lg:justify-end lg:p-10">
      {/* Side scenic panel — GymBackdrop + copy (desktop) */}
      <div className="absolute inset-y-0 left-0 hidden w-[56%] overflow-hidden lg:block">
        <GymBackdrop className="absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-between p-14 text-white">
          <MicroLabel className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            MOVE WITH LOVE
          </MicroLabel>
          <div className="max-w-lg">
            <h1 className="font-serif text-5xl font-medium leading-tight text-white">
              قوی‌تر از
              <br />
              <span className="text-[#d2c0a5]">دیروزت</span> باش.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
              تمرین، انگیزه و پیشرفت روزانه در فضایی ساخته‌شده برای بانوانی که انتخاب می‌کنند بدرخشند.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-white/70">
            <Heart className="h-4 w-4 fill-[#d2c0a5] text-[#d2c0a5]" strokeWidth={1.75} />
            هر حرکت، یک قدم به خودِ بهترت
          </p>
        </div>
      </div>

      {/* Mobile scenic backdrop */}
      <div className="absolute inset-0 lg:hidden">
        <GymBackdrop className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0c0e12]/55 via-[#0c0e12]/15 to-[#0c0e12]/90" />
      </div>

      {/* Soft cream glow behind the card (monochrome, desktop) */}
      <div className="pointer-events-none absolute left-[7%] top-1/2 hidden h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[#d2c0a5]/[0.04] blur-[100px] lg:block" />

      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:justify-center lg:mx-0 lg:ml-[7%] lg:mr-[7%] lg:flex-none lg:px-0 lg:py-0">
        {showLogo && (
          <div className="mb-6 flex items-center justify-center lg:justify-start">
            <div className="flex flex-col items-center gap-1.5 lg:items-start">
              <LumiWordmark />
              <p className="text-[11px] leading-tight text-[#8e98a8]">پلتفرم مدیریت هوشمند باشگاه</p>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
