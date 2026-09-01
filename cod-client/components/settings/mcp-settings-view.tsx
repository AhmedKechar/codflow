"use client";

import { Sparkles } from "lucide-react";
import { useSettings } from "@/lib/translations";
import { McpPage } from "@/components/mcp/mcp-page";
import type { McpConfig, McpConnection } from "@/actions/mcp";

interface Props {
  config: McpConfig;
  myConnections: McpConnection[];
  teamConnections: McpConnection[];
}

export function McpSettingsView({ config, myConnections, teamConnections }: Props) {
  const t = useSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {t.store.mcp_title}
          </h1>
          <p className="text-[12px] sm:text-sm text-muted-foreground/70 font-semibold">
            {t.store.mcp_subtitle}
          </p>
        </div>
      </div>

      <McpPage
        config={config}
        myConnections={myConnections}
        teamConnections={teamConnections}
      />
    </div>
  );
}
