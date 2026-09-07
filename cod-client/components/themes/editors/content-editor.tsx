"use client";

import { useState, useEffect, useRef } from "react";
import { Type, RotateCcw } from "lucide-react";
import { useThemes } from "@/lib/translations";
import { updateThemeColors } from "@/actions/themes";
import { PanelCard, TextInput, inputCls } from "@/components/themes/builder-ui";

interface Props {
  contentJson: string | null;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

interface FieldConfig {
  key: string;
  label: string;
}

interface SectionConfig {
  id: string;
  title: string;
  icon: string;
  fields: FieldConfig[];
}

const SECTIONS: SectionConfig[] = [
  {
    id: "announcement",
    title: "شريط الإعلانات",
    icon: "📢",
    fields: [{ key: "contentAnnouncement", label: "نص الإعلان" }],
  },
  {
    id: "hero",
    title: "الصفحة الرئيسية - Hero",
    icon: "🏠",
    fields: [
      { key: "contentHeroEyebrow", label: "العنوان العلوي" },
      { key: "contentHeroTitle", label: "العنوان الرئيسي" },
      { key: "contentHeroSubtitle", label: "العنوان الفرعي" },
      { key: "contentHeroCtaPrimary", label: "زر رئيسي" },
      { key: "contentHeroCtaSecondary", label: "زر ثانوي" },
    ],
  },
  {
    id: "bestSellers",
    title: "الأكثر مبيعاً",
    icon: "⭐",
    fields: [
      { key: "contentBestSellersTitle", label: "العنوان" },
      { key: "contentBestSellersSubtitle", label: "الوصف" },
    ],
  },
  {
    id: "newArrivals",
    title: "وصل حديثاً",
    icon: "🆕",
    fields: [
      { key: "contentNewArrivalsTitle", label: "العنوان" },
      { key: "contentNewArrivalsSubtitle", label: "الوصف" },
    ],
  },
  {
    id: "howItWorks",
    title: "كيف يعمل",
    icon: "🔄",
    fields: [
      { key: "contentHowItWorksTitle", label: "العنوان" },
      { key: "contentHowItWorksSubtitle", label: "الوصف" },
      { key: "contentHowStep1Title", label: "الخطوة 1 - العنوان" },
      { key: "contentHowStep1Sub", label: "الخطوة 1 - الوصف" },
      { key: "contentHowStep2Title", label: "الخطوة 2 - العنوان" },
      { key: "contentHowStep2Sub", label: "الخطوة 2 - الوصف" },
      { key: "contentHowStep3Title", label: "الخطوة 3 - العنوان" },
      { key: "contentHowStep3Sub", label: "الخطوة 3 - الوصف" },
    ],
  },
  {
    id: "features",
    title: "شريط المميزات",
    icon: "✅",
    fields: [
      { key: "contentFeature1", label: "الميزة 1" },
      { key: "contentFeature2", label: "الميزة 2" },
      { key: "contentFeature3", label: "الميزة 3" },
      { key: "contentFeature4", label: "الميزة 4" },
    ],
  },
  {
    id: "testimonials",
    title: "آراء العملاء",
    icon: "💬",
    fields: [
      { key: "contentTestimonialsTitle", label: "العنوان" },
      { key: "contentTestimonialsSubtitle", label: "الوصف" },
    ],
  },
  {
    id: "whatsapp",
    title: "تواصل واتساب",
    icon: "📱",
    fields: [
      { key: "contentWhatsappTitle", label: "العنوان" },
      { key: "contentWhatsappSubtitle", label: "الوصف" },
      { key: "contentWhatsappCta", label: "نص الزر" },
    ],
  },
  {
    id: "footer",
    title: "التذييل",
    icon: "📎",
    fields: [
      { key: "contentFooterAbout", label: "نبذة عن المتجر" },
      { key: "contentFooterRights", label: "حقوق النشر" },
    ],
  },
];

export function ContentEditor({
  contentJson,
  onSaved,
  onDirtyChange,
  saveRef,
}: Props) {
  const t = useThemes();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [originalJson, setOriginalJson] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contentJson) {
      try {
        const parsed = JSON.parse(contentJson);
        setOverrides(parsed);
        setOriginalJson(contentJson);
      } catch {
        setOverrides({});
        setOriginalJson(null);
      }
    } else {
      setOverrides({});
      setOriginalJson(null);
    }
  }, [contentJson]);

  const dirty = JSON.stringify(overrides) !== JSON.stringify(
    originalJson ? JSON.parse(originalJson) : {}
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateThemeColors({ contentJson: JSON.stringify(overrides) });
      setOriginalJson(JSON.stringify(overrides));
      onSaved?.();
      return true;
    } catch (error) {
      console.error("Content save failed:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  const updateField = (key: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const resetField = (key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetAll = () => {
    setOverrides({});
  };

  const hasAnyOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-black text-foreground">
            {t.content_title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.content_subtitle}
          </p>
        </div>
        {hasAnyOverrides && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw size={14} />
            {t.content_reset_all}
          </button>
        )}
      </div>

      {SECTIONS.map((section) => (
        <PanelCard
          key={section.id}
          icon={Type}
          title={`${section.icon} ${section.title}`}
          subtitle={`تعديل نصوص ${section.title}`}
        >
          <div className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <div className="flex gap-2">
                  <TextInput
                    value={overrides[field.key] ?? ""}
                    onChange={(v) => updateField(field.key, v)}
                    placeholder={t.content_default_value}
                    dir="rtl"
                  />
                  {overrides[field.key] && (
                    <button
                      type="button"
                      onClick={() => resetField(field.key)}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title={t.content_reset}
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      ))}
    </div>
  );
}
