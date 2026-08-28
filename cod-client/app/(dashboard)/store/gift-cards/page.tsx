import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "cod-shared/rbac/scopes";
import { GiftCardsView } from "@/components/gift-cards/gift-cards-view";

export default function GiftCardsPage() {
  return (
    <ProtectedRoute requiredScope={SCOPES.GIFT_CARDS_READ}>
      <GiftCardsView />
    </ProtectedRoute>
  );
}
