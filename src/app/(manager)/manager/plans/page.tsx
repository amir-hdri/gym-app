import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div className="space-y-3">
      <PageTitle title="Plans" sub="What members can unlock" />
      {[
        ["Free", "3 sessions / week", "$0"],
        ["Mindful Plus", "Unlimited + courses", "$9.99"],
        ["Studio", "Guides & live rooms", "$19"],
      ].map(([n, d, p]) => (
        <SoftCard key={n} className="p-5 flex justify-between items-center">
          <div>
            <p className="text-[16px]">{n}</p>
            <p className="text-[13px] text-[#8a847a]">{d}</p>
          </div>
          <p className="font-serif text-[24px]">{p}</p>
        </SoftCard>
      ))}
    </div>
  );
}
