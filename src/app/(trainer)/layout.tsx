"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";

const nav = [
  {
    href: "/trainer/dashboard",
    label: "داشبورد مربی",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/trainer/members",
    label: "ورزشکاران من",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/trainer/routines",
    label: "برنامه‌های تمرینی",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    href: "/trainer/classes",
    label: "کلاس‌ها و کارگاه‌ها",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/trainer/progress",
    label: "ثبت پیشرفت و رکورد",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: "/trainer/profile",
    label: "پروفایل و رزومه",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function TrainerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Top bar */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/40"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold leading-none gradient-text">جیم‌اپ</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                پنل مربی
              </span>
            </div>
            <p className="text-[10px] text-white/40 mt-0.5">پورتال کادر فنی و مربیان باشگاه</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/manager/dashboard"
            className="btn-glass rounded-xl px-3 py-1.5 text-xs text-white/70 hover:text-white transition-all font-semibold hidden sm:inline-flex"
          >
            پنل مدیریت
          </Link>
          <Link
            href="/member/dashboard"
            className="btn-glass rounded-xl px-3 py-1.5 text-xs text-white/70 hover:text-white transition-all font-semibold"
          >
            پنل ورزشکاران ←
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in?role=trainer" })}
            className="btn-glass rounded-xl px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-all"
          >
            خروج
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-l border-white/[0.07] bg-white/[0.02] backdrop-blur-xl py-4 px-2.5 gap-1 overflow-y-auto">
          <div className="px-3 py-2 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>کادر مربیان اختصاصی</span>
          </div>

          {nav.map((item, i) => {
            const active =
              pathname === item.href ||
              (item.href !== "/trainer/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`anim-slide-r flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative overflow-hidden group
                  ${
                    active
                      ? "text-amber-400 border border-amber-500/30 shadow-md shadow-amber-950/20"
                      : "text-white/40 hover:text-white/80 hover:-translate-x-0.5"
                  }`}
                style={{
                  animationDelay: `${i * 30}ms`,
                  ...(active
                    ? { background: "linear-gradient(90deg,rgba(245,158,11,.18),rgba(245,158,11,.06))" }
                    : {}),
                }}
              >
                {active && (
                  <span className="absolute right-0 top-1 bottom-1 w-0.5 rounded-l-full bg-amber-400" />
                )}
                <span
                  className={
                    active ? "text-amber-400" : "text-white/30 group-hover:text-white/60"
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={() => signOut({ callbackUrl: "/sign-in?role=trainer" })}
            className="mt-auto flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:-translate-x-0.5 transition-all text-right w-full border border-transparent hover:border-rose-950/20"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>خروج از حساب مربی</span>
          </button>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-8 px-3.5 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-white/[0.08] flex backdrop-blur-xl px-1"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/trainer/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[9px] font-bold transition-colors ${
                active ? "text-amber-400" : "text-white/35 hover:text-white/70"
              }`}
            >
              <span className={active ? "text-amber-400 scale-110 transition-transform" : ""}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
