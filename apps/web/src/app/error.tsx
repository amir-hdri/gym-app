"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h1 className="mt-5 text-xl font-bold text-foreground">خطایی پیش آمد</h1>
      <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
        در نمایش این بخش مشکلی پیش آمد. دوباره تلاش کن؛ اگر ادامه داشت صفحه را نو کن.
      </p>
      <div className="mt-7 flex items-center gap-3">
        <button
          onClick={() => retry()}
          className="ring-focus inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary-solid px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-solid/90 active:scale-[0.98]"
        >
          تلاش مجدد
        </button>
        <Link
          href="/"
          className="ring-focus inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-accent"
        >
          صفحه اصلی
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-muted-foreground/70" dir="ltr">
          کد خطا: {error.digest}
        </p>
      )}
    </div>
  );
}
