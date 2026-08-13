import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Guides" sub="Voices behind the sessions" />
      <div className="space-y-3">
        {[
          ["Elena Voss", "Sleep & stories"],
          ["Jonah Hale", "Breathwork"],
          ["Mira Sol", "Focus & zen"],
        ].map(([n, r]) => (
          <SoftCard key={n} className="px-4 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#242424]" />
            <div>
              <p>{n}</p>
              <p className="text-[12px] text-[#8a847a]">{r}</p>
            </div>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
