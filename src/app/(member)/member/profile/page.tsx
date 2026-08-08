export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { getMember } from "@/server/actions/members";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";

export default async function MemberProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const member = JSON.parse(JSON.stringify(await getMember(session.user.id)));

  return <ProfileClient user={member} />;
}

