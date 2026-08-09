export const dynamic = "force-dynamic";

import { getTrainerDashboardData } from "@/server/actions/trainer-panel";
import TrainerRoutinesClient from "@/components/TrainerRoutinesClient";

export default async function TrainerRoutinesPage() {
  const data = await getTrainerDashboardData();
  return <TrainerRoutinesClient data={data} />;
}
