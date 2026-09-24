import { WifiOff, RefreshCw } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "آفلاین | جیم‌آپ",
  robots: "noindex, nofollow",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
        <WifiOff className="h-9 w-9 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-xl font-bold tracking-tight">اتصال اینترنت برقرار نیست</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        به نظر می‌رسد آفلاین هستید. برخی بخش‌های جیم‌آپ به صورت آفلاین در دسترس هستند — برای ادامه، اتصال را بررسی کنید.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="ml-2 h-4 w-4" />
          تلاش مجدد
        </Link>
        <Link
          href="/athlete/checkin"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-semibold hover:bg-muted"
        >
          رفتن به چک‌این
        </Link>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">نکته: چک‌این‌های آفلاین هنگام اتصال همگام می‌شوند.</p>
    </div>
  );
}
