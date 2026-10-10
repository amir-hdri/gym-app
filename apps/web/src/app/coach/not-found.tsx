import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

/** Coach-portal 404 within the shell — the dock stays reachable. */
export default function CoachNotFound() {
  return (
    <div className="mx-auto my-6 w-full max-w-lg rounded-[28px] border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Compass className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold tracking-tight">این بخش وجود ندارد.</h1>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        نشانی اشتباه است یا این بخش جابه‌جا شده — داک پایین راه تو را به جای درست می‌رساند.
      </p>
      <Link
        href="/coach"
        className="ring-focus mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        بازگشت به داشبورد مربی
      </Link>
    </div>
  );
}
