
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "../../../../../cod-shared/rbac/scopes";
import { DiscountForm } from "@/components/discounts/discount-form";

export default async function NewDiscountPage() {
  return (
    <ProtectedRoute requiredScope={SCOPES.DISCOUNTS_MANAGE}>
      <DiscountForm />
    </ProtectedRoute>
  );
}
