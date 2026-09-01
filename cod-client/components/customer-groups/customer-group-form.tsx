"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers, Paintbrush } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCustomerGroups } from "@/lib/translations";
import { createCustomerGroup, updateCustomerGroup } from "@/actions/customer-groups";
import type { CustomerGroup } from "@/types";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#64748b",
];

interface Props {
  mode: "create" | "edit";
  group?: CustomerGroup;
}

export function CustomerGroupForm({ mode, group }: Props) {
  const t = useCustomerGroups();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [color, setColor] = useState(group?.color ?? "#6366f1");

  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();
  const backHref = mode === "edit" && group ? `/customer-groups/${group.id}` : "/customer-groups";

  function handleSave() {
    if (!name.trim()) {
      toast.error(t.form.error_required);
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createCustomerGroup({
            name: name.trim(),
            description: description.trim() || undefined,
            color,
          });
          toast.success(t.form.success_add);
          resetDirty();
          router.push(`/customer-groups/${created.id}`);
        } else if (group) {
          await updateCustomerGroup(group.id, {
            name: name.trim(),
            description: description.trim() || null,
            color,
          });
          toast.success(t.form.success_edit);
          resetDirty();
          router.push(`/customer-groups/${group.id}`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.form.error_required);
      }
    });
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref={backHref} title={mode === "create" ? (t.form.title_add ?? "New Group") : (t.form.title_edit ?? "Edit Group")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSave}
        onCancel={() => router.push(backHref)}
        onDiscard={() => router.push(backHref)}
      />

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <Section title={t.form.name_label ?? "Basic Information"} icon={<Layers size={18} />}>
            <div className="space-y-5">
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

              <Field label={t.form.description_label}>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  placeholder={t.form.description_placeholder}
                  rows={3}
                  disabled={isPending}
                  dir="rtl"
                  className="w-full h-11 min-h-[80px] px-4 py-3 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all resize-none placeholder:text-muted-foreground/40 disabled:opacity-50"
                />
              </Field>
            </div>
          </Section>
        </div>

        <div className="w-[320px] shrink-0 space-y-6">
          <Section title={t.form.color_label} icon={<Paintbrush size={18} />}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="w-10 h-10 rounded-xl shrink-0 shadow-md transition-all" style={{ backgroundColor: color }} />
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground truncate">{name || t.form.name_placeholder}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{color}</p>
                </div>
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
                  <label className="w-9 h-9 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/40 transition-colors overflow-hidden relative">
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
