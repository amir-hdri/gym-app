import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div className="space-y-5">
      <PageTitle title="Billing" sub="Mindful Plus revenue" />
      <div className="grid grid-cols-2 gap-3">
        <SoftCard className="p-5">
          <p className="text-[11px] text-[#8a847a] tracking-widest">THIS MONTH</p>
          <p className="font-serif text-[32px] mt-2">$18.4k</p>
        </SoftCard>
        <SoftCard className="p-5">
          <p className="text-[11px] text-[#8a847a] tracking-widest">RENEWALS</p>
          <p className="font-serif text-[32px] mt-2">96%</p>
        </SoftCard>
      </div>
      <SoftCard className="divide-y divide-white/[0.06]">
        {[
          ["Sarah Chen", "Plus · $9.99"],
          ["Noah Patel", "Plus · $9.99"],
          ["Studio gift", "Annual · $79"],
        ].map(([n, m]) => (
          <div key={n} className="px-4 py-4 flex justify-between text-sm">
            <span>{n}</span>
            <span className="text-[#8a847a]">{m}</span>
          </div>
        ))}
      </SoftCard>
    </div>
  );
}
