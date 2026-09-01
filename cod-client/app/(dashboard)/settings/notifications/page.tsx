import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "../../../../../cod-shared/rbac/scopes";
import { NotificationSettingsView } from "@/components/settings/notification-settings-view";
import { getNotificationSettings } from "@/actions/notification-settings";

export default async function NotificationSettingsPage() {
  const settings = await getNotificationSettings().catch(() => []);

  return (
    <ProtectedRoute requiredScope={SCOPES.MESSAGING_MANAGE}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">إعدادات الإشعارات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة إشعارات واتساب ورسائل SMS للعملاء عند تغير حالة الطلب
          </p>
        </div>
        <NotificationSettingsView initialSettings={settings} />
      </div>
    </ProtectedRoute>
  );
}
