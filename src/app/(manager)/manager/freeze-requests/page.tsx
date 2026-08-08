export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { listFreezeRequests } from "@/server/actions/freeze";
import { redirect } from "next/navigation";
import FreezeRequestsClient from "@/components/FreezeRequestsClient";

export default async function FreezeRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const requests = JSON.parse(JSON.stringify(await listFreezeRequests()));

  return <FreezeRequestsClient initialRequests={requests} managerUserId={session.user.id} />;
}
