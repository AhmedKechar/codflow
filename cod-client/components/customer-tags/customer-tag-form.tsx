"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tag, Paintbrush } from "lucide-react";
import { Input } from "@/components/ui/input";
import { showErrorToast, showSuccessToast } from "@/lib/errors/toast";
import { useErrorLocale } from "@/lib/errors/use-locale";
import { useCustomerTags } from "@/lib/translations";
import { createCustomerTag, updateCustomerTag } from "@/actions/customer-tags";
import type { CustomerTag } from "@/types";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const PRESET_COLORS = [
  "#64748b", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

interface Props {
  mode: "create" | "edit";
  tag?: CustomerTag;
}

export function CustomerTagForm({ mode, tag }: Props) {
  const t = useCustomerTags();
  const router = useRouter();
  const locale = useErrorLocale();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? "#64748b");

  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();
  const backHref = mode === "edit" && tag ? `/customer-tags/${tag.id}` : "/customer-tags";

  function handleSave() {
    if (!name.trim()) {
      showErrorToast(t.form.error_required, locale);
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createCustomerTag({ name: name.trim(), color });
          showSuccessToast(t.form.success_add, locale);
          resetDirty();
          router.push(`/customer-tags/${created.id}`);
        } else if (tag) {
          await updateCustomerTag(tag.id, { name: name.trim(), color });
          showSuccessToast(t.form.success_edit, locale);
          resetDirty();
          router.push(`/customer-tags/${tag.id}`);
        }
      } catch (error) {
        showErrorToast(error instanceof Error ? error.message : t.form.error_required, locale);
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref={backHref} title={mode === "create" ? (t.form.title_add ?? "New Tag") : (t.form.title_edit ?? "Edit Tag")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSave}
        onCancel={() => router.push(backHref)}
        onDiscard={() => router.push(backHref)}
      />

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <Section title={t.form.name_label ?? "Tag Name"} icon={<Tag size={18} />}>
            <Field label={`${t.form.name_label} *`}>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); markDirty(); }}
                placeholder={t.form.name_placeholder}
                className="h-11 bg-card border-border rounded-md px-4 text-sm"
                disabled={isPending}
                dir="rtl"
              />
            </Field>
          </Section>
        </div>

        <div className="w-[320px] shrink-0 space-y-6">
          <Section title={t.form.color_label} icon={<Paintbrush size={18} />}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <span
                  className="px-3.5 py-1.5 rounded-full text-sm font-black text-white shrink-0 transition-all"
                  style={{ backgroundColor: color }}
                >
                  {name || t.form.name_placeholder}
                </span>
                <p className="text-[10px] font-mono text-muted-foreground/50">{color}</p>
              </div>

              <Field label={t.form.color_label}>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setColor(c); markDirty(); }}
                      disabled={isPending}
                      className="w-9 h-9 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                      style={{
                        backgroundColor: c,
                        boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                      }}
                    />
                  ))}
                  <label className="w-9 h-9 rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/40 transition-colors overflow-hidden relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => { setColor(e.target.value); markDirty(); }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <span className="text-[10px] font-black text-muted-foreground/50 pointer-events-none">+</span>
                  </label>
                </div>
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
