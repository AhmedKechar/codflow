
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { getUserScopes } from "@/lib/auth";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { BillingView } from "@/components/billing/billing-view";
import { getCurrentSubscription, getPlans } from "@/actions/subscriptions";
import { getAiCredits } from "@/actions/ai-credits";

export default async function BillingPage() {
  const [userScopes, subscriptionResult, plansResult, creditsResult] =
    await Promise.allSettled([
      getUserScopes(),
      getCurrentSubscription(),
      getPlans(),
      getAiCredits(),
    ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.SUBSCRIPTIONS_READ}>
      <BillingView
        subscription={
          subscriptionResult.status === "fulfilled"
            ? subscriptionResult.value
            : null
        }
        plans={
          plansResult.status === "fulfilled" ? plansResult.value : []
        }
        aiCredits={
          creditsResult.status === "fulfilled" ? creditsResult.value : null
        }
        userScopes={
          userScopes.status === "fulfilled" ? userScopes.value : []
        }
      />
    </ProtectedRoute>
  );
}
