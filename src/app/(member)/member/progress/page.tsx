import { auth } from "@/lib/auth";
import { getProgressEntries } from "@/server/actions/progress";
import { getWorkoutProgress, getWorkoutSetsProgress } from "@/server/actions/workouts";
import { redirect } from "next/navigation";
import ProgressClient from "@/components/ProgressClient";

export default async function MemberProgressPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Fetch data on server and wrap in JSON parse/stringify to prevent Decimal serialization issues
  const initialEntries = JSON.parse(JSON.stringify(await getProgressEntries()));
  const initialWorkoutProgress = JSON.parse(JSON.stringify(await getWorkoutProgress(session.user.id)));
  const initialWorkoutSetsProgress = JSON.parse(JSON.stringify(await getWorkoutSetsProgress(session.user.id)));

  return (
    <ProgressClient 
      initialEntries={initialEntries} 
      initialWorkoutProgress={initialWorkoutProgress} 
      initialWorkoutSetsProgress={initialWorkoutSetsProgress}
    />
  );
}
