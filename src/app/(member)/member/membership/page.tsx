import { auth } from "@/lib/auth";
import { getMember } from "@/server/actions/members";
import { listPlans } from "@/server/actions/plans";
import { redirect } from "next/navigation";
import MembershipClient from "@/components/MembershipClient";

export default async function MemberMembershipPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const member = JSON.parse(JSON.stringify(await getMember(session.user.id)));
  const plans = JSON.parse(JSON.stringify(await listPlans()));

  return <MembershipClient member={member} plans={plans} />;
}

