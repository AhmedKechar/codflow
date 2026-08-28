"use client";

import { FileText, Megaphone } from "lucide-react";
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

export function PagesEditor({ siteJson, onSaved }: Props) {
  const t = useThemes();
  const { site, update, dirty, saving, save } = useSiteBuilder(siteJson);

  const setPages = (patch: Partial<typeof site.pages>) =>
    update((p) => ({ ...p, pages: { ...p.pages, ...patch } }));

  const handleSave = async () => {
    const ok = await save();
    if (ok) onSaved?.();
    return ok;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-foreground">{t.pages_title}</h2>
        <p className="text-sm text-muted-foreground">{t.pages_subtitle}</p>
      </div>

      <PanelCard icon={FileText} title={t.pages_visibility} subtitle={t.pages_visibility_hint}>
        <div className="divide-y divide-border">
          <ToggleRow
            label={t.pages_products_page}
            checked={site.pages.showProductsPage}
            onChange={(v) => setPages({ showProductsPage: v })}
          />
          <ToggleRow
            label={t.pages_category_pages}
            checked={site.pages.showCategoryPages}
            onChange={(v) => setPages({ showCategoryPages: v })}
          />
        </div>
      </PanelCard>

      <PanelCard icon={Megaphone} title={t.pages_announcement} subtitle={t.pages_announcement_hint}>
        <ToggleRow
          label={t.pages_announcement_bar}
          checked={site.pages.showAnnouncementBar}
          onChange={(v) => setPages({ showAnnouncementBar: v })}
        />
      </PanelCard>

      <SiteBuilderSaveBar dirty={dirty} saving={saving} onSave={handleSave} />
    </div>
  );
}
