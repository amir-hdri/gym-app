import { WifiOff, RefreshCw, Dumbbell } from "lucide-react";
import Link from "next/link";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";

export const metadata = {
  title: "آفلاین | Lumi Wellness",
  robots: "noindex, nofollow",
};

const ctaCream =
  "inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-scrim/40 transition-colors hover:bg-primary";
const ctaGhost =
  "inline-flex h-11 items-center justify-center rounded-xl border border-border bg-secondary px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary";

export default function OfflinePage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6 py-12 text-center text-foreground">
      <GymBackdrop className="absolute inset-0 opacity-40" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-border bg-card">
          <WifiOff className="h-9 w-9 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-serif text-2xl font-medium tracking-tight text-foreground">
          اتصال اینترنت برقرار نیست
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
          به نظر می‌رسد آفلاین هستید. برخی بخش‌های Lumi Wellness به صورت آفلاین در دسترس هستند — برای ادامه، اتصال را بررسی کنید.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className={ctaCream}>
            <RefreshCw className="ml-2 h-4 w-4" strokeWidth={1.75} />
            تلاش مجدد
          </Link>
          <Link href="/athlete/checkin" className={ctaGhost}>
            <Dumbbell className="ml-2 h-4 w-4" strokeWidth={1.75} />
            رفتن به چک‌این
          </Link>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">نکته: چک‌این‌های آفلاین هنگام اتصال همگام می‌شوند.</p>
      </div>
    </div>
  );
}
