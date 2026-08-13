import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Library" sub="Scripts and sound beds" />
      <div className="space-y-3">
        {["7 Days of Zen", "Anxiety Relief", "Morning Energy", "Deep Ocean Sleep"].map((t) => (
          <SoftCard key={t} className="p-5 flex justify-between">
            <span>{t}</span>
            <span className="text-[#8a847a] text-sm">Edit</span>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
