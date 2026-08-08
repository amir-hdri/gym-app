"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";

const bottomNav = [
  { href:"/member/dashboard",  label:"خانه",    icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { href:"/member/membership", label:"کارت & QR", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { href:"/member/schedule",   label:"زمانبندی", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { href:"/member/bookings",   label:"کلاس‌ها", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href:"/member/progress",   label:"پیشرفت",icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { href:"/member/profile",    label:"پروفایل", icon:<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function MemberLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/30" style={{background:"linear-gradient(135deg,#c9184a,#ff758f)"}}>
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M6.5 6.5h11M6.5 17.5h11M4 12h16"/></svg>
          </div>
          <span className="text-sm font-bold gradient-text">جیم‌اپ</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/manager/dashboard" className="btn-glass rounded-xl px-3 py-1.5 text-[10px] sm:text-xs text-white/60 hover:text-white transition-all font-semibold">پنل مدیریت</Link>
          <button 
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="btn-glass rounded-xl px-3 py-1.5 text-[10px] sm:text-xs text-rose-400 hover:text-rose-300 font-bold transition-all">
            خروج
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-4 sm:py-6 pb-28 sm:pb-32 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom nav with safe-area support */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-white/[0.08] flex backdrop-blur-xl px-1" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}>
        {bottomNav.map((item) => {
          const active = pathname === item.href || (item.href !== "/member/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[9px] font-bold transition-all ${active ? "text-bubblegum_pink" : "text-white/35 hover:text-white/70"}`}>
              <span className={active ? "text-bubblegum_pink scale-110 transition-transform" : ""}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
