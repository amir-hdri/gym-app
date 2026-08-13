import Link from "next/link";
import { PageTitle, SoftCard } from "@/components/TwilightShell";

export default function Page() {
  return (
    <div>
      <PageTitle title="Settings" sub="Studio preferences" />
      <SoftCard className="divide-y divide-white/[0.06]">
        {[
          ["/manager/plans", "Membership plans"],
          ["/manager/freeze-requests", "Pause requests"],
          ["/manager/notifications", "Studio alerts"],
          ["/manager/attendance", "Presence & rooms"],
          ["/sign-in", "Sign out"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="flex items-center justify-between px-4 h-[56px] w-full text-[15px]">
            {label}
            <span className="text-[#6f6a62]">›</span>
          </Link>
        ))}
      </SoftCard>
    </div>
  );
}
