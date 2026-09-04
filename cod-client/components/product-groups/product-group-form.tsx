"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Globe, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { showErrorToast, showSuccessToast } from "@/lib/errors/toast";
import { useErrorLocale } from "@/lib/errors/use-locale";
import { useProductGroups } from "@/lib/translations";
import { createProductGroup, updateProductGroup } from "@/actions/product-groups";
import { CategoryImageUploader } from "./category-image-uploader";
import type { ProductCategory } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  group?: ProductCategory;
  allGroups: ProductCategory[];
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\s-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductGroupForm({ group, allGroups }: Props) {
  const router = useRouter();
  const t = useProductGroups();
  const locale = useErrorLocale();
  const isEdit = !!group;
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(group?.name ?? "");
  const [slug, setSlug] = useState(group?.slug ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [parentId, setParentId] = useState(group?.parentId ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(group?.imageUrl ?? null);
  const [metaTitle, setMetaTitle] = useState(group?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(group?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState(group?.metaKeywords ?? "");
  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && name) setSlug(toSlug(name));
  }, [name, isEdit]);

  async function handleSave() {
    if (!name.trim()) {
      showErrorToast(t.form.error_name_required, locale);
      return;
    }
    startTransition(async () => {
      try {
        const data = {
          name,
          slug: slug || toSlug(name),
          description: description || undefined,
          parentId: parentId || undefined,
          imageUrl: imageUrl || undefined,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          metaKeywords: metaKeywords || undefined,
        };
        if (isEdit && group) {
          await updateProductGroup(group.id, data);
          showSuccessToast(t.form.success_edit, locale);
        } else {
          await createProductGroup(data);
          showSuccessToast(t.form.success_add, locale);
        }
        resetDirty();
        router.push("/product-groups");
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : t.form.error_save_failed, locale);
      }
    });
  }

  // Filter out the group itself to prevent circular parent
  const parentOptions = allGroups.filter((g) => g.id !== group?.id);

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref="/product-groups" title={isEdit ? (t.form.title_edit ?? "Edit Group") : (t.form.title_add ?? "New Group")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSave}
        onCancel={() => router.push("/product-groups")}
        onDiscard={() => router.push("/product-groups")}
      />

      <div className="flex items-start gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          <Section title={t.form.name_label ?? "Basic Information"} icon={<Settings2 size={18} />}>
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

              <Field label={t.form.slug_label}>
                <Input
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); markDirty(); }}
                  dir="ltr"
                  className="h-11 bg-card border-border rounded-md px-4 font-mono text-[13px]"
                  disabled={isPending}
                />
              </Field>

              <Field label={t.form.parent_label}>
                <Select value={parentId} onValueChange={(v) => { setParentId(v ?? ""); markDirty(); }}>
                  <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm" disabled={isPending}>
                    <SelectValue placeholder={t.form.parent_placeholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-card rounded-lg">
                    <SelectItem value="">{t.form.parent_placeholder}</SelectItem>
                    {parentOptions.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t.form.description_label}>
                <Textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  rows={4}
                  className="h-11 min-h-[120px] bg-card border-border rounded-md px-4 text-sm resize-none"
                  disabled={isPending}
                  dir="rtl"
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="w-[320px] shrink-0 space-y-6">
          <Section title={t.form.section_image ?? "Image"} icon={<ImageIcon size={18} />}>
            <Field label={t.form.image_label}>
              <CategoryImageUploader
                value={imageUrl}
                onChange={(val) => { setImageUrl(val); markDirty(); }}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t.form.image_help ?? "Upload an image to represent this category in the store"}
              </p>
            </Field>
          </Section>

          <Section title={t.form.section_seo ?? "SEO Settings"} icon={<Globe size={18} />}>
            <div className="space-y-5">
              <Field label={t.form.meta_title_label ?? "Meta Title"}>
                <div className="space-y-1.5">
                  <Input
                    value={metaTitle}
                    onChange={(e) => { setMetaTitle(e.target.value); markDirty(); }}
                    placeholder={t.form.meta_title_placeholder ?? "SEO title for search engines"}
                    maxLength={60}
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                    disabled={isPending}
                    dir="rtl"
                  />
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-muted-foreground">
                      {t.form.meta_title_help ?? "Recommended: 50-60 characters"}
                    </span>
                    <span className={cn("font-mono font-bold", metaTitle.length > 55 ? "text-warning" : "text-muted-foreground")}>
                      {metaTitle.length}/60
                    </span>
                  </div>
                </div>
              </Field>

              <Field label={t.form.meta_description_label ?? "Meta Description"}>
                <div className="space-y-1.5">
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => { setMetaDescription(e.target.value); markDirty(); }}
                    placeholder={t.form.meta_description_placeholder ?? "Brief description for search results"}
                    maxLength={160}
                    rows={3}
                    className="h-11 min-h-[120px] bg-card border-border rounded-md px-4 text-sm resize-none"
                    disabled={isPending}
                    dir="rtl"
                  />
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-muted-foreground">
                      {t.form.meta_description_help ?? "Recommended: 150-160 characters"}
                    </span>
                    <span className={cn("font-mono font-bold", metaDescription.length > 150 ? "text-warning" : "text-muted-foreground")}>
                      {metaDescription.length}/160
                    </span>
                  </div>
                </div>
              </Field>

              <Field label={t.form.meta_keywords_label ?? "Meta Keywords"}>
                <Input
                  value={metaKeywords}
                  onChange={(e) => { setMetaKeywords(e.target.value); markDirty(); }}
                  placeholder={t.form.meta_keywords_placeholder ?? "keyword1, keyword2, keyword3"}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  disabled={isPending}
                  dir="rtl"
                />
                <p className="text-xs text-muted-foreground mt-1.5 px-1">
                  {t.form.meta_keywords_help ?? "Comma-separated keywords for search engines"}
                </p>
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
