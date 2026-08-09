export const dynamic = "force-dynamic";

import { getTrainerDashboardData } from "@/server/actions/trainer-panel";
import TrainerMembersClient from "@/components/TrainerMembersClient";

export default async function TrainerMembersPage() {
  const data = await getTrainerDashboardData();
  return <TrainerMembersClient data={data} />;
}
