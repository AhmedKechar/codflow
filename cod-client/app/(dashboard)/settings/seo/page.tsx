"use client";

import { useSettingsContext } from "../layout";
import { SeoSettings } from "@/components/settings/seo-settings";
import { Loader2 } from "lucide-react";

export default function SeoSettingsPage() {
  const { storeConfig, handleSave, loading } = useSettingsContext();
  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  if (!storeConfig) return null;
  return <SeoSettings storeConfig={storeConfig} onSave={handleSave} />;
}
