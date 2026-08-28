/**
 * /ai — AI Assistant chat page.
 *
 * Server component loads credit balance and renders the chat view.
 * Gated by SCOPES.AI_CREDITS_READ (or admin).
 */

import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "@/../cod-shared/rbac/scopes";
import { ChatView } from "@/components/ai/chat-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <ProtectedRoute requiredScope={SCOPES.AI_CREDITS_READ}>
      <ChatView />
    </ProtectedRoute>
  );
}
