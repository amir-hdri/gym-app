import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Presence" sub="Who is sitting right now" />
      <SoftCard className="p-5 mb-4">
        <p className="text-[11px] tracking-widest text-[#8a847a]">IN SESSION</p>
        <p className="font-serif text-[40px] mt-1">214</p>
      </SoftCard>
      <div className="space-y-2">
        {["Letting Go room", "Ocean Breath", "Night Wind"].map((r, i) => (
          <SoftCard key={r} className="px-4 py-4 flex justify-between">
            <span>{r}</span>
            <span className="text-[#8a847a]">{[96, 71, 47][i]} listening</span>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
