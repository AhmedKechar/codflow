"use client";

import { useSettingsContext } from "../layout";
import { EmailSettings } from "@/components/settings/email-settings";
import { Loader2 } from "lucide-react";

export default function EmailSettingsPage() {
  const { loading } = useSettingsContext();
  if (loading) return <Loader2 className="animate-spin text-muted-foreground" size={24} />;
  return <EmailSettings />;
}
