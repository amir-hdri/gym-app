export const dynamic = "force-dynamic";

import { getTrainerDashboardData } from "@/server/actions/trainer-panel";
import TrainerClassesClient from "@/components/TrainerClassesClient";

export default async function TrainerClassesPage() {
  const data = await getTrainerDashboardData();
  return <TrainerClassesClient data={data} />;
}
