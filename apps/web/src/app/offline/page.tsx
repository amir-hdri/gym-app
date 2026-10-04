import { WifiOff, RefreshCw, Dumbbell } from "lucide-react";
import Link from "next/link";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";

export const metadata = {
  title: "آفلاین | Lumi Wellness",
  robots: "noindex, nofollow",
};

const ctaCream =
  "inline-flex h-11 items-center justify-center rounded-xl bg-[#d2c0a5] px-6 text-sm font-bold text-[#121417] shadow-lg shadow-black/40 transition-colors hover:bg-[#ded1bc]";
const ctaGhost =
  "inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-[#1b222c] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#252d3d]";

export default function OfflinePage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0c0e12] px-6 py-12 text-center text-white">
      <GymBackdrop className="absolute inset-0 opacity-40" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/10 bg-[#161a22]">
          <WifiOff className="h-9 w-9 text-[#8e98a8]" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 font-serif text-2xl font-medium tracking-tight text-white">
          اتصال اینترنت برقرار نیست
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-7 text-[#8e98a8]">
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
        <p className="mt-8 text-xs text-[#8e98a8]">نکته: چک‌این‌های آفلاین هنگام اتصال همگام می‌شوند.</p>
      </div>
    </div>
  );
}
