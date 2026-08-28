
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { getUserScopes } from "@/lib/auth";
import { SCOPES } from "../../../../../cod-shared/rbac/scopes";
import { UpgradeView } from "@/components/billing/upgrade-view";
import { getCurrentSubscription, getPlans } from "@/actions/subscriptions";

export default async function UpgradePage() {
  const [userScopes, subscriptionResult, plansResult] =
    await Promise.allSettled([
      getUserScopes(),
      getCurrentSubscription(),
      getPlans(),
    ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.SUBSCRIPTIONS_MANAGE}>
      <UpgradeView
        subscription={
          subscriptionResult.status === "fulfilled"
            ? subscriptionResult.value
            : null
        }
        plans={
          plansResult.status === "fulfilled" ? plansResult.value : []
        }
        userScopes={
          userScopes.status === "fulfilled" ? userScopes.value : []
        }
      />
    </ProtectedRoute>
  );
}
