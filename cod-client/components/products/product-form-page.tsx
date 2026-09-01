"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, Package, DollarSign, Layers, Settings2, BarChart3,
  ImageIcon, Upload, File, Truck, Search, ChevronDown,
  ChevronUp, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useProducts, useCommon } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { useConfirm } from "@/components/ui/use-confirm";
import { ProductOptionsManager } from "./product-options-manager";
import { ProductImageUploader, type PendingImage } from "./product-image-uploader";
import { ProductDescriptionEditor } from "./product-description-editor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  createProduct, updateProduct, getProduct,
  createVariant, updateVariant, getVariants, deleteVariant,
  getProductImages, saveProductImage, deleteProductImage,
} from "@/actions/products";
import type { ProductCategory, ProductStatus, ProductImage, VariantOptionFormState, ShippingProfile } from "@/types";
import { cn } from "@/lib/utils";
import { createProductFormSchema, type ProductFormErrors } from "@/validations/products";
import { FormSection as Section, FormField as Field } from "@/components/ui/form-section";
import { ContextualSaveBar } from "@/components/ui/contextual-save-bar";
import { FormHeader } from "@/components/ui/form-header";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface Props {
  productId?: string;
  groups: ProductCategory[];
  shippingProfiles?: ShippingProfile[];
}

interface VariantRow {
  key: string;
  variations: Record<string, string>;
  price: string;
  sku: string;
  inventory: string;
  lowStockThreshold: string;
  active: boolean;
  existingId?: string;
  imageId?: string | null;
}

const STATUS_VALUES: ProductStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED"];

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function calcMargin(price: string, cost: string) {
  const b = Number(price), c = Number(cost);
  if (!b || !c || c >= b) return null;
  return Math.round(((b - c) / b) * 100);
}

function generateCombinations(options: VariantOptionFormState[]): Array<{ key: string; variations: Record<string, string> }> {
  const valid = options.filter((o) => o.name.trim() && o.values.some((v) => v.value.trim()));
  if (!valid.length) return [];
  let result: Record<string, string>[] = [{}];
  for (const opt of valid) {
    const vals = opt.values.filter((v) => v.value.trim());
    result = result.flatMap((existing) => vals.map((val) => ({ ...existing, [opt.name]: val.value })));
  }
  return result.map((variations) => ({ key: Object.values(variations).join(" / "), variations }));
}

export function ProductFormPage({ productId, groups, shippingProfiles = [] }: Props) {
  const router = useRouter();
  const t = useProducts();
  const common = useCommon();
  const { dir, locale } = useLanguage();
  const isEdit = !!productId;
  const [isPending, startTransition] = useTransition();
  const { confirm: confirmDialog, ConfirmDialog } = useConfirm();
  const { isDirty, markDirty, resetDirty } = useUnsavedChanges();

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [initialLoading, setInitialLoading] = useState(isEdit);

  // Basic
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shippingProfileId, setShippingProfileId] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  // Digital product
  const [isDigital, setIsDigital] = useState(false);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [digitalFileUrl, setDigitalFileUrl] = useState<string | null>(null);

  // Pricing
  const [price, setPrice] = useState("");
  const priceRef = useRef("");
  priceRef.current = price;
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");

  // Settings
  const [status, setStatus] = useState<ProductStatus>("ACTIVE");
  const [trackInventory, setTrackInventory] = useState(true);
  const [inventory, setInventory] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [barcode, setBarcode] = useState("");

  // Shipping
  const [weightKg, setWeightKg] = useState("");
  const [shippingMethod, setShippingMethod] = useState<string>("");
  const [shippingOfficePrice, setShippingOfficePrice] = useState("");
  const [shippingHomePrice, setShippingHomePrice] = useState("");

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  // Collapsible sections
  const [inventoryExpanded, setInventoryExpanded] = useState(false);

  // Images
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  // Options & generated variant rows
  const [hasVariantsSwitch, setHasVariantsSwitch] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOptionFormState[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const skipOptionsSyncRef = useRef(false);

  // Bulk fill toolbar state
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSkuPrefix, setBulkSkuPrefix] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  // Image picker per variant row
  const [openImagePickerRow, setOpenImagePickerRow] = useState<number | null>(null);

  useEffect(() => {
    if (!isEdit && name) setSlug(toSlug(name));
  }, [name, isEdit]);

  useEffect(() => {
    if (productId) loadProduct(productId);
  }, [productId]);

  useEffect(() => {
    if (skipOptionsSyncRef.current) {
      skipOptionsSyncRef.current = false;
      return;
    }
    const combos = generateCombinations(variantOptions);
    setVariantRows((prev) => {
      const byKey = Object.fromEntries(prev.map((r) => [r.key, r]));
      return combos.map((c) => ({
        ...c,
        price: byKey[c.key]?.price ?? priceRef.current,
        sku: byKey[c.key]?.sku ?? "",
        inventory: byKey[c.key]?.inventory ?? "0",
        lowStockThreshold: byKey[c.key]?.lowStockThreshold ?? "5",
        active: byKey[c.key]?.active ?? true,
        existingId: byKey[c.key]?.existingId,
        imageId: byKey[c.key]?.imageId ?? null,
      }));
    });
  }, [variantOptions]);

  async function loadProduct(id: string) {
    try {
      setInitialLoading(true);
      const [p, loadedVariants, loadedImages] = await Promise.all([
        getProduct(id),
        getVariants(id),
        getProductImages(id),
      ]);
      setExistingImages(loadedImages);
      if (!p) { toast.error(t.form.error_not_found); return; }
      setName(p.name);
      setSlug(p.handle);
      setSku(p.sku ?? "");
      setCategoryId(p.categoryId ?? "");
      setShippingProfileId(p.shippingProfileId ?? null);
      setDescription(p.description ?? "");
      setPrice(String(p.price));
      setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice) : "");
      setCostPrice(p.costPrice ? String(p.costPrice) : "");
      setStatus(p.status);
      setTrackInventory(p.trackInventory);
      setInventory(String(p.inventory));
      setLowStockThreshold(String(p.lowStockThreshold ?? 5));
      setBarcode(p.barcode ?? "");
      setWeightKg(p.weightKg ? String(p.weightKg) : "");
      setShippingMethod(p.shippingMethod ?? "");
      setShippingOfficePrice(p.shippingOfficePrice != null ? String(p.shippingOfficePrice) : "");
      setShippingHomePrice(p.shippingHomePrice != null ? String(p.shippingHomePrice) : "");
      setMetaTitle(p.metaTitle ?? "");
      setMetaDescription(p.metaDescription ?? "");
      setMetaKeywords(p.metaKeywords ?? "");
      setIsDigital(p.type === "DIGITAL");

      if (p.hasVariants) {
        setHasVariantsSwitch(true);
      }

      if (p.hasVariants && p.variantOptions) {
        skipOptionsSyncRef.current = true;
        setVariantOptions(
          p.variantOptions.map((opt) => {
            const hasColorVal = (opt.values ?? []).some((v) => v.hexColor);
            return {
              id: `tmp-${Math.random().toString(36).slice(2)}`,
              name: opt.name,
              displayMode: (opt.displayMode ?? (hasColorVal ? "color-circle" : "text")) as "color-circle" | "color-frame" | "color-text" | "text",
              values: opt.values.map((val) => ({
                id: `tmp-${Math.random().toString(36).slice(2)}`,
                value: val.value,
                hexColor: val.hexColor ?? "",
              })),
            };
          })
        );
      }

      if (p.hasVariants && loadedVariants.length > 0) {
        setVariantRows(
          loadedVariants.map((v) => ({
            key: Object.values(v.variations).join(" / "),
            variations: v.variations,
            price: String(v.price),
            sku: v.sku ?? "",
            inventory: String(v.inventory),
            lowStockThreshold: String(v.lowStockThreshold ?? 5),
            active: v.active,
            existingId: v.id,
            imageId: v.imageId ?? null,
          }))
        );
      }
    } catch {
      toast.error(t.form.error_load_failed);
    } finally {
      setInitialLoading(false);
    }
  }

  function updateVariantRow(index: number, field: "price" | "sku" | "inventory" | "lowStockThreshold" | "active", value: string | boolean) {
    setVariantRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function updateVariantImageId(index: number, imageId: string | null) {
    setVariantRows((prev) => prev.map((r, i) => (i === index ? { ...r, imageId } : r)));
  }

  async function handleSave() {
    if (isDigital && !digitalFile && !isEdit) {
      toast.error(t.form.error_digital_file_required ?? "Digital file is required for digital products");
      return;
    }

    const parsed = createProductFormSchema(locale, hasVariantsSwitch).safeParse({
      name: name.trim(),
      sku: sku.trim(),
      price,
      compareAtPrice,
      costPrice,
      variantRows: hasVariantsSwitch ? variantRows.map((r) => ({ sku: r.sku, price: r.price })) : [],
    });
    if (!parsed.success) {
      const fieldErrors: ProductFormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (field === "variantRows") {
          const subField = issue.path[2] as string | undefined;
          if (subField === "sku" && !fieldErrors.variantRowsSku) {
            fieldErrors.variantRowsSku = issue.message;
          } else if (!fieldErrors.variantRows) {
            fieldErrors.variantRows = issue.message;
          }
        } else if (!fieldErrors[field as keyof ProductFormErrors]) {
          fieldErrors[field as keyof ProductFormErrors] = issue.message;
        }
      }
      setErrors(fieldErrors);
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    setErrors({});

    startTransition(async () => {
      try {
        const apiVariantOptions = variantOptions
          .filter((o) => o.name.trim())
          .map((o) => ({
            name: o.name,
            displayMode: o.displayMode ?? "text",
            values: o.values.filter((v) => v.value.trim()).map((v) => ({
              value: v.value,
              hexColor: v.hexColor || null,
            })),
          }));

        const hasVariants = apiVariantOptions.length > 0 && variantRows.length > 0;

        const variantsToDelete: string[] = [];
        const orphanedIds = new Set<string>();

        if (isEdit && productId) {
          const existingVariants = await getVariants(productId);

          if (!hasVariantsSwitch) {
            for (const v of existingVariants) {
              variantsToDelete.push(v.id);
              orphanedIds.add(v.id);
            }
          } else {
            for (const variant of existingVariants) {
              const isStillValid = apiVariantOptions.length > 0 &&
                Object.entries(variant.variations).every(([optName, optValue]) => {
                  const matchOpt = apiVariantOptions.find(o => o.name === optName);
                  return matchOpt !== undefined && matchOpt.values.some(v => v.value === optValue);
                });
              if (!isStillValid) {
                variantsToDelete.push(variant.id);
                orphanedIds.add(variant.id);
              }
            }
          }
        }

        const data = {
          name,
          handle: slug || toSlug(name),
          sku: sku || undefined,
          categoryId: categoryId || undefined,
          shippingProfileId: shippingProfileId || undefined,
          description: description || undefined,
          price: Math.round(Number(price)),
          compareAtPrice: compareAtPrice ? Math.round(Number(compareAtPrice)) : undefined,
          costPrice: costPrice ? Math.round(Number(costPrice)) : undefined,
          status,
          trackInventory,
          type: isDigital ? "DIGITAL" as const : "PHYSICAL" as const,
          barcode: barcode || undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
          shippingMethod: (shippingMethod || undefined) as "carrier" | "custom" | "free" | undefined,
          shippingOfficePrice: shippingMethod === "custom" ? (Math.round(Number(shippingOfficePrice)) || 0) : undefined,
          shippingHomePrice: shippingMethod === "custom" ? (Math.round(Number(shippingHomePrice)) || 0) : undefined,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          metaKeywords: metaKeywords || undefined,
          ...(isEdit ? {} : { inventory: hasVariants ? 0 : (Number(inventory) || 0) }),
          lowStockThreshold: hasVariants ? undefined : (Number(lowStockThreshold) || 5),
          hasVariants,
          variantOptions: hasVariants ? apiVariantOptions : null,
        };

        let savedId: string;
        if (isEdit && productId) {
          await updateProduct(productId, data);
          savedId = productId;
        } else {
          const saved = await createProduct(data);
          savedId = saved.id;
        }

        if (hasVariants) {
          for (const row of variantRows) {
            if (row.existingId && orphanedIds.has(row.existingId)) continue;
            const variantData = {
              variations: row.variations,
              price: Math.round(Number(row.price) || 0),
              sku: row.sku.trim(),
              inventory: Number(row.inventory) || 0,
              lowStockThreshold: Number(row.lowStockThreshold) || 5,
              active: row.active,
              imageId: row.imageId ?? null,
            };
            if (row.existingId) {
              await updateVariant(savedId, row.existingId, variantData);
            } else {
              await createVariant(savedId, variantData);
            }
          }
        }

        for (const variantId of variantsToDelete) {
          await deleteVariant(savedId, variantId);
        }

        for (const imageId of deletedImageIds) {
          await deleteProductImage(savedId, imageId);
        }

        for (let i = 0; i < pendingImages.length; i++) {
          const img = pendingImages[i];
          await saveProductImage(savedId, {
            key: img.key,
            src: img.url,
            position: (existingImages.length - deletedImageIds.length) + i + 1,
          });
        }

        toast.success(isEdit ? t.form.success_edit : t.form.success_add);
        resetDirty();
        router.push("/products");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        const isSanitized = !msg || msg.includes("Server Components render") || msg.includes("digest");
        toast.error(isSanitized ? t.form.error_save_failed : msg);
      }
    });
  }

  const margin = calcMargin(price, costPrice);
  const hasVariants = variantRows.length > 0;
  const showImageCol = isEdit && existingImages.length > 0;

  if (initialLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-md" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-fade-in">
      <FormHeader backHref="/products" title={isEdit ? (t.form.title_edit ?? "Edit Product") : (t.form.title_add ?? "New Product")} />
      <ContextualSaveBar
        hasChanges={isDirty}
        isSaving={isPending}
        onSave={handleSave}
        onCancel={() => router.push("/products")}
        onDiscard={() => router.push("/products")}
      />

      <div className="flex items-start gap-6">
        {/* Main column (flexible) */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Title + Description */}
          <Section title={t.form.section_basic} icon={<Settings2 size={18} />}>
            <div className="space-y-5">
              <Field label={`${t.form.name_label} *`}>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); markDirty(); }}
                  placeholder={t.form.name_placeholder}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  disabled={isPending}
                  dir={dir}
                />
                {errors.name && (
                  <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-bold">
                    <AlertCircle size={11} />{errors.name}
                  </p>
                )}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={hasVariantsSwitch ? t.form.sku_label : `${t.form.sku_label} *`}>
                  <Input
                    value={sku}
                    onChange={(e) => { setSku(e.target.value); setErrors((prev) => ({ ...prev, sku: undefined })); markDirty(); }}
                    placeholder={t.form.sku_placeholder}
                    className={cn(
                      "h-11 bg-card border-border rounded-md px-4 font-mono text-[13px]",
                      errors.sku && "border-destructive/60 focus:border-destructive/60 focus:ring-destructive/20"
                    )}
                    disabled={isPending || hasVariantsSwitch}
                    dir={dir}
                  />
                  {errors.sku && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {errors.sku}
                    </p>
                  )}
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
              </div>

              {/* Description (rich text) */}
              <Field label={t.form.description_label}>
                <ProductDescriptionEditor
                  value={description}
                  onChange={(html) => { setDescription(html); markDirty(); }}
                  disabled={isPending}
                />
              </Field>
            </div>
          </Section>

          {/* Media */}
          <Section title={t.form.section_images ?? "Media"} icon={<ImageIcon size={18} />}>
            <ProductImageUploader
              existingImages={existingImages}
              pendingImages={pendingImages}
              productId={productId}
              onPendingAdd={(img) => { setPendingImages((prev) => [...prev, img]); markDirty(); }}
              onPendingRemove={(clientId) => {
                setPendingImages((prev) => prev.filter((i) => i.clientId !== clientId));
                markDirty();
              }}
              onExistingRemove={(imageId) => {
                setExistingImages((prev) => prev.filter((i) => i.id !== imageId));
                setDeletedImageIds((prev) => [...prev, imageId]);
                markDirty();
              }}
              onExistingReorder={setExistingImages}
              onPendingReorder={setPendingImages}
              disabled={isPending}
            />
          </Section>

          {/* Pricing */}
          <Section title={t.form.section_pricing} icon={<DollarSign size={18} />}>
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {hasVariantsSwitch ? t.form.base_price_hint : t.form.product_price_hint}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label={`${t.form.base_price_label} *`}>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => { setPrice(e.target.value); markDirty(); }}
                      min={0}
                      step={1}
                      disabled={isPending}
                      className="h-11 bg-card border-border rounded-md px-4 text-sm pe-16"
                    />
                    <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {common.currency.symbol}
                    </span>
                  </div>
                  {errors.price && (
                    <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-bold">
                      <AlertCircle size={11} />{errors.price}
                    </p>
                  )}
                </Field>
                <Field label={t.form.compare_at_price_label}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={compareAtPrice}
                    onChange={(e) => { setCompareAtPrice(e.target.value); markDirty(); }}
                    min={0}
                    step={1}
                    disabled={isPending}
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  />
                  {errors.compareAtPrice && (
                    <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-bold">
                      <AlertCircle size={11} />{errors.compareAtPrice}
                    </p>
                  )}
                </Field>
                <Field label={`${t.form.cost_price_label}${margin !== null ? ` — ${t.form.margin_label}: ${margin}%` : ""}`}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={costPrice}
                    onChange={(e) => { setCostPrice(e.target.value); markDirty(); }}
                    min={0}
                    step={1}
                    disabled={isPending}
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  />
                  {errors.costPrice && (
                    <p className="flex items-center gap-1 text-xs text-destructive mt-1 ms-1 font-bold">
                      <AlertCircle size={11} />{errors.costPrice}
                    </p>
                  )}
                </Field>
              </div>
            </div>
          </Section>

          {/* Options & Variants */}
          <Section title={t.form.section_options} icon={<Layers size={18} />}>
            <label className="flex items-center justify-between gap-4 cursor-pointer group">
              <div className="space-y-0.5">
                <p className="text-[13px] sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {t.form.has_variants_label}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium opacity-70">
                  {t.form.has_variants_hint}
                </p>
              </div>
              <Switch
                checked={hasVariantsSwitch}
                onCheckedChange={async (v) => {
                  if (!v && isEdit && variantRows.length > 0) {
                    const ok = await confirmDialog({
                      title: t.form.remove_variants_confirm,
                      description: t.form.remove_variants_confirm_desc,
                      variant: "destructive",
                      confirmLabel: t.form.remove_variants_confirm_label,
                    });
                    if (!ok) return;
                  }
                  setHasVariantsSwitch(v);
                  if (!v) setVariantOptions([]);
                  markDirty();
                }}
                disabled={isPending}
                className="scale-95 sm:scale-100 shrink-0"
              />
            </label>

            {hasVariantsSwitch && (
              <div className="mt-6 pt-5 border-t border-border/10 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.form.options_hint}
                </p>
                <ProductOptionsManager options={variantOptions} onChange={(v) => { setVariantOptions(v); markDirty(); }} disabled={isPending} />
              </div>
            )}
          </Section>

          {/* Variant rows table */}
          {hasVariantsSwitch && hasVariants && (
            <Section title={`${t.form.variants_label} (${variantRows.length})`} icon={<BarChart3 size={18} />}>
              <div className="space-y-5">
                {errors.variantRows && (
                  <p className="flex items-center gap-1 text-xs text-destructive font-bold">
                    <AlertCircle size={11} />{errors.variantRows}
                  </p>
                )}
                {errors.variantRowsSku && (
                  <p className="flex items-center gap-1 text-xs text-destructive font-bold">
                    <AlertCircle size={11} />{errors.variantRowsSku}
                  </p>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.form.variants_hint}
                </p>

                {/* Bulk fill toolbar */}
                <div className="flex flex-wrap items-end gap-3 rounded-md bg-muted/20 border border-border px-4 py-3">
                  <span className="text-xs font-medium text-muted-foreground self-center me-1">{t.form.bulk_fill}:</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                      placeholder={t.form.bulk_price_placeholder}
                      className="w-24 h-8 text-xs bg-background border-border rounded-md"
                      disabled={isPending}
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      disabled={isPending}
                      onClick={() => {
                        const p = Number(bulkPrice);
                        if (p > 0) { setVariantRows((prev) => prev.map((r) => ({ ...r, price: String(p) }))); markDirty(); }
                      }}
                    >
                      {t.form.bulk_price_apply}
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={bulkSkuPrefix}
                      onChange={(e) => setBulkSkuPrefix(e.target.value)}
                      placeholder={t.form.bulk_sku_placeholder}
                      className="w-28 h-8 font-mono text-[11px] bg-background border-border rounded-md"
                      disabled={isPending}
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      disabled={isPending}
                      onClick={() => {
                        const prefix = bulkSkuPrefix.trim();
                        if (prefix) {
                          setVariantRows((prev) =>
                            prev.map((r, i) => ({ ...r, sku: `${prefix}-${String(i + 1).padStart(3, "0")}` }))
                          );
                          setErrors((prev) => ({ ...prev, variantRowsSku: undefined }));
                          markDirty();
                        }
                      }}
                    >
                      {t.form.bulk_sku_auto}
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={bulkStock}
                      onChange={(e) => setBulkStock(e.target.value)}
                      placeholder={t.form.bulk_stock_placeholder}
                      className="w-20 h-8 text-xs bg-background border-border rounded-md"
                      disabled={isPending}
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      disabled={isPending}
                      onClick={() => {
                        if (bulkStock !== "") {
                          const s = Number(bulkStock);
                          if (!isNaN(s)) { setVariantRows((prev) => prev.map((r) => ({ ...r, inventory: String(s) }))); markDirty(); }
                        }
                      }}
                    >
                      {t.form.bulk_stock_apply}
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border bg-card">
                  <div className={showImageCol ? "min-w-[800px]" : "min-w-[680px]"}>
                    <table className="w-full text-sm">
                      <thead className="bg-muted/20">
                        <tr className="border-b border-border/60">
                          <th className="text-start py-3 px-4 text-xs font-semibold text-muted-foreground">{t.form.variant_label}</th>
                          <th className="text-start py-3 px-4 text-xs font-semibold text-muted-foreground">{t.form.variant_price} ({common.currency.symbol})</th>
                          <th className="text-start py-3 px-4 text-xs font-semibold text-muted-foreground">{t.form.variant_sku} *</th>
                          <th className="text-start py-3 px-4 text-xs font-semibold text-muted-foreground">{t.form.variant_stock}</th>
                          <th className="text-start py-3 px-4 text-xs font-semibold text-muted-foreground">{t.form.variant_threshold}</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">{t.form.variant_active}</th>
                          {showImageCol && (
                            <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">{t.form.variant_image}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {variantRows.map((row, i) => (
                          <tr key={row.key} className="hover:bg-muted/40">
                            <td className="py-3 px-4">
                              <div className="min-w-0">
                                <p className="font-semibold text-[13px] text-foreground">{row.key}</p>
                                {row.existingId && <span className="text-[11px] font-medium text-emerald-600">{t.form.variant_saved_badge}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                inputMode="decimal"
                                value={row.price}
                                onChange={(e) => { updateVariantRow(i, "price", e.target.value); markDirty(); }}
                                className="w-28 h-9 text-xs border-border rounded-md tabular-nums"
                                disabled={isPending}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                value={row.sku}
                                onChange={(e) => { updateVariantRow(i, "sku", e.target.value); setErrors((prev) => ({ ...prev, variantRowsSku: undefined })); markDirty(); }}
                                placeholder={t.form.sku_placeholder ?? "SKU"}
                                className={cn(
                                  "w-28 h-9 font-mono text-[11px] border-border rounded-md",
                                  errors.variantRowsSku && !row.sku.trim() && "border-destructive/60"
                                )}
                                disabled={isPending}
                                dir={dir}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={row.inventory}
                                onChange={(e) => { updateVariantRow(i, "inventory", e.target.value); markDirty(); }}
                                className="w-20 h-9 text-xs border-border rounded-md tabular-nums"
                                disabled={isPending}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={row.lowStockThreshold}
                                onChange={(e) => { updateVariantRow(i, "lowStockThreshold", e.target.value); markDirty(); }}
                                className="w-20 h-9 text-xs bg-card border-border rounded-md tabular-nums"
                                disabled={isPending}
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Switch
                                checked={row.active}
                                onCheckedChange={(v) => { updateVariantRow(i, "active", v); markDirty(); }}
                                disabled={isPending}
                                className="scale-90"
                              />
                            </td>
                            {showImageCol && (
                              <td className="py-3 px-4 text-center">
                                <Popover
                                  open={openImagePickerRow === i}
                                  onOpenChange={(open) => setOpenImagePickerRow(open ? i : null)}
                                >
                                  <PopoverTrigger
                                    type="button"
                                    disabled={isPending}
                                    className={cn(
                                      "w-10 h-10 rounded-md overflow-hidden border-2 transition-all mx-auto flex items-center justify-center",
                                      row.imageId
                                        ? "border-primary shadow-sm"
                                        : "border-dashed border-border/40 bg-muted/20 hover:border-primary/40"
                                    )}
                                  >
                                    {row.imageId ? (
                                      <img
                                        src={existingImages.find((img) => img.id === row.imageId)?.src ?? ""}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                                    )}
                                  </PopoverTrigger>
                                  <PopoverContent className="p-2 w-auto" side="left" align="center">
                                    <div className="space-y-2">
                                      <p className="text-xs font-medium text-muted-foreground px-1">{t.form.variant_image_select}</p>
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {existingImages.map((img) => (
                                          <button
                                            key={img.id}
                                            type="button"
                                            onClick={() => {
                                              updateVariantImageId(i, row.imageId === img.id ? null : img.id);
                                              setOpenImagePickerRow(null);
                                              markDirty();
                                            }}
                                            className={cn(
                                              "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                                              row.imageId === img.id
                                                ? "border-primary shadow-md scale-105"
                                                : "border-transparent opacity-70 hover:opacity-100 hover:border-primary/40"
                                            )}
                                          >
                                            <img src={img.src} alt="" className="w-full h-full object-cover" />
                                          </button>
                                        ))}
                                      </div>
                                      {row.imageId && (
                                        <button
                                          type="button"
                                          onClick={() => { updateVariantImageId(i, null); setOpenImagePickerRow(null); markDirty(); }}
                                          className="w-full text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors py-1"
                                        >
                                          {t.form.variant_image_remove}
                                        </button>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Shipping */}
          <Section
            title={t.form.section_shipping ?? "Shipping"}
            icon={<Truck size={18} />}
            action={
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-foreground">{t.form.is_digital_label ?? "Digital product"}</span>
                <Switch
                  checked={isDigital}
                  onCheckedChange={(v) => { setIsDigital(v); markDirty(); }}
                  disabled={isPending}
                  className="scale-90 sm:scale-100"
                />
              </label>
            }
          >
            {!isDigital ? (
            <div className="space-y-5">
              <Field label={t.form.weight_label_kg ?? "Weight (kg)"}>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={weightKg}
                    onChange={(e) => { setWeightKg(e.target.value); markDirty(); }}
                    min={0}
                    step={0.1}
                    placeholder={t.form.weight_placeholder_kg ?? "e.g., 0.5"}
                    className="h-11 bg-card border-border rounded-md px-4 text-sm pe-12"
                    disabled={isPending}
                    dir={dir}
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{dir === "rtl" ? "كغ" : "kg"}</span>
                </div>
              </Field>

              {shippingProfiles.length > 0 && (
                <Field label={t.form.shipping_method_label ?? "Shipping method"}>
                  <Select value={shippingMethod} onValueChange={(v) => { setShippingMethod(v ?? ""); markDirty(); }}>
                    <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm" disabled={isPending}>
                      <SelectValue placeholder={t.form.shipping_method_profile_default ?? "Use profile default"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-border bg-popover text-popover-foreground">
                      <SelectItem value="">{t.form.shipping_method_profile_default ?? "Use profile default"}</SelectItem>
                      <SelectItem value="carrier">{t.form.shipping_method_carrier ?? "Carrier-calculated rates"}</SelectItem>
                      <SelectItem value="custom">{t.form.shipping_method_custom ?? "Custom rate"}</SelectItem>
                      <SelectItem value="free">{t.form.shipping_method_free ?? "Free shipping"}</SelectItem>
                      </SelectContent>
                  </Select>
                </Field>
              )}

              {shippingMethod === "custom" && (
                <div className="space-y-4 rounded-md border border-border bg-muted/10 p-3">
                  <div className="grid grid-cols-1 gap-4">
                    <Field label={t.form.shipping_office_price_label ?? "Office price (DZD)"}>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={shippingOfficePrice}
                          onChange={(e) => { setShippingOfficePrice(e.target.value); markDirty(); }}
                          min={0}
                          placeholder="0"
                          className="h-11 bg-background border-border rounded-md px-4 text-sm pe-14"
                          disabled={isPending}
                          dir="ltr"
                        />
                        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{common.currency.symbol}</span>
                      </div>
                    </Field>
                    <Field label={t.form.shipping_home_price_label ?? "Home delivery price (DZD)"}>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={shippingHomePrice}
                          onChange={(e) => { setShippingHomePrice(e.target.value); markDirty(); }}
                          min={0}
                          placeholder="0"
                          className="h-11 bg-background border-border rounded-md px-4 text-sm pe-14"
                          disabled={isPending}
                          dir="ltr"
                        />
                        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{common.currency.symbol}</span>
                      </div>
                    </Field>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.form.shipping_fixed_hint ?? "This price applies to all wilayas for this product only."}</p>
                </div>
              )}

              {shippingMethod === "free" && (
                <p className="text-xs text-muted-foreground rounded-md border border-emerald-600/20 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5">
                  {t.form.shipping_free_hint ?? "Shipping will be free (0 DZD) for all wilayas — office and home — for this product only."}
                </p>
              )}

              {shippingProfiles.length > 0 && (
                <Field label="Shipping Profile">
                  <Select value={shippingProfileId ?? ""} onValueChange={(v) => { setShippingProfileId(v || null); markDirty(); }}>
                    <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm" disabled={isPending}>
                      <SelectValue placeholder="Default (store setting)">
                        {shippingProfileId
                          ? (shippingProfiles.find((p) => p.id === shippingProfileId)?.name ?? "Default (store setting)")
                          : "Default (store setting)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-border bg-popover text-popover-foreground">
                      <SelectItem value="">Default (store setting)</SelectItem>
                      {shippingProfiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}{p.isDefault ? " ★" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
            ) : (
            <div className="space-y-5">
              <Field label={`${t.form.digital_file_label ?? "Digital file"} *`}>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.zip,.rar,.7z"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDigitalFile(file);
                        markDirty();
                      }
                    }}
                    className="sr-only"
                    id="digital-file-upload"
                    disabled={isPending}
                  />
                  <label
                    htmlFor="digital-file-upload"
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-all",
                      digitalFile
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/20"
                    )}
                  >
                    {digitalFile ? (
                      <>
                        <File className="w-8 h-8 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{digitalFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(digitalFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground/40 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{t.form.digital_upload_hint ?? "Click to upload file"}</p>
                          <p className="text-xs text-muted-foreground">PDF, ZIP, RAR, 7Z (max 50MB)</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 ms-1">{t.form.digital_file_required_hint ?? "Required for digital products"}</p>
              </Field>
            </div>
            )}
          </Section>

          {/* Inventory */}
          {!isDigital && (
          <Section title={t.form.section_inventory ?? "Inventory"} icon={<Package size={18} />}>
            <div className="space-y-5">
              <label className="flex items-center justify-between gap-4 cursor-pointer group">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{t.form.track_stock_label}</p>
                  <p className="text-xs text-muted-foreground">{t.form.track_stock_hint ?? "Monitor inventory levels automatically"}</p>
                </div>
                <Switch
                  checked={trackInventory}
                  onCheckedChange={(v) => { setTrackInventory(v); markDirty(); }}
                  disabled={isPending}
                  className="scale-95 sm:scale-100"
                />
              </label>

              {trackInventory && !hasVariantsSwitch && !isEdit && (
                <Field label={t.form.initial_stock_label}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={inventory}
                    onChange={(e) => { setInventory(e.target.value); markDirty(); }}
                    min={0}
                    className="h-11 bg-card border-border rounded-md px-4 text-sm"
                    disabled={isPending}
                  />
                </Field>
              )}

              {trackInventory && !hasVariantsSwitch && (
                <Field label={t.form.threshold_label}>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={lowStockThreshold}
                      onChange={(e) => { setLowStockThreshold(e.target.value); markDirty(); }}
                      min={0}
                      className="h-11 bg-card border-border rounded-md px-4 text-sm font-medium"
                      disabled={isPending}
                    />
                    <span className="absolute end-4 top-1/2 -translate-y-1/2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 ms-1">{t.form.threshold_hint}</p>
                </Field>
              )}

              {isEdit && !hasVariantsSwitch && (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/10 px-4 py-3 text-[13px] text-muted-foreground">
                  <span>{t.form.stock_adjust_note}</span>
                  <Link href="/products/stock" className="text-primary hover:underline font-medium">
                    {t.form.stock_adjust_link}
                  </Link>
                  <span>.</span>
                </div>
              )}

              {/* Collapsible SKU & Barcode */}
              <div className="border border-border rounded-md">
                <button
                  type="button"
                  onClick={() => setInventoryExpanded(!inventoryExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
                >
                  <span>{t.form.section_barcode_sku ?? "Barcode & SKU"}</span>
                  {inventoryExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {inventoryExpanded && (
                  <div className="px-4 pb-4 pt-4 border-t border-border/60 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label={t.form.sku_label}>
                        <Input
                          value={sku}
                          onChange={(e) => { setSku(e.target.value); setErrors((prev) => ({ ...prev, sku: undefined })); markDirty(); }}
                          placeholder={t.form.sku_placeholder}
                    className="h-11 bg-card border-border rounded-md px-4 font-mono text-[13px]"
                    disabled={isPending || hasVariantsSwitch}
                    dir={dir}
                  />
                      </Field>
                      <Field label={t.form.barcode_label ?? "Barcode"}>
                        <div className="relative">
                          <Input
                            value={barcode}
                            onChange={(e) => { setBarcode(e.target.value); markDirty(); }}
                            placeholder={t.form.barcode_placeholder ?? "e.g., 1234567890128"}
                            className="h-11 bg-card border-border rounded-md px-4 ps-11 font-mono text-[13px]"
                            disabled={isPending}
                            dir={dir}
                          />
                          <button
                            type="button"
                            disabled={isPending}
                            title={t.form.auto_generate_barcode ?? "Generate a random barcode"}
                            onClick={() => {
                              const digits = Math.floor(1000000000000 + Math.random() * 9000000000000).toString().slice(0, 13);
                              setBarcode(digits);
                              markDirty();
                            }}
                            className="absolute start-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-40"
                          >
                            <Hash className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t.form.barcode_hint ?? "Scannable barcode identifier"}</p>
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Section>
          )}

          {/* SEO */}
          <Section title={t.form.section_seo ?? "Search engine listing preview"} icon={<Search size={18} />}>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.form.seo_preview_hint ?? "Add a title and description to see how this product will appear in search results"}
              </p>

              {/* Google preview */}
              <div className="rounded-lg border border-border bg-background p-4 space-y-1">
                <p className="text-[13px] text-blue-700 font-medium truncate">
                  {metaTitle || name || (t.form.seo_title_placeholder ?? "Product name - Store name")}
                </p>
                <p className="text-xs text-green-700 truncate">
                  /products/{slug || toSlug(name) || "..."}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {metaDescription || (t.form.seo_description_placeholder ?? "Brief description of the product for search engines")}
                </p>
              </div>

              <Field label={t.form.seo_preview_title ?? "Page title"}>
                <Input
                  value={metaTitle}
                  onChange={(e) => { setMetaTitle(e.target.value); markDirty(); }}
                  placeholder={t.form.seo_title_placeholder ?? "Product name - Store name"}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  disabled={isPending}
                  dir={dir}
                />
              </Field>

              <Field label={t.form.seo_preview_description ?? "Meta description"}>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => { setMetaDescription(e.target.value); markDirty(); }}
                  rows={3}
                  placeholder={t.form.seo_description_placeholder ?? "Brief description of the product for search engines"}
                  className="bg-card border-border rounded-md p-4 text-sm min-h-[80px] resize-none"
                  disabled={isPending}
                  dir={dir}
                />
              </Field>

              <Field label={t.form.seo_keywords_label ?? t.form.seo_keywords_placeholder ?? "Keywords"}>
                <Input
                  value={metaKeywords}
                  onChange={(e) => { setMetaKeywords(e.target.value); markDirty(); }}
                  placeholder={t.form.seo_keywords_placeholder ?? "keyword1, keyword2, keyword3"}
                  className="h-11 bg-card border-border rounded-md px-4 text-sm"
                  disabled={isPending}
                  dir={dir}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* Sidebar (fixed 320px like Shopify): Settings only */}
        <div className="w-[320px] shrink-0 space-y-6">
          {/* Status */}
          <Section title={t.form.section_settings} icon={<Settings2 size={18} />}>
            <div className="space-y-5">
              <Field label={t.form.status_label}>
                <Select value={status} onValueChange={(v) => { setStatus(v as ProductStatus); markDirty(); }}>
                  <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm" disabled={isPending}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-border bg-popover text-popover-foreground">
                    {STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>{t.status_options[s.toLowerCase() as keyof typeof t.status_options]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t.form.group_label}>
                <Select value={categoryId} onValueChange={(v) => { setCategoryId(v ?? ""); markDirty(); }}>
                  <SelectTrigger className="h-11 bg-card border-border rounded-md px-4 text-sm" disabled={isPending}>
                    <SelectValue placeholder={t.form.group_placeholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-border bg-popover text-popover-foreground">
                    <SelectItem value="">{t.form.group_placeholder}</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>
        </div>
      </div>

      {ConfirmDialog}
    </div>
  );
}
