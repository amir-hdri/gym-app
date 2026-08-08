export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { getMember } from "@/server/actions/members";
import { getWorkoutRoutine } from "@/server/actions/workouts";
import {
  getMemberSessionStats,
  getMemberTodaySchedule,
} from "@/server/actions/attendance";
import { redirect } from "next/navigation";
import MemberDashboardClient from "@/components/MemberDashboardClient";

export default async function MemberDashboard() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [memberRaw, routineRaw, statsRaw, todaySchedulesRaw] = await Promise.all([
    getMember(session.user.id),
    getWorkoutRoutine(session.user.id),
    getMemberSessionStats(session.user.id),
    getMemberTodaySchedule(session.user.id),
  ]);

  const member = JSON.parse(JSON.stringify(memberRaw));
  const routine = JSON.parse(JSON.stringify(routineRaw));
  const initialStats = JSON.parse(JSON.stringify(statsRaw));
  const todaySchedules = JSON.parse(JSON.stringify(todaySchedulesRaw));

  return (
    <MemberDashboardClient
      member={member}
      routine={routine}
      initialStats={initialStats}
      todaySchedules={todaySchedules}
      userId={session.user.id}
    />
  );
}
