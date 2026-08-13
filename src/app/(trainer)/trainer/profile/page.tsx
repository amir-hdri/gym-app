import Link from "next/link";
import { SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="w-[92px] h-[92px] rounded-full bg-[#242424] ring-[3px] ring-[#d8cfc0]/50" />
        <div className="text-center -mb-2">
          <h1 className="font-serif text-[34px] leading-none mt-4">Elena Voss</h1>
          <p className="mt-2 text-[14px] text-[#8d877d]">Sleep & stories · Guide since 2023</p>
        </div>
      </div>
      <div className="grid grid-cols-3 text-center">
        {[
          ["48", "SESSIONS"],
          ["4.8", "RATING"],
          ["12k", "LISTENS"],
        ].map(([n, l]) => (
          <div key={l}>
            <p className="font-serif text-[26px]">{n}</p>
            <p className="text-[10px] tracking-widest text-[#8a847a] mt-1">{l}</p>
          </div>
        ))}
      </div>
      <SoftCard className="divide-y divide-white/[0.06]">
        <Link href="/sign-in" className="h-[56px] px-4 w-full justify-between flex">
          Sign out <span className="text-[#6f6a62]">›</span>
        </Link>
      </SoftCard>
    </div>
  );
}
