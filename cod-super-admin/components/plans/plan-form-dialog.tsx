"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlans } from "@/lib/translations";
import { createPlanAction, updatePlanAction, type PlanInput } from "@/actions/plans";

type PlanRow = {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  priceDzd: number;
  billingCycle: "monthly" | "yearly";
  trialDays: number | null;
  maxOrders: number;
  maxProducts: number | null;
  maxDrivers: number | null;
  maxCustomers: number | null;
  maxTeamMembers: number | null;
  maxAiCredits: number | null;
  features: string | null;
  isActive: boolean;
  sortOrder: number;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PlanRow | null;
}

export function PlanFormDialog({ open, onOpenChange, plan }: Props) {
  const t = usePlans();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(plan?.name ?? "");
  const [nameAr, setNameAr] = useState(plan?.nameAr ?? "");
  const [nameFr, setNameFr] = useState(plan?.nameFr ?? "");
  const [priceDzd, setPriceDzd] = useState(plan?.priceDzd ?? 0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(plan?.billingCycle ?? "monthly");
  const [trialDays, setTrialDays] = useState(plan?.trialDays ?? 0);
  const [maxOrders, setMaxOrders] = useState(plan?.maxOrders ?? 20);
  const [maxProducts, setMaxProducts] = useState(plan?.maxProducts ?? 100);
  const [maxDrivers, setMaxDrivers] = useState(plan?.maxDrivers ?? 5);
  const [maxCustomers, setMaxCustomers] = useState(plan?.maxCustomers ?? 1000);
  const [maxTeamMembers, setMaxTeamMembers] = useState(plan?.maxTeamMembers ?? 2);
  const [maxAiCredits, setMaxAiCredits] = useState(plan?.maxAiCredits ?? 0);
  const [features, setFeatures] = useState(plan?.features ?? "");
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(plan?.sortOrder ?? 0);

  const num = (v: string, fallback = 0) => {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: PlanInput = {
      name,
      nameAr,
      nameFr,
      priceDzd: num(String(priceDzd)),
      billingCycle,
      trialDays: num(String(trialDays)),
      maxOrders: num(String(maxOrders)),
      maxProducts: num(String(maxProducts)),
      maxDrivers: num(String(maxDrivers)),
      maxCustomers: num(String(maxCustomers)),
      maxTeamMembers: num(String(maxTeamMembers)),
      maxAiCredits: num(String(maxAiCredits)),
      features: features || null,
      sortOrder: num(String(sortOrder)),
    };

    startTransition(async () => {
      try {
        if (plan) {
          await updatePlanAction(plan.id, { ...data, isActive });
          toast.success(t.updated);
        } else {
          await createPlanAction(data);
          toast.success(t.created);
        }
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{plan ? t.edit : t.create}</DialogTitle>
            <DialogDescription>{`${plan ? t.edit : t.create} ${t.title}`}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label={t.name_ar}>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
            </Field>
            <Field label={t.name_fr}>
              <Input value={nameFr} onChange={(e) => setNameFr(e.target.value)} required />
            </Field>
            <Field label={t.price_dzd}>
              <Input
                type="number"
                value={priceDzd}
                onChange={(e) => setPriceDzd(num(e.target.value))}
                required
              />
            </Field>
            <Field label={t.billing_cycle}>
              <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}>
                <SelectTrigger>
                  <SelectValue>{billingCycle === "monthly" ? t.monthly : t.yearly}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t.monthly}</SelectItem>
                  <SelectItem value="yearly">{t.yearly}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t.trial_days}>
              <Input type="number" value={trialDays} onChange={(e) => setTrialDays(num(e.target.value))} />
            </Field>
            <Field label={t.max_orders}>
              <Input type="number" value={maxOrders} onChange={(e) => setMaxOrders(num(e.target.value))} />
            </Field>
            <Field label={t.max_products}>
              <Input type="number" value={maxProducts} onChange={(e) => setMaxProducts(num(e.target.value))} />
            </Field>
            <Field label={t.max_drivers}>
              <Input type="number" value={maxDrivers} onChange={(e) => setMaxDrivers(num(e.target.value))} />
            </Field>
            <Field label={t.max_customers}>
              <Input type="number" value={maxCustomers} onChange={(e) => setMaxCustomers(num(e.target.value))} />
            </Field>
            <Field label={t.max_team_members}>
              <Input type="number" value={maxTeamMembers} onChange={(e) => setMaxTeamMembers(num(e.target.value))} />
            </Field>
            <Field label={t.max_ai_credits}>
              <Input type="number" value={maxAiCredits} onChange={(e) => setMaxAiCredits(num(e.target.value))} />
            </Field>
            <Field label={t.sort_order}>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(num(e.target.value))} />
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
              <Label className="font-semibold">{t.is_active}</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="sm:col-span-2">
              <Field label={t.features}>
                <Textarea
                  rows={3}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder={`["feature1", "feature2"]`}
                />
              </Field>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel ?? "Cancel"}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "..." : t.save ?? "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
