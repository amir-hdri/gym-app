"use client";

import { Heart, Sparkles } from "lucide-react";
import { ActivityRings } from "@/components/ui/ActivityRings";

interface AuthLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
}

export function AuthLayout({ children, showLogo = true }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 lg:justify-end lg:p-10">
      {/* Subtle background pattern */}
      <div className="absolute inset-y-0 left-0 hidden w-[56%] overflow-hidden bg-brand-surface lg:block">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-activity-stand/35 blur-[100px]" />
        <div className="absolute -bottom-24 right-0 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-[110px]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-14 text-white">
          <p className="latin-kicker flex items-center gap-2 text-white"><Sparkles className="h-4 w-4 text-activity-exercise" /> MOVE WITH LOVE</p>
          <div className="max-w-lg">
            <ActivityRings className="mb-8 h-52 w-52 animate-float" />
            <h1 className="text-5xl font-black leading-tight">قوی‌تر از<br/><span className="text-primary">دیروزت</span> باش.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">تمرین، انگیزه و پیشرفت روزانه در فضایی ساخته‌شده برای بانوانی که انتخاب می‌کنند بدرخشند.</p>
          </div>
          <p className="flex items-center gap-2 text-xs text-white/70"><Heart className="h-4 w-4 fill-primary text-primary" /> هر حرکت، یک قدم به خودِ بهترت</p>
        </div>
      </div>
      
      {/* Top-right decorative blur */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      
      {/* Bottom-left decorative blur */}
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-[350px] w-[350px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-[440px] lg:ml-[7%] lg:mr-[7%]">
        {showLogo && (
          <div className="mb-7 flex items-center justify-center lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface shadow-lg dark:bg-white/10">
                <ActivityRings className="h-9 w-9" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gradient-brand leading-tight">جیم‌آپ</h2>
                <p className="text-[11px] text-muted-foreground leading-tight">پلتفرم مدیریت هوشمند باشگاه</p>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
