import Link from "next/link";
import { iconPath, type SessionItem } from "@/lib/catalog";

export default function SessionRow({ item }: { item: SessionItem }) {
  return (
    <Link
      href={`/member/bookings?session=${item.id}`}
      className="card-soft rounded-[22px] px-4 py-3.5 flex items-center gap-3 w-full text-left"
    >
      <div className="w-11 h-11 rounded-full bg-[#242424] flex items-center justify-center text-[#d8cfc0] shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d={iconPath(item.icon)} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] truncate">{item.title}</p>
        <p className="text-[12px] text-[#8a847a]">{item.meta}</p>
      </div>
      <span className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 6v12l10-6z" />
        </svg>
      </span>
    </Link>
  );
}

export function BackLink({ href = "/member/profile", label = "Back" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[13px] text-[#8a847a] mb-4 h-auto min-h-0 py-1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M15 6 9 12l6 6" />
      </svg>
      {label}
    </Link>
  );
}
