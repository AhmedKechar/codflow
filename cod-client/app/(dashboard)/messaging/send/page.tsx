import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "../../../../../cod-shared/rbac/scopes";
import { MessageForm } from "@/components/messaging/message-form";

export default async function SendMessagingPage() {
  return (
    <ProtectedRoute requiredScope={SCOPES.MESSAGING_SEND}>
      <div className="space-y-5 sm:space-y-6 animate-fade-in">
        <MessageForm />
      </div>
    </ProtectedRoute>
  );
}
