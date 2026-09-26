import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="latin-kicker mb-4">404 — NOT FOUND</p>
      <h1 className="text-5xl font-black text-foreground sm:text-6xl">۴۰۴</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
        این صفحه پیدا نشد یا جابه‌جا شده است. آدرس را بررسی کن یا از ابتدا شروع کن.
      </p>
      <Link
        href="/"
        className="ring-focus mt-8 inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary-solid px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-solid/90 active:scale-[0.98]"
      >
        بازگشت به صفحه اصلی
      </Link>
    </div>
  );
}
