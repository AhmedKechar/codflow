
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { getUserScopes } from "@/lib/auth";
import { SCOPES } from "../../../../../cod-shared/rbac/scopes";
import { PaymentHistoryView } from "@/components/billing/payment-history-view";
import { getMyPayments } from "@/actions/payments";

export default async function PaymentHistoryPage() {
  const [userScopes, paymentsResult] = await Promise.allSettled([
    getUserScopes(),
    getMyPayments(),
  ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.PAYMENTS_READ}>
      <PaymentHistoryView
        payments={
          paymentsResult.status === "fulfilled" ? paymentsResult.value : []
        }
        userScopes={
          userScopes.status === "fulfilled" ? userScopes.value : []
        }
      />
    </ProtectedRoute>
  );
}
