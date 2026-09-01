"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Phone, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createCustomer, updateCustomer } from "@/actions/customers";
import { getCommunes } from "@/actions/wilayas";
import { useCustomers } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import type { Customer } from "@/types";
import type { Wilaya, Commune } from "@/types";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface Props {
  customer?: Customer | null;
  wilayas: Wilaya[];
}

interface FormState {
  name: string;
  phone: string;
  phone2: string;
  wilayaId: number | null;
  wilayaName: string;
  commune: string;
  address: string;
}

function getInitialForm(customer?: Customer | null, wilayas?: Wilaya[]): FormState {
  let wilayaId: number | null = customer?.wilayaId ?? null;
  let wilayaName = customer?.wilaya ?? "";

  if (!wilayaId && customer?.wilaya && wilayas) {
    const matched = wilayas.find(
      (w) => w.nameAr === customer.wilaya || w.name === customer.wilaya
    );
    if (matched) {
      wilayaId = matched.id;
      wilayaName = matched.nameAr ?? matched.name;
    }
  }

  return {
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    phone2: customer?.phone2 ?? "",
    wilayaId,
    wilayaName,
    commune: customer?.communeId ?? "",
    address: customer?.address ?? "",
  };
}

export function CustomerFormPage({ customer, wilayas }: Props) {
  const router = useRouter();
  const t = useCustomers();
  const { dir } = useLanguage();
  const isEdit = !!customer;
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => getInitialForm(customer, wilayas));
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [communesLoading, setCommunesLoading] = useState(false);

  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  useEffect(() => {
    if (!form.wilayaId) {
      setCommunes([]);
      return;
    }
    setCommunesLoading(true);
    getCommunes(form.wilayaId)
      .then(setCommunes)
      .catch(() => setCommunes([]))
      .finally(() => setCommunesLoading(false));
  }, [form.wilayaId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  function handleWilayaChange(wilayaIdStr: string | null) {
    if (!wilayaIdStr) {
      set("wilayaId", null);
      set("wilayaName", "");
      set("commune", "");
      return;
    }
    const id = Number(wilayaIdStr);
    const w = wilayas.find((w) => w.id === id);
    setForm((prev) => ({
      ...prev,
      wilayaId: id,
      wilayaName: w?.nameAr ?? w?.name ?? "",
      commune: "",
    }));
    markDirty();
  }

  function handleSave() {
    if (!form.name.trim() || !form.phone.trim() || !form.wilayaId) {
      toast.error(t.form.error_required ?? "يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (!form.commune) {
      toast.error(t.form.error_commune_required ?? "يرجى اختيار البلدية");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          phone2: form.phone2.trim() || null,
          wilayaId: form.wilayaId!,
          communeId: form.commune,
          address: form.address.trim() || undefined,
        };

        if (isEdit && customer) {
          await updateCustomer(customer.id, payload);
          toast.success(t.form.success_edit);
          resetDirty();
          router.push(`/customers/${customer.id}`);
        } else {
          const created = await createCustomer(payload);
          toast.success(t.form.success_add);
          resetDirty();
          router.push(`/customers/${created.id}`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.form.error_required ?? "حدث خطأ");
      }
    });
  }

  const backHref = isEdit ? `/customers/${customer!.id}` : "/customers";
  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref={backHref} title={isEdit ? (t.form.title_edit ?? "Edit Customer") : (t.form.title_add ?? "New Customer")} />
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
          <Section title="Personal Information" icon={<User size={18} />}>
            <div className="space-y-5">
              <Field label={`${t.form.name_label} *`}>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t.form.name_placeholder}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  disabled={isPending}
                  dir={dir}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={`${t.form.phone_label} *`}>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <Input
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder={t.form.phone_placeholder}
                      className="h-11 bg-card border-border rounded-md pl-11 text-sm"
                      type="tel"
                      dir="ltr"
                      disabled={isPending}
                    />
                  </div>
                </Field>
                <Field label={t.form.phone2_label}>
                  <div className="relative">
                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <Input
                      value={form.phone2}
                      onChange={(e) => set("phone2", e.target.value)}
                      placeholder={t.form.phone2_placeholder}
                      className="h-11 bg-card border-border rounded-md pl-11 text-sm"
                      type="tel"
                      dir="ltr"
                      disabled={isPending}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="w-[320px] shrink-0 space-y-6">
          <Section title={t.form.wilaya_label ?? "Location"} icon={<Globe size={18} />}>
            <div className="space-y-5">
              <Field label={`${t.form.wilaya_label} *`}>
                <Select
                  value={form.wilayaId ? String(form.wilayaId) : ""}
                  onValueChange={(v) => handleWilayaChange(v ?? null)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm">
                    {form.wilayaName ? (
                      <span className="font-bold">{form.wilayaName}</span>
                    ) : (
                      <span className="text-muted-foreground">{t.form.wilaya_placeholder}</span>
                    )}
                  </SelectTrigger>
                  <SelectContent className="rounded-lg max-h-64">
                    {wilayas.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)} className="font-bold text-sm py-2.5">
                        {w.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={`${t.form.commune_label} *`}>
                <Select
                  value={form.commune}
                  onValueChange={(v) => set("commune", v ?? "")}
                  disabled={isPending || !form.wilayaId || communesLoading}
                >
                  <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm">
                    {form.commune ? (
                      <span className="font-bold">
                        {communes.find((c) => c.id === form.commune)?.nameAr ?? form.commune}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {communesLoading
                          ? (t.form.commune_loading ?? "جاري التحميل...")
                          : (t.form.commune_placeholder ?? "اختر البلدية")}
                      </span>
                    )}
                  </SelectTrigger>
                  <SelectContent className="rounded-lg max-h-64">
                    {communes.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-bold text-sm py-2.5">
                        {c.nameAr || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t.form.address_label}>
                <div className="relative">
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <Input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder={t.form.address_placeholder}
                    className="h-11 bg-card border-border rounded-md pl-11 text-sm"
                    disabled={isPending}
                    dir={dir}
                  />
                </div>
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
