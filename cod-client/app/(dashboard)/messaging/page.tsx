import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { getUserScopes } from "@/lib/auth";
import { SCOPES } from "../../../../cod-shared/rbac/scopes";
import { MessagingView } from "@/components/messaging/messaging-view";
import { listWhatsAppMessages } from "@/actions/whatsapp";
import { listSmsMessages } from "@/actions/sms";

export default async function MessagingPage() {
  const [userScopes, whatsappResult, smsResult] = await Promise.allSettled([
    getUserScopes(),
    listWhatsAppMessages({ limit: 50 }),
    listSmsMessages({ limit: 50 }),
  ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.MESSAGING_READ}>
      <MessagingView
        whatsappMessages={whatsappResult.status === "fulfilled" ? whatsappResult.value.messages : []}
        smsMessages={smsResult.status === "fulfilled" ? smsResult.value.messages : []}
        userScopes={userScopes.status === "fulfilled" ? userScopes.value : []}
      />
    </ProtectedRoute>
  );
}
