"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const tabs = [
  {
    href: "/member/dashboard",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/member/schedule",
    label: "Explore",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <path d="m14.8 9.2-1.2 5.4-5.4 1.2 1.2-5.4z" />
      </svg>
    ),
  },
  {
    href: "/member/bookings",
    label: "Breathe",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 14c3-6 6-6 8 0 2 6 5 6 8 0" />
        <path d="M4 9c3-5 6-5 8 0" />
      </svg>
    ),
  },
  {
    href: "/member/progress",
    label: "Journey",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 14 4-5 3 3 5-7" />
      </svg>
    ),
  },
  {
    href: "/member/profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19c1.4-3 3.8-4.5 6.5-4.5S17.1 16 18.5 19" />
      </svg>
    ),
  },
];

export default function MemberLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-[#0c0c0c] text-[#ece6dc]">
      <div className="mx-auto w-full max-w-[430px] min-h-[100dvh] relative sm:phone-shell">
        <main id="main-content" className="px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-28">
          {children}
        </main>

        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 z-30"
          aria-label="Primary"
        >
          <div className="nav-pill rounded-full flex items-center justify-between px-5 h-[58px]">
            {tabs.map((tab) => {
              const active =
                pathname === tab.href ||
                (tab.href !== "/member/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                    active ? "text-[#ece6dc]" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {tab.icon}
                  {active && (
                    <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#ece6dc]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
