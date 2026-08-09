export const dynamic = "force-dynamic";

import { getTrainerDashboardData } from "@/server/actions/trainer-panel";
import TrainerProgressClient from "@/components/TrainerProgressClient";

export default async function TrainerProgressPage() {
  const data = await getTrainerDashboardData();
  return <TrainerProgressClient data={data} />;
}
