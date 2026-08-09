export const dynamic = "force-dynamic";

import { getTrainerDashboardData } from "@/server/actions/trainer-panel";
import TrainerProfileClient from "@/components/TrainerProfileClient";

export default async function TrainerProfilePage() {
  const data = await getTrainerDashboardData();
  return <TrainerProfileClient data={data} />;
}
