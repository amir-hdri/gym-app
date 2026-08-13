import Link from "next/link";
import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Studio" sub="Twilight Meditation · tonight" />
      <div className="grid grid-cols-2 gap-3">
        {[
          ["1,284", "Active minds"],
          ["5.2k", "Hours this week"],
          ["96%", "Retention"],
          ["18", "Live sessions"],
        ].map(([n, l]) => (
          <SoftCard key={l} className="p-5">
            <p className="text-[11px] tracking-[0.14em] text-[#8a847a] uppercase">{l}</p>
            <p className="font-serif text-[32px] mt-2 leading-none">{n}</p>
          </SoftCard>
        ))}
      </div>
      <SoftCard className="p-5 space-y-3">
        <p className="text-[15px]">Tonight’s rooms</p>
        {[
          ["Letting Go", "Sleep · 214 listening"],
          ["Ocean Breath", "Live · 38 in room"],
          ["Focus Hour", "Starts 21:00"],
        ].map(([t, s]) => (
          <div key={t} className="flex justify-between text-sm border-t border-white/[0.06] pt-3">
            <span>{t}</span>
            <span className="text-[#8a847a]">{s}</span>
          </div>
        ))}
      </SoftCard>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/manager/notifications" className="card-soft rounded-[22px] h-14 text-sm flex items-center justify-center">Alerts</Link>
        <Link href="/manager/plans" className="card-soft rounded-[22px] h-14 text-sm flex items-center justify-center">Plans</Link>
        <Link href="/manager/attendance" className="card-soft rounded-[22px] h-14 text-sm flex items-center justify-center">Presence</Link>
        <Link href="/manager/trainers" className="card-soft rounded-[22px] h-14 text-sm flex items-center justify-center">Guides</Link>
      </div>
    </div>
  );
}
