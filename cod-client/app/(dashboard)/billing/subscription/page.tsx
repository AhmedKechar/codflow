
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { getUserScopes } from "@/lib/auth";
import { SCOPES } from "../../../../../cod-shared/rbac/scopes";
import { SubscriptionView } from "@/components/billing/subscription-view";
import {
  getCurrentSubscription,
  getSubscriptionHistory,
} from "@/actions/subscriptions";

export default async function SubscriptionPage() {
  const [userScopes, subscriptionResult, historyResult] =
    await Promise.allSettled([
      getUserScopes(),
      getCurrentSubscription(),
      getSubscriptionHistory(),
    ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.SUBSCRIPTIONS_READ}>
      <SubscriptionView
        subscription={
          subscriptionResult.status === "fulfilled"
            ? subscriptionResult.value
            : null
        }
        history={
          historyResult.status === "fulfilled" ? historyResult.value : []
        }
        userScopes={
          userScopes.status === "fulfilled" ? userScopes.value : []
        }
      />
    </ProtectedRoute>
  );
}
