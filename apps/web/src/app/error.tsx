"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { CtaButton } from "@/components/twilight/controls";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0c0e12] px-6 text-center text-white">
      <GymBackdrop className="absolute inset-0 opacity-40" />
      <div className="relative z-10 flex max-w-md flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#f87171]/30 bg-[#f87171]/10">
          <AlertTriangle className="h-8 w-8 text-[#f87171]" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 font-serif text-2xl font-medium text-white">خطایی پیش آمد</h1>
        <p className="mt-2 max-w-md text-sm leading-7 text-[#8e98a8]">
          در نمایش این بخش مشکلی پیش آمد. دوباره تلاش کن؛ اگر ادامه داشت صفحه را نو کن.
        </p>
        <div className="mt-7 flex w-full items-center gap-3">
          <CtaButton onClick={() => retry()} className="text-xs">
            تلاش مجدد
          </CtaButton>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-[#1b222c] px-4 py-3 text-xs font-bold tracking-wide text-white transition-colors hover:bg-[#252d3d]"
          >
            صفحه اصلی
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-[#8e98a8]" dir="ltr">
            کد خطا: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
