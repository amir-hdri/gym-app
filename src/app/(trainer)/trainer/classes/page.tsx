import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Your sessions" />
      <div className="space-y-3">
        {[
          ["Letting Go", "Live tonight · 214 reserved"],
          ["Ocean Breath", "Weekly · Sundays"],
          ["Focus Hour", "Draft"],
        ].map(([t, s]) => (
          <SoftCard key={t} className="p-5">
            <p>{t}</p>
            <p className="text-[13px] text-[#8a847a] mt-1">{s}</p>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
