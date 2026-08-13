import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  const bars = [40, 55, 70, 88, 60, 35, 50];
  return (
    <div>
      <PageTitle title="Growth" sub="How your rooms are landing" />
      <SoftCard className="p-5">
        <div className="h-[160px] flex items-end gap-2">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 bar h-full relative">
              <div className="bar-fill absolute bottom-0 left-0 right-0" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      </SoftCard>
      <SoftCard className="p-5 mt-4">
        <p className="text-[11px] tracking-widest text-[#8a847a]">COMPLETIONS</p>
        <p className="font-serif text-[36px] mt-1">82%</p>
      </SoftCard>
    </div>
  );
}
