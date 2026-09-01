"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tag, Percent, DollarSign, Calendar, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createDiscountCodeAction, updateDiscountCodeAction } from "@/actions/discount-codes";
import { useDiscounts } from "@/lib/translations";
import type { DiscountCode, CreateDiscountCodeData } from "@/actions/discount-codes";
import { cn } from "@/lib/utils";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface Props {
  discount?: DiscountCode;
}

export function DiscountForm({ discount }: Props) {
  const t = useDiscounts();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!discount;

  const [code, setCode] = useState(discount?.code ?? "");
  const [type, setType] = useState<"percentage" | "fixed">(discount?.type ?? "percentage");
  const [value, setValue] = useState(discount?.value?.toString() ?? "");
  const [minOrderAmount, setMinOrderAmount] = useState(discount?.minOrderAmount?.toString() ?? "");
  const [maxUses, setMaxUses] = useState(discount?.maxUses?.toString() ?? "");
  const [startsAt, setStartsAt] = useState(discount?.startsAt ? discount.startsAt.slice(0, 10) : "");
  const [expiresAt, setExpiresAt] = useState(discount?.expiresAt ? discount.expiresAt.slice(0, 10) : "");
  const [status, setStatus] = useState<"active" | "inactive">(
    discount?.status === "expired" ? "inactive" : (discount?.status ?? "active")
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = t.form.error_code_required;
    else if (!/^[A-Za-z0-9]+$/.test(code.trim())) errs.code = t.form.error_code_format;
    if (!value.trim()) errs.value = t.form.error_value_required;
    else {
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal <= 0) errs.value = t.form.error_value_positive;
      else if (type === "percentage" && numVal > 100) errs.value = t.form.error_percentage_max;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const data: CreateDiscountCodeData = {
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      maxUses: maxUses ? parseInt(maxUses) : null,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      status,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateDiscountCodeAction(discount.id, data);
          toast.success(t.form.success_edit);
        } else {
          await createDiscountCodeAction(data);
          toast.success(t.form.success_add);
        }
        resetDirty();
        router.push("/discounts");
        router.refresh();
      } catch {
        toast.error(t.form.error_save);
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref="/discounts" title={isEdit ? (t.form.title_edit ?? "Edit Discount") : (t.form.title_add ?? "New Discount")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSubmit}
        onCancel={() => router.push("/discounts")}
        onDiscard={() => router.push("/discounts")}
      />

      <div className="flex items-start gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          <Section title={t.form.code_label ?? "Basic Information"} icon={<Tag size={18} />}>
            <div className="space-y-5">
              <Field label={`${t.form.code_label} *`} error={errors.code}>
                <Input
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); markDirty(); }}
                  placeholder={t.form.code_placeholder}
                  className={cn("h-11 bg-card border-border rounded-md px-4 text-sm font-bold uppercase", errors.code && "border-destructive")}
                  disabled={isPending}
                  maxLength={20}
                />
              </Field>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground ms-1">
                  {t.form.type_label}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["percentage", "fixed"] as const).map((t_) => (
                    <button
                      key={t_}
                      type="button"
                      onClick={() => { setType(t_); markDirty(); }}
                      className={cn(
                        "flex items-center justify-center gap-2.5 rounded-xl border p-4 text-sm font-bold transition-all active:scale-[0.98]",
                        type === t_
                          ? "bg-primary/5 border-primary/30 text-primary shadow-sm"
                          : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <span className="text-xl">{t_ === "percentage" ? "percent" : "dollar"}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest">
                        {t.type[t_]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Field label={`${t.form.value_label} *`} error={errors.value}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    {type === "percentage" ? (
                      <Percent size={16} className="text-muted-foreground/60" />
                    ) : (
                      <DollarSign size={16} className="text-muted-foreground/60" />
                    )}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={type === "percentage" ? 100 : undefined}
                    step={type === "percentage" ? 1 : 0.01}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); markDirty(); }}
                    placeholder={t.form.value_placeholder}
                    className={cn("h-11 bg-card border-border rounded-md pl-11 pr-4 text-sm tabular-nums", errors.value && "border-destructive")}
                    disabled={isPending}
                  />
                  {type === "percentage" && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-sm font-bold text-muted-foreground/60">%</span>
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="w-[320px] shrink-0 space-y-6">
          <Section title={t.form.status_label} icon={<Settings2 size={18} />}>
            <div className="pt-2">
              <label className="flex items-center justify-between gap-4 cursor-pointer group">
                <div className="space-y-0.5">
                  <p className="text-[13px] sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {status === "active" ? t.form.status_active : t.form.status_inactive}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium opacity-70">
                    {status === "active" ? "Code is currently active" : "Code is currently inactive"}
                  </p>
                </div>
                <Switch
                  checked={status === "active"}
                  onCheckedChange={(checked) => { setStatus(checked ? "active" : "inactive"); markDirty(); }}
                  disabled={isPending}
                  className="scale-95 sm:scale-100 shrink-0"
                />
              </label>
            </div>
          </Section>

          <Section title={t.form.starts_at_label} icon={<Calendar size={18} />}>
            <div className="space-y-5">
              <Field label={t.form.starts_at_label}>
                <Input
                  type="date"
                  value={startsAt}
                  onChange={(e) => { setStartsAt(e.target.value); markDirty(); }}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  disabled={isPending}
                />
              </Field>
              <Field label={t.form.expires_at_label}>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => { setExpiresAt(e.target.value); markDirty(); }}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  disabled={isPending}
                />
              </Field>
            </div>
          </Section>

          <Section title={t.form.min_order_label} icon={<DollarSign size={18} />}>
            <div className="space-y-5">
              <Field label={t.form.min_order_label}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <DollarSign size={16} className="text-muted-foreground/60" />
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={minOrderAmount}
                    onChange={(e) => { setMinOrderAmount(e.target.value); markDirty(); }}
                    placeholder={t.form.min_order_placeholder}
                    className="h-11 bg-card border-border rounded-md pl-11 pr-4 text-sm tabular-nums"
                    disabled={isPending}
                  />
                </div>
              </Field>

              <Field label={t.form.max_uses_label}>
                <Input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => { setMaxUses(e.target.value); markDirty(); }}
                  placeholder={t.form.max_uses_placeholder}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm tabular-nums"
                  disabled={isPending}
                />
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
