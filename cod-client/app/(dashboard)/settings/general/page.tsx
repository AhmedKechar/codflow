"use client";

import { useSettingsContext } from "../layout";
import { GeneralSettings } from "@/components/settings/general-settings";
import { Loader2 } from "lucide-react";

export default function GeneralSettingsPage() {
  const { storeConfig, handleSave, loading } = useSettingsContext();
  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  if (!storeConfig) return null;
  return <GeneralSettings storeConfig={storeConfig} onSave={handleSave} />;
}
