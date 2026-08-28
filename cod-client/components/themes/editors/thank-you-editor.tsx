"use client";

import { CheckCircle2 } from "lucide-react";
import { useThemes } from "@/lib/translations";
import {
  PanelCard,
  ToggleRow,
  SiteBuilderSaveBar,
} from "@/components/themes/builder-ui";
import { useSiteBuilder } from "@/components/themes/site-builder-state";

interface Props {
  siteJson: string | null;
  onSaved?: () => void;
}

const FIELDS = [
  { key: "showOrderNumber", labelKey: "thankyou_order_number" },
  { key: "showTotal", labelKey: "thankyou_total" },
  { key: "showSteps", labelKey: "thankyou_steps" },
  { key: "showBackToStore", labelKey: "thankyou_back_to_store" },
] as const;

export function ThankYouEditor({ siteJson, onSaved }: Props) {
  const t = useThemes();
  const { site, update, dirty, saving, save } = useSiteBuilder(siteJson);

  const handleSave = async () => {
    const ok = await save();
    if (ok) onSaved?.();
    return ok;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-foreground">{t.thankyou_title}</h2>
        <p className="text-sm text-muted-foreground">{t.thankyou_subtitle}</p>
      </div>

      <PanelCard icon={CheckCircle2} title={t.thankyou_blocks} subtitle={t.thankyou_blocks_hint}>
        <div className="divide-y divide-border">
          {FIELDS.map((field) => (
            <ToggleRow
              key={field.key}
              label={t[field.labelKey]}
              checked={site.thankYou[field.key]}
              onChange={(v) =>
                update((p) => ({
                  ...p,
                  thankYou: { ...p.thankYou, [field.key]: v },
                }))
              }
            />
          ))}
        </div>
      </PanelCard>

      <SiteBuilderSaveBar dirty={dirty} saving={saving} onSave={handleSave} />
    </div>
  );
}
