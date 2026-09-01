"use client";

import { useSettingsContext } from "../layout";
import { SecuritySettings } from "@/components/settings/security-settings";
import { Loader2 } from "lucide-react";

export default function SecuritySettingsPage() {
  const { loading } = useSettingsContext();
  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  return <SecuritySettings />;
}
