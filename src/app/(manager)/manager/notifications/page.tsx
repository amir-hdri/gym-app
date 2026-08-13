import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Alerts" />
      <SoftCard className="divide-y divide-white/[0.06]">
        {[
          ["Room capacity", "Ocean Breath is 90% full"],
          ["Renewal dip", "12 plans lapse this week"],
          ["New guide", "Mira Sol published Focus Hour"],
        ].map(([t, b]) => (
          <div key={t} className="px-4 py-4">
            <p>{t}</p>
            <p className="text-[13px] text-[#8a847a] mt-1">{b}</p>
          </div>
        ))}
      </SoftCard>
    </div>
  );
}
