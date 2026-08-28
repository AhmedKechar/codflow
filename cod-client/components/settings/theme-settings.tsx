"use client";

import { useState, useTransition } from "react";
import {
  Palette,
  ShieldCheck,
  ClipboardList,
  Truck,
  RotateCcw,
  Lock,
  Headphones,
  Award,
  Banknote,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react";
import { useThemes } from "@/lib/translations";
import type {
  StoreConfig,
  TrustSealsConfig,
  OrderFormConfig,
} from "@/actions/stores";
import { Section, ColorField, FieldRow, inputCls } from "./shared-fields";
import { updateThemeColors } from "@/actions/themes";
import { AVAILABLE_THEMES, type ThemeInfo } from "@/lib/themes-data";
import { toast } from "sonner";

export interface ThemeSettingsProps {
  storeConfig: StoreConfig;
  onSave: (payload: {
    primaryColor?: string;
    accentColor?: string;
    bgColor?: string;
    fontFamily?: string;
    trustSeals?: TrustSealsConfig;
    orderFormConfig?: OrderFormConfig;
  }) => Promise<void>;
}

export function ThemeSettings({ storeConfig, onSave }: ThemeSettingsProps) {
  const t = useThemes();
  const s = t;

  const [selectedThemeId, setSelectedThemeId] = useState(storeConfig.themeId);
  const [primaryColor, setPrimaryColor] = useState(storeConfig.primaryColor);
  const [accentColor, setAccentColor] = useState(storeConfig.accentColor);
  const [bgColor, setBgColor] = useState(storeConfig.bgColor);
  const [fontFamily, setFontFamily] = useState(storeConfig.fontFamily);
  const [saving, startTransition] = useTransition();

  const [trustSeals, setTrustSeals] = useState<TrustSealsConfig>({
    cashOnDelivery: storeConfig.trustSeals?.cashOnDelivery ?? false,
    freeReturns: storeConfig.trustSeals?.freeReturns ?? false,
    secureCheckout: storeConfig.trustSeals?.secureCheckout ?? false,
    fastDelivery: storeConfig.trustSeals?.fastDelivery ?? false,
    customerSupport: storeConfig.trustSeals?.customerSupport ?? false,
    qualityGuarantee: storeConfig.trustSeals?.qualityGuarantee ?? false,
  });

  const [orderForm, setOrderForm] = useState<OrderFormConfig>({
    showName: storeConfig.orderFormConfig?.showName ?? true,
    showPhone: storeConfig.orderFormConfig?.showPhone ?? true,
    showEmail: storeConfig.orderFormConfig?.showEmail ?? false,
    showAddress: storeConfig.orderFormConfig?.showAddress ?? true,
    showWilaya: storeConfig.orderFormConfig?.showWilaya ?? true,
    showCommune: storeConfig.orderFormConfig?.showCommune ?? true,
    showDeliveryType: storeConfig.orderFormConfig?.showDeliveryType ?? true,
    showNotes: storeConfig.orderFormConfig?.showNotes ?? false,
    showQuantity: storeConfig.orderFormConfig?.showQuantity ?? true,
    submitButtonText: storeConfig.orderFormConfig?.submitButtonText ?? null,
    summaryDisplay: storeConfig.orderFormConfig?.summaryDisplay ?? "open",
  });

  const toggleTrustSeal = (key: keyof TrustSealsConfig) => {
    setTrustSeals((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleOrderField = (key: keyof OrderFormConfig) => {
    setOrderForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleThemeSelect = (theme: ThemeInfo) => {
    setSelectedThemeId(theme.id);
    setPrimaryColor(theme.primaryColor);
    setAccentColor(theme.accentColor);
    setBgColor(theme.bgColor);
    setFontFamily(theme.fontFamily);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await onSave({
          primaryColor,
          accentColor,
          bgColor,
          fontFamily: fontFamily.trim() || storeConfig.fontFamily,
          trustSeals,
          orderFormConfig: orderForm,
        });
      } catch (error) {
        toast.error(s.theme_apply_error);
        console.error("Theme save failed:", error);
      }
    });
  };

  return (
    <Section
      icon={Palette}
      title={s.select_theme}
      subtitle={s.subtitle}
      saving={saving}
      saveLabel={s.save}
      savingLabel={s.saving}
      onSave={handleSave}
    >
      {/* Theme Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {AVAILABLE_THEMES.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          const themeTranslation = s.themes[theme.id as keyof typeof s.themes];

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleThemeSelect(theme)}
              className={[
                "relative flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all",
                "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary shadow-md"
                  : "border-border hover:border-muted-foreground/30",
              ].join(" ")}
            >
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check size={12} />
                </div>
              )}

              {/* Theme Preview */}
              <div
                className="mb-2 h-12 w-full rounded-lg"
                style={{ background: theme.preview.gradient }}
              />

              {/* Theme Info */}
              <h3 className="text-sm font-bold text-foreground">
                {themeTranslation?.name ?? theme.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {themeTranslation?.description ?? theme.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Color Customization */}
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground">{s.colors_title}</h3>

        {/* Live color preview strip */}
        <div
          className="flex h-8 w-full overflow-hidden rounded-lg border border-border"
          aria-hidden="true"
        >
          <div className="flex-1" style={{ background: primaryColor }} />
          <div className="flex-1" style={{ background: accentColor }} />
          <div className="flex-1" style={{ background: bgColor }} />
        </div>

        <ColorField
          label={s.primary_color}
          hint={s.primary_color_hint}
          value={primaryColor}
          onChange={setPrimaryColor}
        />

        <ColorField
          label={s.accent_color}
          hint={s.accent_color_hint}
          value={accentColor}
          onChange={setAccentColor}
        />

        <ColorField
          label={s.bg_color}
          hint={s.bg_color_hint}
          value={bgColor}
          onChange={setBgColor}
        />

        <FieldRow label={s.font_family}>
          <input
            type="text"
            dir="ltr"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            placeholder={s.font_family_placeholder}
            className={inputCls}
          />
        </FieldRow>
      </div>

      {/* Trust Seals */}
      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ShieldCheck size={18} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Trust Seals</h3>
            <p className="text-xs text-muted-foreground">شعارات الثقة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([
            ["cashOnDelivery", Banknote, "Cash on Delivery", "الدفع عند الاستلام"],
            ["freeReturns", RotateCcw, "Free Returns", "استرجاع مجاني"],
            ["secureCheckout", Lock, "Secure Checkout", "دفع آمن"],
            ["fastDelivery", Truck, "Fast Delivery", "توصيل سريع"],
            ["customerSupport", Headphones, "Customer Support", "دعم فني"],
            ["qualityGuarantee", Award, "Quality Guarantee", "ضمان الجودة"],
          ] as const).map(([key, Icon, en, ar]) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={!!trustSeals[key]}
                onChange={() => toggleTrustSeal(key)}
                className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-ring"
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

      {/* Order Form Customization */}
      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ClipboardList size={18} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              تخصيص فورم الطلب
            </h3>
            <p className="text-xs text-muted-foreground">
              Order Form Customization
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([
            ["showName", "الاسم الكامل", "Full Name"],
            ["showPhone", "رقم الهاتف", "Phone Number"],
            ["showEmail", "البريد الإلكتروني", "Email"],
            ["showAddress", "العنوان", "Address"],
            ["showWilaya", "الولاية", "Wilaya"],
            ["showCommune", "البلدية", "Commune"],
            ["showDeliveryType", "نوع التوصيل", "Delivery Type"],
            ["showNotes", "ملاحظات", "Notes"],
            ["showQuantity", "الكمية", "Quantity"],
          ] as const).map(([key, ar, en]) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={!!orderForm[key]}
                onChange={() => toggleOrderField(key)}
                className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-ring"
              />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground">{ar}</span>
                <span className="ms-2 text-xs text-muted-foreground">{en}</span>
              </div>
            </label>
          ))}
        </div>

        <FieldRow label="نص زر الإرسال" hint="Submit Button Text">
          <input
            type="text"
            value={orderForm.submitButtonText ?? ""}
            onChange={(e) =>
              setOrderForm((prev) => ({
                ...prev,
                submitButtonText: e.target.value || null,
              }))
            }
            placeholder="اتركه فارغاً للنص الافتراضي"
            className={inputCls}
          />
        </FieldRow>

        <FieldRow label="ملخص الطلب" hint="Summary Display">
          <select
            value={orderForm.summaryDisplay ?? "open"}
            onChange={(e) =>
              setOrderForm((prev) => ({
                ...prev,
                summaryDisplay: e.target.value as "open" | "closed" | "hidden",
              }))
            }
            className={inputCls}
          >
            <option value="open">Open / مفتوح</option>
            <option value="closed">Closed / مغلق</option>
            <option value="hidden">Hidden / مخفي</option>
          </select>
        </FieldRow>
      </div>
    </Section>
  );
}
