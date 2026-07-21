"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/manager/dashboard", label: "داشبورد", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { href: "/manager/members",   label: "اعضا",   icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: "/manager/plans",     label: "طرح‌های اشتراک",     icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { href: "/manager/payments",  label: "پرداخت‌ها",  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { href: "/manager/freeze-requests", label: "درخواست‌های تعلیق", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> },
  { href: "/manager/attendance",label: "حضور و غیاب",icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  { href: "/manager/classes",   label: "کلاس‌ها",   icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  { href: "/manager/trainers",  label: "مربیان",  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg> },
  { href: "/manager/notifications", label: "اعلان‌ها", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { href: "/manager/settings",  label: "تنظیمات",  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="glass sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{background:"linear-gradient(135deg,#c9184a,#ff758f)",boxShadow:"0 4px 16px rgba(201,24,74,.4)"}}>
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M6.5 6.5h11M6.5 17.5h11M4 12h16"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold leading-none" style={{background:"linear-gradient(135deg,#fff 60%,rgba(255,255,255,.4))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>جیم‌اپ</p>
            <p className="text-[10px] text-white/40 mt-0.5">پورتال مدیریت</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/member/dashboard" className="btn-glass rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white/90">پنل اعضا ←</Link>
          <button 
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="btn-glass rounded-lg px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold">
            خروج
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-[200px] shrink-0 border-l border-white/[0.07] bg-white/[0.02] backdrop-blur-xl py-3 px-2 gap-0.5 overflow-y-auto">
          {nav.map((item, i) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className={`anim-slide-r flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative overflow-hidden group
                  ${active
                    ? "text-bubblegum_pink border border-rosewood/20"
                    : "text-white/40 hover:text-white/80 hover:-translate-x-0.5"
                  }`}
                style={{
                  animationDelay: `${i * 40}ms`,
                  ...(active ? { background: "linear-gradient(90deg,rgba(201,24,74,.15),rgba(201,24,74,.05))" } : {})
                }}>
                {active && <span className="absolute right-0 top-1 bottom-1 w-0.5 rounded-l-full bg-bubblegum_pink"/>}
                <span className={active ? "text-bubblegum_pink" : "text-white/30 group-hover:text-white/60"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          
          <button 
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="mt-auto flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:-translate-x-0.5 transition-all text-right w-full border border-transparent hover:border-rose-950/20">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            <span>خروج از حساب</span>
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6 px-4 py-5">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t border-white/[0.07] flex">
        {nav.slice(0,5).map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[9px] font-bold transition-colors ${active ? "text-bubblegum_pink" : "text-white/30"}`}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
