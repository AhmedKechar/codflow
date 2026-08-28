import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "cod-shared/rbac/scopes";
import { ThemePageContent } from "./theme-page-content";

export default async function ThemePage() {
  return (
    <ProtectedRoute requiredScope={SCOPES.SETTINGS_VIEW}>
      <ThemePageContent />
    </ProtectedRoute>
  );
}
