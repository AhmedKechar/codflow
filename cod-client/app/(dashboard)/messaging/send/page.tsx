import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "../../../../../cod-shared/rbac/scopes";
import { MessageForm } from "@/components/messaging/message-form";

export default async function SendMessagingPage() {
  return (
    <ProtectedRoute requiredScope={SCOPES.MESSAGING_SEND}>
      <MessageForm />
    </ProtectedRoute>
  );
}
