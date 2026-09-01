"use client";

import { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { useThemes } from "@/lib/translations";
import { updateThemeColors } from "@/actions/themes";
import type { OrderFormConfig } from "@/actions/stores";
import { PanelCard, ToggleRow, TextInput } from "@/components/themes/builder-ui";

interface Props {
  currentOrderFormConfig?: OrderFormConfig | null;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
}

const FIELD_LABEL_KEYS = [
  { key: "showName", labelKey: "orderform_name" },
  { key: "showPhone", labelKey: "orderform_phone" },
  { key: "showEmail", labelKey: "orderform_email" },
  { key: "showAddress", labelKey: "orderform_address" },
  { key: "showWilaya", labelKey: "orderform_wilaya" },
  { key: "showCommune", labelKey: "orderform_commune" },
  { key: "showDeliveryType", labelKey: "orderform_delivery_type" },
  { key: "showNotes", labelKey: "orderform_notes" },
  { key: "showQuantity", labelKey: "orderform_quantity" },
] as const;

export function OrderFormEditor({ currentOrderFormConfig, onSaved, onDirtyChange, saveRef }: Props) {
  const t = useThemes();
  const [orderForm, setOrderForm] = useState<OrderFormConfig>({
    showName: currentOrderFormConfig?.showName ?? true,
    showPhone: currentOrderFormConfig?.showPhone ?? true,
    showEmail: currentOrderFormConfig?.showEmail ?? false,
    showAddress: currentOrderFormConfig?.showAddress ?? true,
    showWilaya: currentOrderFormConfig?.showWilaya ?? true,
    showCommune: currentOrderFormConfig?.showCommune ?? true,
    showDeliveryType: currentOrderFormConfig?.showDeliveryType ?? true,
    showNotes: currentOrderFormConfig?.showNotes ?? false,
    showQuantity: currentOrderFormConfig?.showQuantity ?? true,
    submitButtonText: currentOrderFormConfig?.submitButtonText ?? null,
    summaryDisplay: currentOrderFormConfig?.summaryDisplay ?? "open",
  });
  const [saving, setSaving] = useState(false);

  const dirty =
    JSON.stringify(orderForm) !== JSON.stringify(currentOrderFormConfig ?? {});

  const toggleField = (key: keyof OrderFormConfig) => {
    setOrderForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateThemeColors({ orderFormConfig: orderForm });
      onSaved?.();
      return true;
    } catch (error) {
      console.error("Order form save failed:", error);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-foreground">{t.orderform_title}</h2>
        <p className="text-sm text-muted-foreground">{t.orderform_subtitle}</p>
      </div>

      <PanelCard
        icon={ClipboardList}
        title={t.orderform_fields}
        subtitle={t.orderform_fields_hint}
      >
        <div className="divide-y divide-border">
          {FIELD_LABEL_KEYS.map((field) => (
            <ToggleRow
              key={field.key}
              label={t[field.labelKey]}
              checked={!!orderForm[field.key]}
              onChange={() => toggleField(field.key)}
            />
          ))}
        </div>
      </PanelCard>

      <PanelCard
        icon={ClipboardList}
        title={t.orderform_behavior}
        subtitle={t.orderform_behavior_hint}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              {t.orderform_submit_text}
            </label>
            <TextInput
              value={orderForm.submitButtonText ?? ""}
              onChange={(v) =>
                setOrderForm((prev) => ({
                  ...prev,
                  submitButtonText: v || null,
                }))
              }
              placeholder={t.orderform_submit_text_placeholder}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              {t.orderform_summary_display}
            </label>
            <select
              value={orderForm.summaryDisplay ?? "open"}
              onChange={(e) =>
                setOrderForm((prev) => ({
                  ...prev,
                  summaryDisplay: e.target.value as "open" | "closed" | "hidden",
                }))
              }
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="open">{t.orderform_summary_open}</option>
              <option value="closed">{t.orderform_summary_closed}</option>
              <option value="hidden">{t.orderform_summary_hidden}</option>
            </select>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
