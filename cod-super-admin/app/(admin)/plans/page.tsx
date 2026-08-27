import { listPlans } from "@/actions/plans";
import { PlansClient } from "@/components/plans/plans-client";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = await listPlans();
  return <PlansClient plans={plans} />;
}
