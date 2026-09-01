"use client";

import { useSettingsContext } from "../layout";
import { ApiSettings } from "@/components/settings/api-settings";
import { Loader2 } from "lucide-react";

export default function ApiSettingsPage() {
  const { storeConfig, loading } = useSettingsContext();
  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  if (!storeConfig) return null;
  return <ApiSettings storeConfig={storeConfig} />;
}
