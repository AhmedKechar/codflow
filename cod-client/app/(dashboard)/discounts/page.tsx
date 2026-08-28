
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { getUserScopes } from "@/lib/auth";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { DiscountsView } from "@/components/discounts/discounts-view";
import { getDiscountCodes } from "@/actions/discount-codes";

export default async function DiscountsPage() {
  const [userScopes, discounts] = await Promise.allSettled([
    getUserScopes(),
    getDiscountCodes(),
  ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.DISCOUNTS_READ}>
      <DiscountsView
        discounts={discounts.status === "fulfilled" ? discounts.value : []}
        userScopes={userScopes.status === "fulfilled" ? userScopes.value : []}
      />
    </ProtectedRoute>
  );
}
