"use client";

import { useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  LayoutDashboard,
  Grid3X3,
  Share2,
  Plus,
  Trash2,
  PanelTop,
  Shield,
} from "lucide-react";
import { useThemes } from "@/lib/translations";
import {
  type SiteBuilderConfig,
  type HomeSectionId,
  type SocialPlatform,
} from "cod-shared/site-builder";
import { PanelCard, ToggleRow, Stepper, TextInput, inputCls } from "@/components/themes/builder-ui";
import { useSiteBuilder } from "@/components/themes/site-builder-state";

interface SiteBuilderEditorProps {
  siteJson: string | null;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

type SectionLabelKey =
  | "section_hero"
  | "section_categoryCards"
  | "section_bestSellers"
  | "section_howItWorks"
  | "section_newArrivals"
  | "section_featuresBar"
  | "section_whatsappCta"
  | "section_testimonials";

const SECTION_KEYS: { id: HomeSectionId; key: SectionLabelKey }[] = [
  { id: "hero", key: "section_hero" },
  { id: "categoryCards", key: "section_categoryCards" },
  { id: "bestSellers", key: "section_bestSellers" },
  { id: "howItWorks", key: "section_howItWorks" },
  { id: "newArrivals", key: "section_newArrivals" },
  { id: "featuresBar", key: "section_featuresBar" },
  { id: "whatsappCta", key: "section_whatsappCta" },
  { id: "testimonials", key: "section_testimonials" },
];

const PLATFORMS: SocialPlatform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "whatsapp",
  "youtube",
  "x",
  "telegram",
];

export function SiteBuilderEditor({ siteJson, onSaved, onDirtyChange, saveRef }: SiteBuilderEditorProps) {
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

  const move = (index: number, dir: -1 | 1) => {
    const sections = site.home.sections.map((s) => ({ ...s }));
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    const reordered = sections.map((s, i) => ({ ...s, order: i }));
    update((prev) => ({ ...prev, home: { ...prev.home, sections: reordered } }));
  };

  const toggleSection = (id: HomeSectionId) => {
    update((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        sections: prev.home.sections.map((s) =>
          s.id === id ? { ...s, enabled: !s.enabled } : s
        ),
      },
    }));
  };

  const changeSocials = (next: SiteBuilderConfig["socials"]) => {
    update((prev) => ({ ...prev, socials: next }));
  };

  const addSocial = () => {
    const taken = new Set(site.socials.map((s) => s.platform));
    const platform = PLATFORMS.find((p) => !taken.has(p));
    if (!platform) return;
    changeSocials([...site.socials, { platform, url: "https://" }]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-foreground">{t.homepage_title}</h2>
        <p className="text-sm text-muted-foreground">{t.homepage_subtitle}</p>
      </div>

      {/* Sections order + visibility */}
      <PanelCard
        icon={LayoutDashboard}
        title={t.sections_section}
        subtitle={t.sections_section_hint}
      >
        <div className="space-y-2">
          {site.home.sections.map((section, index) => {
            const sectionLabelKey: SectionLabelKey =
              SECTION_KEYS.find((k) => k.id === section.id)?.key ?? "section_hero";
            return (
              <div
                key={section.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <span className="flex-1 text-sm font-semibold text-foreground">
                  {t[sectionLabelKey]}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  title={section.enabled ? t.hidden : t.visible}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                >
                  {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    title={t.move_up}
                    className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronUp size={15} className="mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === site.home.sections.length - 1}
                    title={t.move_down}
                    className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronDown size={15} className="mx-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PanelCard>

      {/* Product grid sizing */}
      <PanelCard icon={Grid3X3} title={t.grid_section} subtitle={t.grid_section_hint}>
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <Stepper
            label={t.rows_desktop}
            value={site.home.rowsDesktop}
            min={1}
            max={4}
            onChange={(v) => update((p) => ({ ...p, home: { ...p.home, rowsDesktop: v } }))}
          />
          <Stepper
            label={t.rows_mobile}
            value={site.home.rowsMobile}
            min={1}
            max={4}
            onChange={(v) => update((p) => ({ ...p, home: { ...p.home, rowsMobile: v } }))}
          />
          <Stepper
            label={t.columns_desktop}
            value={site.home.columnsDesktop}
            min={2}
            max={6}
            onChange={(v) => update((p) => ({ ...p, home: { ...p.home, columnsDesktop: v } }))}
          />
          <Stepper
            label={t.columns_mobile}
            value={site.home.columnsMobile}
            min={1}
            max={3}
            onChange={(v) => update((p) => ({ ...p, home: { ...p.home, columnsMobile: v } }))}
          />
        </div>
      </PanelCard>

      {/* Header */}
      <PanelCard icon={PanelTop} title={t.header_section} subtitle={t.header_section_hint}>
        <ToggleRow
          label={t.show_search}
          checked={site.header.showSearch}
          onChange={(v) => update((p) => ({ ...p, header: { ...p.header, showSearch: v } }))}
        />
        <ToggleRow
          label={t.show_store_button}
          checked={site.header.showStoreButton}
          onChange={(v) => update((p) => ({ ...p, header: { ...p.header, showStoreButton: v } }))}
        />
        <ToggleRow
          label={t.show_socials}
          checked={site.header.showSocials}
          onChange={(v) => update((p) => ({ ...p, header: { ...p.header, showSocials: v } }))}
        />
      </PanelCard>

      {/* Hero */}
      <PanelCard icon={Shield} title={t.hero_section} subtitle={t.hero_section_hint}>
        <ToggleRow
          label={t.visible}
          checked={site.hero.enabled}
          onChange={(v) => update((p) => ({ ...p, hero: { ...p.hero, enabled: v } }))}
        />
        <div className="mt-3 space-y-3">
          <TextInput
            value={site.hero.eyebrow ?? ""}
            onChange={(v) => update((p) => ({ ...p, hero: { ...p.hero, eyebrow: v || undefined } }))}
            placeholder={t.hero_eyebrow}
          />
          <TextInput
            value={site.hero.title ?? ""}
            onChange={(v) => update((p) => ({ ...p, hero: { ...p.hero, title: v || undefined } }))}
            placeholder={t.hero_title}
          />
          <TextInput
            value={site.hero.subtitle ?? ""}
            onChange={(v) => update((p) => ({ ...p, hero: { ...p.hero, subtitle: v || undefined } }))}
            placeholder={t.hero_subtitle}
          />
        </div>
      </PanelCard>

      {/* Footer */}
      <PanelCard icon={PanelTop} title={t.footer_section} subtitle={t.footer_section_hint}>
        <ToggleRow
          label={t.show_brand}
          checked={site.footer.showBrand}
          onChange={(v) => update((p) => ({ ...p, footer: { ...p.footer, showBrand: v } }))}
        />
        <ToggleRow
          label={t.show_links}
          checked={site.footer.showLinks}
          onChange={(v) => update((p) => ({ ...p, footer: { ...p.footer, showLinks: v } }))}
        />
        <ToggleRow
          label={t.show_socials}
          checked={site.footer.showSocials}
          onChange={(v) => update((p) => ({ ...p, footer: { ...p.footer, showSocials: v } }))}
        />
      </PanelCard>

      {/* Socials */}
      <PanelCard
        icon={Share2}
        title={t.socials_section}
        subtitle={t.socials_section_hint}
      >
        <div className="space-y-2">
          {site.socials.map((social, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={social.platform}
                onChange={(e) => {
                  const next = site.socials.map((s, i) =>
                    i === index ? { ...s, platform: e.target.value as SocialPlatform } : s
                  );
                  changeSocials(next);
                }}
                className={inputCls + " max-w-[140px]"}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="text"
                dir="ltr"
                value={social.url}
                onChange={(e) => {
                  const next = site.socials.map((s, i) =>
                    i === index ? { ...s, url: e.target.value } : s
                  );
                  changeSocials(next);
                }}
                placeholder="https://"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => changeSocials(site.socials.filter((_, i) => i !== index))}
                className="h-9 w-9 shrink-0 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                aria-label={t.remove}
              >
                <Trash2 size={15} className="mx-auto" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocial}
            disabled={site.socials.length >= PLATFORMS.length}
            className="mt-1 inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} />
            {t.add_social}
          </button>
        </div>
      </PanelCard>
    </div>
  );
}
