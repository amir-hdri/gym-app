"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Portal-level error boundary content.
 *
 * Rendering this *inside* the portal layout (not at the root) is the point:
 * the root error page is a full-screen wall that unmounts the whole shell —
 * dock, header, drawer. A segment `error.tsx` keeps the shell mounted and
 * only swaps the page body, so a failed route does not throw the user out of
 * their navigation.
 *
 * Consumed by `apps/web/src/app/{athlete,coach,admin}/error.tsx`.
 */
export function PortalErrorView({
  error,
  retry,
  title = "این بخش بالا نیامد",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
}) {
  useEffect(() => {
    // The digest shown below is a hash, not the message — this log is the only
    // record of what actually happened.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto my-6 w-full max-w-lg rounded-[28px] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="h-5 w-5" aria-hidden="true" />
      </span>

      <h1 className="mt-4 text-xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        خطا سمت برنامه بوده، نه کاری که تو کردی. داده‌ای پاک نشده است. اول
        «تلاش دوباره» را بزن — بیشتر خطاهای موقت با همان برطرف می‌شوند.
      </p>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Button size="lg" onClick={retry} className="w-full sm:w-auto">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          تلاش دوباره
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          بارگذاری کامل صفحه
        </Button>
      </div>

      {error.digest && (
        <p className="mt-4 text-xs text-muted-foreground">
          کد پیگیری این خطا:{" "}
          <span dir="ltr" className="font-mono">
            {error.digest}
          </span>
        </p>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <Link
          href="/"
          className="ring-focus inline-flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
