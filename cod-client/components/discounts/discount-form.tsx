"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Tag, Percent, DollarSign, Calendar, Settings2, Save, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const [startsAt, setStartsAt] = useState(
    discount?.startsAt ? discount.startsAt.slice(0, 10) : ""
  );
  const [expiresAt, setExpiresAt] = useState(
    discount?.expiresAt ? discount.expiresAt.slice(0, 10) : ""
  );
  const [status, setStatus] = useState<"active" | "inactive">(
    discount?.status === "expired" ? "inactive" : (discount?.status ?? "active")
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!code.trim()) {
      errs.code = t.form.error_code_required;
    } else if (!/^[A-Za-z0-9]+$/.test(code.trim())) {
      errs.code = t.form.error_code_format;
    }

    if (!value.trim()) {
      errs.value = t.form.error_value_required;
    } else {
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal <= 0) {
        errs.value = t.form.error_value_positive;
      } else if (type === "percentage" && numVal > 100) {
        errs.value = t.form.error_percentage_max;
      }
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
        router.push("/discounts");
        router.refresh();
      } catch {
        toast.error(t.form.error_save);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto pb-48 md:pb-12 space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-end gap-2.5 sm:gap-3">
        <div className="hidden lg:flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="h-10 px-6 rounded-xl font-black text-[11px] uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95"
          >
            {isPending ? "..." : <><Save size={14} className="me-2" /> {t.form.save}</>}
          </Button>
        </div>
        <Link
          href="/discounts"
          className="group inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-border/40 bg-white/50 dark:bg-muted/20 text-muted-foreground hover:text-foreground transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Link>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <Section title={isEdit ? t.form.title_edit : t.form.title_add} icon={<Tag size={18} />}>
          <div className="space-y-5">
            <Field label={`${t.form.code_label} *`} error={errors.code}>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t.form.code_placeholder}
                className={cn(
                  "h-11 sm:h-12 bg-muted/20 border-border/40 rounded-xl sm:rounded-2xl px-4 text-sm font-bold uppercase focus:ring-primary/20 focus:border-primary/30 transition-all",
                  errors.code && "border-destructive"
                )}
                disabled={isPending}
                maxLength={20}
              />
            </Field>

            <div className="space-y-2">
              <Label className="text-[9px] sm:text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest ml-1">
                {t.form.type_label}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(["percentage", "fixed"] as const).map((t_) => (
                  <button
                    key={t_}
                    type="button"
                    onClick={() => setType(t_)}
                    className={cn(
                      "flex items-center justify-center gap-2.5 rounded-xl border p-4 text-sm font-bold transition-all active:scale-[0.98]",
                      type === t_
                        ? "bg-primary/[0.03] border-primary/30 text-primary shadow-sm"
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="text-xl">{t_ === "percentage" ? "percent" : "dollar"}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">
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
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={t.form.value_placeholder}
                  className={cn(
                    "h-11 sm:h-12 bg-muted/20 border-border/40 rounded-xl sm:rounded-2xl pl-11 pr-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/30 transition-all tabular-nums",
                    errors.value && "border-destructive"
                  )}
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
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder={t.form.min_order_placeholder}
                  className="h-11 sm:h-12 bg-muted/20 border-border/40 rounded-xl sm:rounded-2xl pl-11 pr-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/30 transition-all tabular-nums"
                  disabled={isPending}
                />
              </div>
            </Field>

            <Field label={t.form.max_uses_label}>
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder={t.form.max_uses_placeholder}
                className="h-11 sm:h-12 bg-muted/20 border-border/40 rounded-xl sm:rounded-2xl px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/30 transition-all tabular-nums"
                disabled={isPending}
              />
            </Field>
          </div>
        </Section>

        <Section title={t.form.starts_at_label} icon={<Calendar size={18} />}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.form.starts_at_label}>
                <Input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="h-11 sm:h-12 bg-muted/20 border-border/40 rounded-xl sm:rounded-2xl px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/30 transition-all"
                  disabled={isPending}
                />
              </Field>
              <Field label={t.form.expires_at_label}>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-11 sm:h-12 bg-muted/20 border-border/40 rounded-xl sm:rounded-2xl px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/30 transition-all"
                  disabled={isPending}
                />
              </Field>
            </div>
          </div>
        </Section>

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
                onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
                disabled={isPending}
                className="scale-95 sm:scale-100 shrink-0"
              />
            </label>
          </div>
        </Section>
      </div>

      <div className="fixed bottom-[88px] inset-x-4 z-40 lg:hidden animate-in slide-in-from-bottom-8 duration-500">
        <div className="glass-card border-white/20 dark:border-white/5 rounded-[2rem] p-2.5 sm:p-3 shadow-2xl flex items-center gap-2.5 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/discounts")}
            disabled={isPending}
            className="flex-none w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-border/40 bg-white/50 dark:bg-muted/20 text-muted-foreground transition-all active:scale-90 shadow-sm"
          >
            <X size={20} />
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 h-12 sm:h-14 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-95"
          >
            {isPending ? "..." : <><Save size={16} className="me-2" /> {t.form.save}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl sm:rounded-[2rem] border-border/30 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 sm:px-8 sm:py-5 border-b border-border/10 bg-muted/5">
        {icon && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
            <div className="text-primary scale-90 sm:scale-100">{icon}</div>
          </div>
        )}
        <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight font-display uppercase">{title}</h2>
      </div>
      <div className="p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-[9px] sm:text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest ml-1">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive font-medium mt-1.5 ms-1">{error}</p>}
    </div>
  );
}
