"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Truck, UserPlus, AlertCircle, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showErrorToast, showSuccessToast } from "@/lib/errors/toast";
import { useErrorLocale } from "@/lib/errors/use-locale";
import { createDriver, updateDriver } from "@/actions/drivers";
import type { Driver } from "@/types";
import { useDelivery } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { createDriverFormSchema, type DriverFormErrors } from "@/validations/drivers";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";

interface Props {
  driver?: Driver | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  phone2: string;
  vehicleType: string;
  notes: string;
}

function getInitialForm(driver?: Driver | null): FormState {
  return {
    firstName: driver?.firstName ?? "",
    lastName: driver?.lastName ?? "",
    phone: driver?.phone ?? "",
    phone2: driver?.phone2 ?? "",
    vehicleType: driver?.vehicleType ?? "",
    notes: driver?.notes ?? "",
  };
}

export function DriverFormPage({ driver }: Props) {
  const router = useRouter();
  const t = useDelivery();
  const { dir } = useLanguage();
  const locale = useErrorLocale();
  const isEdit = !!driver;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(getInitialForm(driver));
  const [errors, setErrors] = useState<DriverFormErrors>({});
  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    markDirty();
    if (errors[key as keyof DriverFormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSave() {
    const parsed = createDriverFormSchema(locale).safeParse({
      ...form,
      phone2: form.phone2.trim() || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: DriverFormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof DriverFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      try {
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          phone2: form.phone2.trim() || null,
          vehicleType: (form.vehicleType as "motorcycle" | "car" | "van") || null,
          notes: form.notes.trim() || null,
        };

        if (isEdit && driver) {
          await updateDriver(driver.id, payload);
          resetDirty();
          showSuccessToast(t.driver_form.success_edit, locale);
          router.push(`/delivery/drivers/${driver.id}`);
        } else {
          await createDriver(payload);
          resetDirty();
          showSuccessToast(t.driver_form.success_add, locale);
          router.push("/delivery");
        }
      } catch (error) {
        showErrorToast(error instanceof Error ? error.message : t.driver_form.error_required, locale);
      }
    });
  }

  const backHref = isEdit ? `/delivery/drivers/${driver!.id}` : "/delivery/drivers";

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref={backHref} title={isEdit ? (t.driver_form.title_edit ?? "Edit Driver") : (t.driver_form.title_add ?? "New Driver")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSave}
        onCancel={() => router.push(backHref)}
        onDiscard={() => router.push(backHref)}
      />

      <div className="flex items-start gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          <Section title={t.driver_form.personal_info_label ?? "Personal Information"} icon={<UserPlus size={18} />}>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] ml-1">
                    {t.driver_form.first_name_label}
                  </Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder={t.driver_form.first_name_placeholder}
                    className="h-12 bg-muted/20 border-border rounded-lg px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/30 transition-all"
                    disabled={isPending}
                  />
                  {errors.firstName && (
                    <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-bold">
                      <AlertCircle size={11} />
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] ml-1">
                    {t.driver_form.last_name_label}
                  </Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder={t.driver_form.last_name_placeholder}
                    className="h-12 bg-muted/20 border-border rounded-lg px-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/30 transition-all"
                    disabled={isPending}
                  />
                  {errors.lastName && (
                    <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-bold">
                      <AlertCircle size={11} />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] ml-1">
                    {t.driver_form.phone_label}
                  </Label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <Input
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="0XXXXXXXXX"
                      className="h-12 bg-muted/20 border-border rounded-lg pl-11 pr-4 text-sm font-bold font-mono tracking-wider focus:ring-primary/20 focus:border-primary/30 transition-all"
                      type="tel"
                      inputMode="tel"
                      dir="ltr"
                      disabled={isPending}
                    />
                  </div>
                  {errors.phone && (
                    <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-bold">
                      <AlertCircle size={11} />
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] ml-1">
                    {t.driver_form.phone2_label}
                  </Label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <Input
                      value={form.phone2}
                      onChange={(e) => set("phone2", e.target.value)}
                      placeholder="0XXXXXXXXX (Optional)"
                      className="h-12 bg-muted/20 border-border rounded-lg pl-11 pr-4 text-sm font-bold font-mono tracking-wider focus:ring-primary/20 focus:border-primary/30 transition-all"
                      type="tel"
                      inputMode="tel"
                      dir="ltr"
                      disabled={isPending}
                    />
                  </div>
                  {errors.phone2 && (
                    <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-bold">
                      <AlertCircle size={11} />
                      {errors.phone2}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Section>

          <Section title={t.driver_form.notes_label ?? "Notes"} icon={<Settings2 size={18} />}>
            <div className="p-8">
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder={t.driver_form.notes_placeholder}
                className="bg-muted/20 border-border rounded-lg p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/30 transition-all min-h-[120px] resize-none"
                disabled={isPending}
                dir={dir}
              />
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="w-[320px] shrink-0 space-y-6">
          <Section title={t.driver_form.logistics_label ?? "Vehicle & Compensation"} icon={<Truck size={18} />}>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] ml-1">
                    {t.driver_form.vehicle_label}
                  </Label>
                  <Select
                    value={form.vehicleType}
                    onValueChange={(v) => set("vehicleType", v ?? "")}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-12 bg-muted/20 border-border rounded-lg px-4 text-sm font-bold focus:ring-primary/20">
                      <SelectValue placeholder={t.driver_form.vehicle_placeholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-lg overflow-hidden shadow-sm">
                      <SelectItem value="motorcycle" className="font-bold py-3 focus:bg-primary/10">
                        {t.vehicle_type.motorcycle}
                      </SelectItem>
                      <SelectItem value="car" className="font-bold py-3 focus:bg-primary/10">
                        {t.vehicle_type.car}
                      </SelectItem>
                      <SelectItem value="van" className="font-bold py-3 focus:bg-primary/10">
                        {t.vehicle_type.van}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isEdit && (
                <div className="pt-6 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider leading-relaxed">
                    {(t.driver_form as unknown as Record<string, string>).compensations_hint ?? "Per-wilaya delivery fees are managed from the driver's detail page."}
                  </p>
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
