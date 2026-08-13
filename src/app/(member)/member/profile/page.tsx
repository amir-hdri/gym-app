"use client";

import Link from "next/link";

const rows = [
  {
    title: "Notifications",
    href: "/member/notifications",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M6 16V10a6 6 0 1 1 12 0v6" />
        <path d="M5 16h14" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    title: "Sound Preferences",
    href: "/member/membership",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10v4" />
      </svg>
    ),
  },
  {
    title: "Privacy & Security",
    href: "/member/payments",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3 5 6.5v5.2c0 4.3 2.9 7.4 7 8.8 4.1-1.4 7-4.5 7-8.8V6.5L12 3z" />
        <path d="m9.5 12 1.8 1.8 3.4-3.6" />
      </svg>
    ),
  },
];

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center pt-2">
        <div className="relative">
          <img
            src="/avatar-sarah.jpg"
            alt="Sarah"
            className="w-[92px] h-[92px] rounded-full object-cover ring-[3px] ring-[#d8cfc0]/70"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#d8cfc0]/40 flex items-center justify-center text-[#d8cfc0]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3 14.2 8.4 20 9.2l-4.2 3.8 1.2 5.6L12 16.3 7 18.6l1.2-5.6L4 9.2l5.8-.8z" />
            </svg>
          </span>
        </div>
        <h1 className="font-serif text-[34px] mt-4">Sarah</h1>
        <p className="text-[13px] text-[#8a847a] mt-1">Premium Member since 2024</p>
      </div>

      <div className="grid grid-cols-3 text-center">
        {[
          ["142", "SESSIONS"],
          ["12d", "LONGEST"],
          ["24", "COURSES"],
        ].map(([n, l], i) => (
          <div key={l} className={i === 1 ? "border-x border-white/10" : ""}>
            <p className="font-serif text-[28px] leading-none">{n}</p>
            <p className="text-[10px] tracking-[0.14em] text-[#8a847a] mt-2">{l}</p>
          </div>
        ))}
      </div>

      <section className="card-soft rounded-[24px] p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center text-[#d8cfc0]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M8 12c2-6 4-6 4 0s2 6 4 0" />
              <path d="M12 4v2M12 18v2" />
            </svg>
          </div>
          <div>
            <p className="text-[15px]">Mindful Plus</p>
            <p className="text-[12px] text-[#8a847a]">Your plan expires in 12 days</p>
          </div>
        </div>
        <Link
          href="/member/membership"
          className="mt-4 h-12 rounded-full bg-[#e8dfd2] text-[#1c1c1c] text-[14px] font-medium w-full inline-flex items-center justify-center"
        >
          Manage Subscription
        </Link>
      </section>

      <section>
        <p className="text-[11px] tracking-[0.16em] text-[#7c766c] mb-3">ACCOUNT SETTINGS</p>
        <div className="card-soft rounded-[24px] divide-y divide-white/[0.06] overflow-hidden">
          {[
            ...rows,
            { title: "Studio tools", href: "/manager/dashboard", icon: rows[0].icon },
            { title: "Guide desk", href: "/trainer/dashboard", icon: rows[0].icon },
            { title: "Sign in", href: "/sign-in", icon: rows[0].icon },
          ].map((r) => (
            <Link key={r.title} href={r.href} className="flex items-center gap-3 px-4 h-[58px] w-full text-left">
              <span className="text-[#cfc6b8]">{r.icon}</span>
              <span className="flex-1 text-[15px]">{r.title}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6f6a62" strokeWidth="1.7">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
