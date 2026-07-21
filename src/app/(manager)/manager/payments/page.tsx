import { auth } from "@/lib/auth";
import { listPayments } from "@/server/actions/payments";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PaymentsClient from "@/components/PaymentsClient";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const payments = JSON.parse(JSON.stringify(await listPayments(100)));

  // Fetch pending/active subscriptions for manual payment assignment
  const pendingSubs = JSON.parse(JSON.stringify(await prisma.subscription.findMany({
    where: {
      status: { in: ["PENDING", "ACTIVE"] },
    },
    include: {
      member: {
        include: { user: true },
      },
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  })));

  return (
    <PaymentsClient 
      initialPayments={payments} 
      pendingSubs={pendingSubs} 
      managerUserId={session.user.id} 
    />
  );
}

