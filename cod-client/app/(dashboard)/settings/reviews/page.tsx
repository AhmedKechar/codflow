"use client";

import { useSettingsContext } from "../layout";
import { ReviewsSettings } from "@/components/settings/reviews-settings";
import { Loader2 } from "lucide-react";

export default function ReviewsSettingsPage() {
  const { storeConfig, handleSave, loading } = useSettingsContext();
  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  if (!storeConfig) return null;
  return <ReviewsSettings storeConfig={storeConfig} onSave={handleSave} />;
}
