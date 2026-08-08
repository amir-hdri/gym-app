export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { listClassSessions } from "@/server/actions/classes";
import { redirect } from "next/navigation";
import ManagerClassesClient from "@/components/ManagerClassesClient";

export default async function ClassesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const classes = JSON.parse(JSON.stringify(await listClassSessions()));

  return <ManagerClassesClient initialClasses={classes} />;
}
