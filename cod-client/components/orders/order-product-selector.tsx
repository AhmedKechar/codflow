"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Package, Pencil, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox, ComboboxContent, ComboboxTrigger } from "@/components/ui/combobox";
import { Product, ProductVariant, OrderProduct } from "@/types";
import { useOrders, useCommon } from "@/lib/translations";
import { StockDeductionIndicator } from "./stock-deduction-indicator";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  selectedProducts: OrderProduct[];
  onChange: (products: OrderProduct[]) => void;
  availableProducts: Product[];
  productVariants?: Record<string, ProductVariant[]>;
}

export function OrderProductSelector({
  selectedProducts,
  onChange,
  availableProducts,
  productVariants = {},
}: Props) {
  const common = useCommon();
  const t = useOrders();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [variantSearch, setVariantSearch] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);

  const selectedProduct = availableProducts.find((p) => p.id === selectedProductId);
  const variants = selectedProductId ? (productVariants[selectedProductId] ?? selectedProduct?.variants ?? []) : [];
  const hasVariants = variants.length > 0;
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const pricePerUnit = selectedVariant?.price ?? selectedProduct?.price ?? 0;
  const currentStock = selectedVariant?.inventory ?? selectedProduct?.totalInventory ?? selectedProduct?.inventory ?? 0;

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts;
    const q = productSearch.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [availableProducts, productSearch]);

  const filteredVariants = useMemo(() => {
    if (!variantSearch.trim()) return variants;
    const q = variantSearch.toLowerCase();
    return variants.filter((v) => {
      const label = Object.entries(v.variations).map(([, val]) => val).join(" ").toLowerCase();
      return label.includes(q) || (v.sku && v.sku.toLowerCase().includes(q));
    });
  }, [variants, variantSearch]);

  function handleSelectProduct(product: Product) {
    setSelectedProductId(product.id);
    setSelectedVariantId("");
    setProductSearch("");
    setProductOpen(false);
  }

  function handleSelectVariant(variant: ProductVariant) {
    setSelectedVariantId(variant.id);
    setVariantSearch("");
    setVariantOpen(false);
  }

  function handleAddProduct() {
    if (!selectedProduct) return;

    const newProduct: OrderProduct = {
      id: editingId ?? `temp-${Date.now()}`,
      orderId: "",
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      variantId: selectedVariant?.id ?? null,
      variantLabel: selectedVariant
        ? Object.entries(selectedVariant.variations).map(([, v]) => v).join(" / ")
        : null,
      quantity,
      pricePerUnit,
      lineTotal: quantity * pricePerUnit,
      status: "fulfilled",
      returnedQuantity: 0,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      onChange(selectedProducts.map((p) => (p.id === editingId ? newProduct : p)));
    } else {
      onChange([...selectedProducts, newProduct]);
    }

    setSelectedProductId("");
    setSelectedVariantId("");
    setQuantity(1);
    setEditingId(null);
  }

  function handleEditProduct(product: OrderProduct) {
    setSelectedProductId(product.productId);
    setSelectedVariantId(product.variantId ?? "");
    setQuantity(product.quantity);
    setEditingId(product.id);
  }

  function handleCancelEdit() {
    setSelectedProductId("");
    setSelectedVariantId("");
    setQuantity(1);
    setEditingId(null);
  }

  function handleRemoveProduct(id: string) {
    onChange(selectedProducts.filter((p) => p.id !== id));
  }

  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.lineTotal, 0);

  return (
    <div className="space-y-4">
      {/* Add Product Form */}
      <div className="bg-muted rounded-xl border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Product Combobox */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-bold">
              {t.form.select_product}
            </Label>
            <Combobox open={productOpen} onOpenChange={setProductOpen}>
              <ComboboxTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none outline-none box-border shrink-0"
                    )}
                  />
                }
              >
                {selectedProduct ? (
                  <span className="truncate">{selectedProduct.name}</span>
                ) : (
                  <span className="text-muted-foreground">{t.form.search_products}</span>
                )}
                <Package size={14} className="shrink-0 text-muted-foreground" />
              </ComboboxTrigger>
              <ComboboxContent className="p-0">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={t.form.search_products}
                      className="h-9 ps-9 text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                  <div className="h-64 overflow-y-auto p-1">
                  {filteredProducts.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {t.form.no_products_found}
                    </p>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-start transition-colors",
                          product.id === selectedProductId
                            ? "bg-primary/10 text-primary font-bold"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        <Package size={14} className="shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate font-semibold">{product.name}</span>
                        {!product.hasVariants && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatPrice(product.price, common.currency.symbol)}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ComboboxContent>
            </Combobox>
          </div>

          {/* Variant Combobox */}
          {hasVariants && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-bold">
                {t.form.select_variation}
              </Label>
              <Combobox open={variantOpen} onOpenChange={setVariantOpen}>
                <ComboboxTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none outline-none box-border shrink-0"
                      )}
                    />
                  }
                >
                  {selectedVariant ? (
                    <span className="truncate">
                      {Object.entries(selectedVariant.variations).map(([, v]) => v).join(" / ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t.form.select_variation}</span>
                  )}
                  <Package size={14} className="shrink-0 text-muted-foreground" />
                </ComboboxTrigger>
               <ComboboxContent className="p-0">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={variantSearch}
                        onChange={(e) => setVariantSearch(e.target.value)}
                        placeholder={t.form.select_variation}
                        className="h-9 ps-9 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                <div className="h-64 overflow-y-auto p-1">
                    {filteredVariants.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {t.form.no_products_found}
                      </p>
                    ) : (
                      filteredVariants.map((variant) => {
                        const label = Object.entries(variant.variations).map(([, v]) => v).join(" / ");
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => handleSelectVariant(variant)}
                            className={cn(
                              "w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-start transition-colors",
                              variant.id === selectedVariantId
                                ? "bg-primary/10 text-primary font-bold"
                                : "hover:bg-muted text-foreground"
                            )}
                          >
                            <span className="flex-1 truncate font-semibold">{label}</span>
                            <span className="text-xs text-primary font-bold tabular-nums">
                              {formatPrice(variant.price, common.currency.symbol)}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ComboboxContent>
              </Combobox>
            </div>
          )}

          {/* Price preview + Quantity */}
          {selectedProduct && (!hasVariants || selectedVariant) && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-bold">
                {t.form.quantity_label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="bg-card border-border text-foreground w-24"
                />
                <span className="text-sm text-muted-foreground">
                  ×{" "}
                  <span className="font-black text-primary">
                    {formatPrice(pricePerUnit, common.currency.symbol)}
                  </span>
                  {" = "}
                  <span className="font-black text-foreground">
                    {formatPrice(quantity * pricePerUnit, common.currency.symbol)}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Quantity for no-variant products (fallback) */}
          {selectedProduct && hasVariants && !selectedVariant && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-bold">
                {t.form.quantity_label}
              </Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="bg-card border-border text-foreground"
                disabled
              />
            </div>
          )}
        </div>

        {/* Stock Indicator */}
        {selectedProduct && selectedProduct.trackInventory && (!hasVariants || selectedVariant) && (
          <StockDeductionIndicator
            productId={selectedProduct.id}
            variantId={selectedVariantId || null}
            quantity={quantity}
            currentStock={currentStock}
          />
        )}

        {/* Add/Update Button */}
        <div className="flex items-center justify-end gap-2">
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              {common.cancel ?? "Cancel"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleAddProduct}
            disabled={!selectedProduct || (hasVariants && !selectedVariantId)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black"
          >
            {editingId ? (
              <>{t.form.update_product}</>
            ) : (
              <><Plus size={14} className="ms-1" />{t.form.add_product}</>
            )}
          </Button>
        </div>
      </div>

      {/* Selected Products List */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-xl border border-border p-3 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-bold text-foreground">{product.productName}</p>
                {product.variantLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">{product.variantLabel}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-muted-foreground font-semibold">
                    {t.form.quantity_label}: <span className="font-black text-foreground">{product.quantity}</span>
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    {formatPrice(product.pricePerUnit, common.currency.symbol)} × {product.quantity}
                  </span>
                  <span className="text-muted-foreground font-semibold">
                    {t.form.line_total}:{" "}
                    <span className="font-black text-primary">
                      {formatPrice(product.lineTotal, common.currency.symbol)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                  disabled={editingId === product.id}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveProduct(product.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}

          {/* Total Price */}
          <div className="bg-primary/10 rounded-xl border border-primary/20 p-3 flex items-center justify-between">
            <span className="text-sm font-black text-foreground">{t.form.order_total}</span>
            <span className="text-lg font-black text-primary">
              {formatPrice(totalPrice, common.currency.symbol)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
