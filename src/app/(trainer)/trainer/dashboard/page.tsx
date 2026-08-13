import Link from "next/link";
import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Good evening" sub="Elena · 3 sessions live tonight" />
      <div className="grid grid-cols-2 gap-3">
        {[
          ["38", "In your rooms"],
          ["4.8", "Guide rating"],
        ].map(([n, l]) => (
          <SoftCard key={l} className="p-5">
            <p className="text-[11px] tracking-widest text-[#8a847a]">{l.toUpperCase()}</p>
            <p className="font-serif text-[32px] mt-2">{n}</p>
          </SoftCard>
        ))}
      </div>
      <SoftCard className="overflow-hidden relative h-[180px]">
        <img src="/hero-dusk.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="relative p-5 h-full flex flex-col justify-end">
          <p className="text-[11px] tracking-widest text-white/70">NEXT LIVE</p>
          <p className="font-serif text-[28px]">The Art of Letting Go</p>
        </div>
      </SoftCard>
      <Link href="/trainer/routines" className="card-soft rounded-[22px] h-14 w-full text-sm flex items-center justify-center">
        Session library
      </Link>
    </div>
  );
}
