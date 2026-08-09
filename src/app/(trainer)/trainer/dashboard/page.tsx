export const dynamic = "force-dynamic";

import { getTrainerDashboardData } from "@/server/actions/trainer-panel";
import TrainerDashboardClient from "@/components/TrainerDashboardClient";

export default async function TrainerDashboardPage() {
  const data = await getTrainerDashboardData();
  return <TrainerDashboardClient data={data} />;
}
