import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Your students" sub="People following your voice" />
      <div className="space-y-2.5">
        {["Sarah Chen", "Noah Patel", "Amelia Ruiz", "Leo Park"].map((n) => (
          <SoftCard key={n} className="px-4 py-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#242424]" />
            <div>
              <p>{n}</p>
              <p className="text-[12px] text-[#8a847a]">Completed 3 of your sits</p>
            </div>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
