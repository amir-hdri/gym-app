import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Pauses" sub="Members asking to rest a plan" />
      <div className="space-y-3">
        {[
          ["Amelia Ruiz", "2 weeks · travel"],
          ["Leo Park", "1 month · health"],
        ].map(([n, r]) => (
          <SoftCard key={n} className="p-5">
            <p>{n}</p>
            <p className="text-[13px] text-[#8a847a] mt-1">{r}</p>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 h-11 rounded-full bg-[#e8dfd2] text-[#1a1a1a] text-sm">Approve</button>
              <button className="flex-1 h-11 rounded-full border border-white/10 text-sm">Hold</button>
            </div>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
