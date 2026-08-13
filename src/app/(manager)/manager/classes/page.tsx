import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Sessions" sub="Live rooms and scheduled sits" />
      <div className="space-y-3">
        {[
          ["The Art of Letting Go", "Tonight · 21:00 · Sleep"],
          ["Morning Energy", "Tomorrow · 07:00 · Focus"],
          ["7 Days of Zen", "Course · 142 enrolled"],
        ].map(([t, s]) => (
          <SoftCard key={t} className="p-5">
            <p className="text-[16px]">{t}</p>
            <p className="text-[13px] text-[#8a847a] mt-1">{s}</p>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
