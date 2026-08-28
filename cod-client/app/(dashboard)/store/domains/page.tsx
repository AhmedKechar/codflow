import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "cod-shared/rbac/scopes";
import { DomainsView } from "@/components/domains/domains-view";

export default function DomainsPage() {
  return (
    <ProtectedRoute requiredScope={SCOPES.CUSTOM_DOMAINS_READ}>
      <DomainsView />
    </ProtectedRoute>
  );
}
