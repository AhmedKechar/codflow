"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useThemes } from "@/lib/translations";
import { PanelCard, ToggleRow } from "@/components/themes/builder-ui";
import { useSiteBuilder } from "@/components/themes/site-builder-state";

interface Props {
  siteJson: string | null;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

const FIELDS = [
  { key: "showOrderNumber", labelKey: "thankyou_order_number" },
  { key: "showTotal", labelKey: "thankyou_total" },
  { key: "showSteps", labelKey: "thankyou_steps" },
  { key: "showBackToStore", labelKey: "thankyou_back_to_store" },
] as const;

export function ThankYouEditor({ siteJson, onSaved, onDirtyChange, saveRef }: Props) {
  const t = useThemes();
  const { site, update, dirty, saving, save } = useSiteBuilder(siteJson);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = async () => {
        const ok = await save();
        if (ok) onSaved?.();
        return ok;
      };
    }
  });

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
    </div>
  );
}
