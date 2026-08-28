import { listAllSubscriptions } from "@/actions/subscriptions";
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";

export default async function SubscriptionsPage() {
  const subscriptions = await listAllSubscriptions();

  return <SubscriptionsClient subscriptions={subscriptions} />;
}
