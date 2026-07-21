import { auth } from "@/lib/auth";
import { listAttendance } from "@/server/actions/attendance";
import { redirect } from "next/navigation";
import AttendanceClient from "@/components/AttendanceClient";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const logs = JSON.parse(JSON.stringify(await listAttendance(undefined, 50)));

  return <AttendanceClient initialLogs={logs} managerUserId={session.user.id} />;
}

