"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Gift, Package, Calendar, Settings2, Zap } from "lucide-react";
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
import { createOffer, updateOffer } from "@/actions/offers";
import { useOffers } from "@/lib/translations";
import type { Offer, CreateOfferData } from "@/actions/offers";
import type { Product, ProductVariant } from "@/types";
import { cn } from "@/lib/utils";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface Props {
  products: Product[];
  offer?: Offer;
}

export function OfferForm({ products, offer }: Props) {
  const t = useOffers();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!offer;

  const [name, setName] = useState(offer?.name ?? "");
  const [discountType, setDiscountType] = useState<"free" | "free_shipping">(offer?.discountType ?? "free");
  const [triggerProductId, setTriggerProductId] = useState(offer?.triggerProduct?.id ?? "");
  const [triggerVariantId, setTriggerVariantId] = useState(offer?.triggerVariant?.id ?? "");
  const [triggerQty, setTriggerQty] = useState(String(offer?.triggerQuantity ?? 2));
  const [rewardProductId, setRewardProductId] = useState(offer?.rewardProduct?.id ?? "");
  const [rewardVariantId, setRewardVariantId] = useState(offer?.rewardVariant?.id ?? "");
  const [rewardQty, setRewardQty] = useState(String(offer?.rewardQuantity ?? 1));
  const [startsAt, setStartsAt] = useState(offer?.startsAt ? offer.startsAt.slice(0, 16) : "");
  const [endsAt, setEndsAt] = useState(offer?.endsAt ? offer.endsAt.slice(0, 16) : "");
  const [status, setStatus] = useState<"active" | "inactive">(offer?.status ?? "active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  const triggerProduct = useMemo(() => products.find((p) => p.id === triggerProductId) ?? null, [products, triggerProductId]);
  const rewardProduct = useMemo(() => products.find((p) => p.id === rewardProductId) ?? null, [products, rewardProductId]);

  const triggerVariants: ProductVariant[] = useMemo(
    () => (triggerProduct?.hasVariants ? (triggerProduct.variants ?? []).filter((v) => v.active) : []),
    [triggerProduct]
  );
  const rewardVariants: ProductVariant[] = useMemo(
    () => (rewardProduct?.hasVariants ? (rewardProduct.variants ?? []).filter((v) => v.active) : []),
    [rewardProduct]
  );

  const rewardIsSameProduct = rewardProductId === triggerProductId;

  function variantLabel(v: ProductVariant) {
    return Object.values(v.variations).join(" / ");
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t.form.error_name_required;
    if (!triggerProductId) errs.triggerProductId = t.form.error_trigger_product_required;
    if (discountType === "free" && !rewardProductId) errs.rewardProductId = t.form.error_reward_product_required;
    const tQty = parseInt(triggerQty);
    if (isNaN(tQty) || tQty < 1) errs.triggerQty = t.form.error_trigger_qty;
    if (discountType === "free") {
      const rQty = parseInt(rewardQty);
      if (isNaN(rQty) || rQty < 1) errs.rewardQty = t.form.error_reward_qty;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const data: CreateOfferData = {
      name: name.trim(),
      discountType,
      triggerProductId,
      triggerVariantId: triggerVariantId || undefined,
      triggerQuantity: parseInt(triggerQty),
      rewardProductId: discountType === "free" ? rewardProductId : undefined,
      rewardVariantId: discountType === "free" ? (rewardVariantId || undefined) : undefined,
      rewardQuantity: discountType === "free" ? parseInt(rewardQty) : 0,
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      status,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateOffer(offer.id, data);
          toast.success(t.form.success_edit);
        } else {
          await createOffer(data);
          toast.success(t.form.success_add);
        }
        resetDirty();
        router.push("/offers");
        router.refresh();
      } catch {
        toast.error(t.form.error_save);
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref="/offers" title={isEdit ? (t.form.title_edit ?? "Edit Offer") : (t.form.title_add ?? "New Offer")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSubmit}
        onCancel={() => router.push("/offers")}
        onDiscard={() => router.push("/offers")}
      />

      <div className="flex items-start gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          <Section title={t.form.name_label ?? "Basic Information"} icon={<Gift size={18} />}>
            <div className="space-y-5">
              <Field label={`${t.form.name_label} *`} error={errors.name}>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); markDirty(); }}
                  placeholder={t.form.name_placeholder}
                  className={cn("h-11 bg-card border-border rounded-md px-4 text-sm", errors.name && "border-destructive")}
                  disabled={isPending}
                />
              </Field>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground ms-1">
                  {t.form.discount_type_label}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["free", "free_shipping"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setDiscountType(type); markDirty(); }}
                      className={cn(
                        "flex items-center justify-center gap-2.5 rounded-xl border p-4 text-sm font-bold transition-all active:scale-[0.98]",
                        discountType === type
                          ? "bg-primary/5 border-primary/30 text-primary shadow-sm"
                          : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <span className="text-xl">{type === "free" ? "🎁" : "🚚"}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest">
                        {(t.discount_type as Record<string, string>)[type]}
                      </span>
                    </button>
                  ))}
                </div>
                {discountType === "free_shipping" && (
                  <p className="text-[10px] text-muted-foreground/60 font-medium mt-1.5 ms-1">
                    {t.form.free_shipping_note}
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section title={t.form.section_trigger} icon={<Package size={18} />}>
            <div className="space-y-5">
              <Field label={`${t.form.trigger_product_label} *`} error={errors.triggerProductId}>
                <Select
                  value={triggerProductId}
                  onValueChange={(v) => { setTriggerProductId(v ?? ""); setTriggerVariantId(""); markDirty(); }}
                  disabled={isPending}
                >
                  <SelectTrigger className={cn("h-11 bg-card border-border rounded-md px-4 text-sm", errors.triggerProductId && "border-destructive")}>
                    <SelectValue placeholder={t.form.trigger_product_placeholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-card rounded-lg max-h-64">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="font-bold text-sm py-2.5">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {triggerVariants.length > 0 && (
                <Field label={t.form.trigger_variant_label}>
                  <Select
                    value={triggerVariantId || "__any__"}
                    onValueChange={(v) => { setTriggerVariantId(v === "__any__" ? "" : (v ?? "")); markDirty(); }}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card rounded-lg max-h-64">
                      <SelectItem value="__any__" className="font-bold text-sm py-2.5">
                        {t.form.trigger_variant_any}
                      </SelectItem>
                      {triggerVariants.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="font-bold text-sm py-2.5">
                          {variantLabel(v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <Field label={`${t.form.trigger_qty_label} *`} error={errors.triggerQty}>
                <Input
                  type="number"
                  min={1}
                  value={triggerQty}
                  onChange={(e) => { setTriggerQty(e.target.value); markDirty(); }}
                  className={cn("h-11 bg-card border-border rounded-md px-4 text-sm w-32 tabular-nums", errors.triggerQty && "border-destructive")}
                  disabled={isPending}
                />
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-1.5 ms-1">
                  {t.form.trigger_qty_hint}
                </p>
              </Field>
            </div>
          </Section>

          {discountType === "free" && (
            <Section title={t.form.section_reward} icon={<Zap size={18} />}>
              <div className="space-y-5">
                <Field label={`${t.form.reward_product_label} *`} error={errors.rewardProductId}>
                  <Select
                    value={rewardProductId}
                    onValueChange={(v) => { setRewardProductId(v ?? ""); setRewardVariantId(""); markDirty(); }}
                    disabled={isPending}
                  >
                    <SelectTrigger className={cn("h-11 bg-card border-border rounded-md px-4 text-sm", errors.rewardProductId && "border-destructive")}>
                      <SelectValue placeholder={t.form.reward_product_placeholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-card rounded-lg max-h-64">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="font-bold text-sm py-2.5">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {rewardVariants.length > 0 && (
                  <Field label={t.form.reward_variant_label}>
                    <Select
                      value={rewardVariantId || "__default__"}
                      onValueChange={(v) => { setRewardVariantId(v === "__default__" ? "" : (v ?? "")); markDirty(); }}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card rounded-lg max-h-64">
                        <SelectItem value="__default__" className="font-bold text-sm py-2.5">
                          {rewardIsSameProduct ? t.form.reward_variant_same : t.form.reward_variant_any}
                        </SelectItem>
                        {rewardVariants.map((v) => (
                          <SelectItem key={v.id} value={v.id} className="font-bold text-sm py-2.5">
                            {variantLabel(v)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <Field label={`${t.form.reward_qty_label} *`} error={errors.rewardQty}>
                  <Input
                    type="number"
                    min={1}
                    value={rewardQty}
                    onChange={(e) => { setRewardQty(e.target.value); markDirty(); }}
                    className={cn("h-11 bg-card border-border rounded-md px-4 text-sm w-32 tabular-nums", errors.rewardQty && "border-destructive")}
                    disabled={isPending}
                  />
                </Field>
              </div>
            </Section>
          )}
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
                    {status === "active" ? "Offer is currently active" : "Offer is currently inactive"}
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

          <Section title={t.form.section_schedule} icon={<Calendar size={18} />}>
            <div className="space-y-5">
              <Field label={t.form.starts_at_label}>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => { setStartsAt(e.target.value); markDirty(); }}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  disabled={isPending}
                />
              </Field>
              <Field label={t.form.ends_at_label}>
                <Input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => { setEndsAt(e.target.value); markDirty(); }}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
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
