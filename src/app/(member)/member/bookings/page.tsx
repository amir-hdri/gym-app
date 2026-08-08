export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { listClassSessions } from "@/server/actions/classes";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MemberBookingsClient from "@/components/MemberBookingsClient";

export default async function MemberBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const member = await prisma.memberProfile.findFirst({
    where: { userId: session.user.id }
  });

  if (!member) {
    redirect("/sign-in");
  }

  const classes = JSON.parse(JSON.stringify(await listClassSessions()));

  return (
    <MemberBookingsClient 
      initialClasses={classes} 
      memberProfileId={member.id} 
    />
  );
}
