import Link from "next/link";
import { MicroLabel } from "@/components/twilight/Page";
import { GymBackdrop } from "@/components/twilight/GymBackdrop";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0c0e12] px-6 text-center text-white">
      <GymBackdrop className="absolute inset-0 opacity-40" />
      <div className="relative z-10 flex max-w-md flex-col items-center">
        <MicroLabel className="mb-4">404 — NOT FOUND</MicroLabel>
        <h1 className="font-serif text-6xl font-medium text-white sm:text-7xl" dir="ltr">
          404
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#8e98a8]">
          این صفحه پیدا نشد یا جابه‌جا شده است. آدرس را بررسی کن یا از ابتدا شروع کن.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex w-full max-w-[240px] items-center justify-center rounded-xl bg-[#d2c0a5] px-4 py-3 text-xs font-bold tracking-wide text-[#121417] shadow-lg shadow-black/40 transition-colors hover:bg-[#ded1bc]"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
