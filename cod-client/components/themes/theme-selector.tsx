"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Palette,
  ShieldCheck,
  Banknote,
  RotateCcw,
  Lock,
  Truck,
  Headphones,
  Award,
} from "lucide-react";
import { useThemes } from "@/lib/translations";
import {
  updateThemeColors,
  type BorderRadius,
  type ShadowIntensity,
} from "@/actions/themes";
import type { TrustSealsConfig } from "@/actions/stores";
import { PresetPicker } from "@/components/ui/preset-picker";

interface ThemeSelectorProps {
  currentThemeId: string;
  currentPrimaryColor: string;
  currentAccentColor: string;
  currentBgColor: string;
  currentFontFamily: string;
  currentBorderRadius: BorderRadius;
  currentShadowIntensity: ShadowIntensity;
  currentTrustSeals?: TrustSealsConfig | null;
  onThemeChanged?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

function checkCls(checked: boolean) {
  return checked
    ? "h-4 w-4 shrink-0 rounded border-primary text-primary focus:ring-ring"
    : "h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-ring";
}

export function ThemeSelector({
  currentThemeId,
  currentPrimaryColor,
  currentAccentColor,
  currentBgColor,
  currentFontFamily,
  currentBorderRadius,
  currentShadowIntensity,
  currentTrustSeals,
  onThemeChanged,
  onDirtyChange,
  saveRef,
}: ThemeSelectorProps) {
  const t = useThemes();
  const [selectedThemeId, setSelectedThemeId] = useState(currentThemeId);
  const [primaryColor, setPrimaryColor] = useState(currentPrimaryColor);
  const [accentColor, setAccentColor] = useState(currentAccentColor);
  const [bgColor, setBgColor] = useState(currentBgColor);
  const [fontFamily, setFontFamily] = useState(currentFontFamily);
  const [borderRadius, setBorderRadius] = useState<BorderRadius>(currentBorderRadius);
  const [shadowIntensity, setShadowIntensity] = useState<ShadowIntensity>(currentShadowIntensity);
  const [saving, startTransition] = useTransition();

  const [trustSeals, setTrustSeals] = useState<TrustSealsConfig>({
    cashOnDelivery: currentTrustSeals?.cashOnDelivery ?? false,
    freeReturns: currentTrustSeals?.freeReturns ?? false,
    secureCheckout: currentTrustSeals?.secureCheckout ?? false,
    fastDelivery: currentTrustSeals?.fastDelivery ?? false,
    customerSupport: currentTrustSeals?.customerSupport ?? false,
    qualityGuarantee: currentTrustSeals?.qualityGuarantee ?? false,
  });

  const toggleTrustSeal = (key: keyof TrustSealsConfig) => {
    setTrustSeals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        try {
          await updateThemeColors({
            primaryColor,
            accentColor,
            bgColor,
            fontFamily,
            borderRadius,
            shadowIntensity,
            trustSeals,
          });
          onThemeChanged?.();
          resolve(true);
        } catch (error) {
          console.error("Theme save failed:", error);
          resolve(false);
        }
      });
    });
  };

  const hasChanges =
    primaryColor !== currentPrimaryColor ||
    accentColor !== currentAccentColor ||
    bgColor !== currentBgColor ||
    fontFamily !== currentFontFamily ||
    borderRadius !== currentBorderRadius ||
    shadowIntensity !== currentShadowIntensity ||
    JSON.stringify(trustSeals) !== JSON.stringify(currentTrustSeals ?? {});

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  return (
    <div className="space-y-6">
      {/* Preset Picker */}
      <PresetPicker
        borderRadius={borderRadius}
        shadowIntensity={shadowIntensity}
        onRadiusChange={setBorderRadius}
        onShadowChange={setShadowIntensity}
      />

      {/* Color Customization */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-border px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Palette size={18} className="text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">{t.colors_title}</h2>
            <p className="text-xs text-muted-foreground">{t.colors_subtitle}</p>
          </div>
        </div>
        <div className="space-y-5 px-6 py-5">
          <div
            className="flex h-8 w-full overflow-hidden rounded-lg border border-border"
            aria-hidden="true"
          >
            <div className="flex-1" style={{ background: primaryColor }} />
            <div className="flex-1" style={{ background: accentColor }} />
            <div className="flex-1" style={{ background: bgColor }} />
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <span className="text-sm font-semibold text-foreground">{t.primary_color}</span>
              <p className="text-xs text-muted-foreground">{t.primary_color_hint}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                maxLength={9}
                dir="ltr"
                className="h-9 w-28 rounded-lg border border-border bg-muted px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <span className="text-sm font-semibold text-foreground">{t.accent_color}</span>
              <p className="text-xs text-muted-foreground">{t.accent_color_hint}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                maxLength={9}
                dir="ltr"
                className="h-9 w-28 rounded-lg border border-border bg-muted px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-1">
              <span className="text-sm font-semibold text-foreground">{t.bg_color}</span>
              <p className="text-xs text-muted-foreground">{t.bg_color_hint}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                maxLength={9}
                dir="ltr"
                className="h-9 w-28 rounded-lg border border-border bg-muted px-3 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">{t.font_family}</label>
            <input
              type="text"
              dir="ltr"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              placeholder={t.font_family_placeholder}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Trust Seals */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-border px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ShieldCheck size={18} className="text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">شعارات الثقة</h2>
            <p className="text-xs text-muted-foreground">Trust Seals</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 p-6 sm:grid-cols-2">
          {([
            ["cashOnDelivery", Banknote, "الدفع عند الاستلام", "Cash on Delivery"],
            ["freeReturns", RotateCcw, "استرجاع مجاني", "Free Returns"],
            ["secureCheckout", Lock, "دفع آمن", "Secure Checkout"],
            ["fastDelivery", Truck, "توصيل سريع", "Fast Delivery"],
            ["customerSupport", Headphones, "دعم فني", "Customer Support"],
            ["qualityGuarantee", Award, "ضمان الجودة", "Quality Guarantee"],
          ] as const).map(([key, Icon, ar, en]) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={!!trustSeals[key]}
                onChange={() => toggleTrustSeal(key)}
                className={checkCls(!!trustSeals[key])}
              />
              <Icon size={16} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground">{ar}</span>
                <span className="ms-2 text-xs text-muted-foreground">{en}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
