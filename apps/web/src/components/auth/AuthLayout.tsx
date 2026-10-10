"use client";

import { Heart, Sparkles } from "lucide-react";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";
import { MicroLabel } from "@/components/twilight/Type";
import { LumiLogo } from "@/components/ui/LumiLogo";

/**
 * Brand wordmark: cream dot + the official LUMI WELLNESS SVG logo.
 * The only wordmark in the app — no Persian "لومی" text version exists.
 */
export function LumiWordmark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_80%,transparent)]" />
      <LumiLogo size="sm" variant="auto" showSubtitle={false} ariaLabel="Lumi Wellness" />
    </span>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
}

export function AuthLayout({ children, showLogo = true }: AuthLayoutProps) {
  return (
    <main id="main" className="relative flex min-h-svh flex-col overflow-hidden bg-background lg:flex-row lg:items-center lg:justify-end lg:p-10">
      {/* Side scenic panel — GymBackdrop + copy (desktop) */}
      <div className="absolute inset-y-0 left-0 hidden w-[56%] overflow-hidden lg:block">
        <GymBackdrop className="absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-between p-14 text-logo-ink-inverse">
          <MicroLabel className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            MOVE WITH LOVE
          </MicroLabel>
          <div className="max-w-lg">
            {/* Marketing headline, not the page title (the form owns the h1) */}
            <p className="font-serif text-5xl font-medium leading-tight text-logo-ink-inverse">
              قوی‌تر از
              <br />
              <span className="text-primary">دیروزت</span> باش.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-7 text-logo-ink-inverse/70">
              تمرین، انگیزه و پیشرفت روزانه در فضایی ساخته‌شده برای بانوانی که انتخاب می‌کنند بدرخشند.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-logo-ink-inverse/70">
            <Heart className="h-4 w-4 fill-primary text-primary" strokeWidth={1.75} />
            هر حرکت، یک قدم به خودِ بهترت
          </p>
        </div>
      </div>

      {/* Mobile scenic backdrop */}
      <div className="absolute inset-0 lg:hidden">
        <GymBackdrop className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/85 via-background/30 to-background/95 dark:from-background/55 dark:via-background/15 dark:to-background/90" />
      </div>

      {/* Soft cream glow behind the card (monochrome, desktop) */}
      <div className="pointer-events-none absolute left-[7%] top-1/2 hidden h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-primary/[0.04] blur-[100px] lg:block" />

      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:justify-center lg:mx-0 lg:ml-[7%] lg:mr-[7%] lg:flex-none lg:px-0 lg:py-0">
        {showLogo && (
          <div className="mb-6 flex items-center justify-center lg:justify-start">
            <div className="flex flex-col items-center gap-1.5 lg:items-start">
              <LumiLogo variant="auto" size="sm" ariaLabel="Lumi Wellness" />
              <p className="text-[11px] leading-tight text-muted-foreground">پلتفرم مدیریت هوشمند باشگاه</p>
            </div>
          </div>
        )}
        {children}
      </div>
    </main>
  );
}
