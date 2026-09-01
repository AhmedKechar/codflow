import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { SCOPES } from "@/../../cod-shared/rbac/scopes";
import { McpSettingsView } from "@/components/settings/mcp-settings-view";
import {
  getMcpConfig,
  listMyMcpConnections,
  listTeamMcpConnections,
} from "@/actions/mcp";

export const dynamic = "force-dynamic";

export default async function McpSettingsPage() {
  const [config, myConnections, teamConnections] = await Promise.all([
    getMcpConfig(),
    listMyMcpConnections().catch(() => []),
    listTeamMcpConnections().catch(() => []),
  ]);

  return (
    <ProtectedRoute requiredScope={SCOPES.MCP_VIEW}>
      <McpSettingsView
        config={config}
        myConnections={myConnections}
        teamConnections={teamConnections}
      />
    </ProtectedRoute>
  );
}
