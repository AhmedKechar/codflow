"use client";

import { Eye } from "lucide-react";
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
  { key: "showGallery", labelKey: "productpage_gallery" },
  { key: "showInfo", labelKey: "productpage_info" },
  { key: "showOrderForm", labelKey: "productpage_order_form" },
  { key: "showReviews", labelKey: "productpage_reviews" },
  { key: "showShipping", labelKey: "productpage_shipping" },
  { key: "showTrustSeals", labelKey: "productpage_trust_seals" },
] as const;

export function ProductPageEditor({ siteJson, onSaved }: Props) {
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
        <h2 className="text-lg font-black text-foreground">{t.productpage_title}</h2>
        <p className="text-sm text-muted-foreground">{t.productpage_subtitle}</p>
      </div>

      <PanelCard icon={Eye} title={t.productpage_sections} subtitle={t.productpage_sections_hint}>
        <div className="divide-y divide-border">
          {FIELDS.map((field) => (
            <ToggleRow
              key={field.key}
              label={t[field.labelKey]}
              checked={site.productPage[field.key]}
              onChange={(v) =>
                update((p) => ({
                  ...p,
                  productPage: { ...p.productPage, [field.key]: v },
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
