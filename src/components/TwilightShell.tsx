"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Tab = { href: string; label: string; icon: ReactNode };

export default function TwilightShell({
  children,
  tabs,
  homeHref,
}: {
  children: ReactNode;
  tabs: Tab[];
  homeHref: string;
}) {
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
          <div className="nav-pill rounded-full flex items-center justify-between px-4 h-[58px]">
            {tabs.map((tab) => {
              const active =
                pathname === tab.href ||
                (tab.href !== homeHref && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  className={`relative flex items-center justify-center w-11 h-11 rounded-full ${
                    active ? "text-[#ece6dc]" : "text-white/30"
                  }`}
                >
                  {tab.icon}
                  {active && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#ece6dc]" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-serif text-[34px] leading-none text-[#f3eee6]">{title}</h1>
      {sub && <p className="mt-2 text-[14px] text-[#8d877d]">{sub}</p>}
    </header>
  );
}

export function SoftCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card-soft rounded-[24px] ${className}`}>{children}</div>;
}

export const I = {
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  people: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c1.2-3 3.4-4.5 5.5-4.5S13.3 16 14.5 19" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 14.6c2 .3 3.6 1.6 4.5 4.4" />
    </svg>
  ),
  card: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 19V5M4 19h16M7 14l4-5 3 3 5-7" />
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19c1.4-3 3.8-4.5 6.5-4.5S17.1 16 18.5 19" />
    </svg>
  ),
  cal: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 16V10a6 6 0 1 1 12 0v6M5 16h14M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  gear: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
};
