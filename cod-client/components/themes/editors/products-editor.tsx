"use client";

import { Package, SlidersHorizontal, ListFilter } from "lucide-react";
import { useThemes } from "@/lib/translations";
import {
  PanelCard,
  ToggleRow,
  Stepper,
  SiteBuilderSaveBar,
} from "@/components/themes/builder-ui";
import { useSiteBuilder } from "@/components/themes/site-builder-state";

interface Props {
  siteJson: string | null;
  onSaved?: () => void;
}

export function ProductsEditor({ siteJson, onSaved }: Props) {
  const t = useThemes();
  const { site, update, dirty, saving, save } = useSiteBuilder(siteJson);

  const setProducts = (
    patch: Partial<typeof site.products>
  ) => update((p) => ({ ...p, products: { ...p.products, ...patch } }));

  const handleSave = async () => {
    const ok = await save();
    if (ok) onSaved?.();
    return ok;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-foreground">{t.products_title}</h2>
        <p className="text-sm text-muted-foreground">{t.products_subtitle}</p>
      </div>

      <PanelCard icon={Package} title={t.products_grid} subtitle={t.products_grid_hint}>
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <Stepper
            label={t.columns_desktop}
            value={site.products.desktopCols}
            min={2}
            max={6}
            onChange={(v) => setProducts({ desktopCols: v })}
          />
          <Stepper
            label={t.columns_mobile}
            value={site.products.mobileCols}
            min={1}
            max={3}
            onChange={(v) => setProducts({ mobileCols: v })}
          />
          <Stepper
            label={t.products_per_page}
            value={site.products.pageSize}
            min={4}
            max={60}
            onChange={(v) => setProducts({ pageSize: v })}
          />
        </div>
      </PanelCard>

      <PanelCard
        icon={SlidersHorizontal}
        title={t.products_filters}
        subtitle={t.products_filters_hint}
      >
        <ToggleRow
          label={t.products_category_filter}
          checked={site.products.showCategoryFilter}
          onChange={(v) => setProducts({ showCategoryFilter: v })}
        />
        <ToggleRow
          label={t.products_sort}
          checked={site.products.showSort}
          onChange={(v) => setProducts({ showSort: v })}
        />
      </PanelCard>

      <PanelCard icon={ListFilter} title={t.pages_visibility} subtitle={t.pages_visibility_hint}>
        <ToggleRow
          label={t.pages_products_page}
          checked={site.pages.showProductsPage}
          onChange={(v) => update((p) => ({ ...p, pages: { ...p.pages, showProductsPage: v } }))}
        />
        <ToggleRow
          label={t.pages_category_pages}
          checked={site.pages.showCategoryPages}
          onChange={(v) => update((p) => ({ ...p, pages: { ...p.pages, showCategoryPages: v } }))}
        />
      </PanelCard>

      <SiteBuilderSaveBar dirty={dirty} saving={saving} onSave={handleSave} />
    </div>
  );
}
