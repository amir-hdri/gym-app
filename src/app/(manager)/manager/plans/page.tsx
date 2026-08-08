export const dynamic = "force-dynamic";
import { listPlans } from "@/server/actions/plans";
import PlansClient from "@/components/PlansClient";

export default async function PlansPage() {
  const plans = JSON.parse(JSON.stringify(await listPlans()));

  return <PlansClient initialPlans={plans} />;
}

