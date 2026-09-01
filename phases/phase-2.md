# Phase 2: Product Form

**Status:** READY (Phase 0 + Phase 1 completed)
**Depends on:** Phase 0
**Blocks:** None
**Max Parallel Agents:** 1 (single file)

---

## Overview

Convert the product form page to Polaris Resource Detail Layout:
- Two-column layout (main 66% + sidebar 33%)
- ContextualSaveBar instead of floating save buttons
- PageHeader with breadcrumbs
- Digital product toggle with required file upload
- useUnsavedChanges hook for dirty state tracking

---

## File

**Primary:** `components/products/product-form-page.tsx` (1018 lines)

---

## Requirements

### 1. Layout Transformation

**Current:** Single column, `max-w-3xl mx-auto`
**Target:** Two-column grid, `max-w-5xl mx-auto`

```tsx
<div className="max-w-5xl mx-auto pb-48 md:pb-16 space-y-6 animate-fade-in">
  <PageHeader
    breadcrumbs={[
      { label: t.products ?? "Products", href: "/products" },
      { label: isEdit ? t.form.title_edit : t.form.title_add }
    ]}
  />

  <ContextualSaveBar
    hasChanges={isDirty}
    isSaving={isPending}
    onSave={handleSave}
    onDiscard={() => router.push("/products")}
  />

  <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
    {/* Main column (66%) */}
    <div className="space-y-6">
      {/* Basic Info */}
      {/* Images */}
      {/* Pricing */}
      {/* Options & Variants */}
      {/* Variant Rows Table */}
    </div>

    {/* Sidebar (33%) */}
    <div className="space-y-6">
      {/* Status */}
      {/* Category */}
      {/* Shipping Profile */}
      {/* Track Inventory */}
      {/* Digital Product */}
    </div>
  </div>
</div>
```

### 2. Sidebar Cards

Move these fields to sidebar:
- **Status:** ACTIVE / DRAFT / ARCHIVED select
- **Category:** Group select
- **Shipping Profile:** Profile select
- **Track Inventory:** Toggle switch
- **Digital Product:** New toggle + file upload (REQUIRED when ON)

### 3. Digital Product Feature

When `isDigital` toggle is ON:
- Show file upload component (accept PDF, ZIP, RAR)
- File is REQUIRED before save
- Store file reference in product data
- When OFF: hide file upload, clear digital file reference

### 4. ContextualSaveBar

Replace floating mobile bar + desktop sticky pill:
- Remove `fixed bottom-[88px] inset-x-4` mobile bar
- Remove `hidden lg:flex fixed bottom-6 end-6` desktop pill
- Add `ContextualSaveBar` at top of page
- Use `useUnsavedChanges` hook for dirty tracking

### 5. PageHeader

Replace current back button:
- Breadcrumbs: "Products > New Product" or "Products > Edit Product"
- More actions: Delete (edit mode only)

### 6. FormSection Updates

Use updated FormSection with subtitle where helpful:
```tsx
<Section title="Basic Information" subtitle="Product name, SKU, and category">
```

---

## Implementation Steps

1. Add imports for PageHeader, ContextualSaveBar, useUnsavedChanges
2. Add `isDigital`, `digitalFile` state variables
3. Add `markDirty` calls to all onChange handlers
4. Restructure JSX to two-column grid
5. Move Status/Category/Shipping/Inventory to sidebar
6. Add digital product toggle + file upload in sidebar
7. Replace floating save bars with ContextualSaveBar
8. Replace header with PageHeader + breadcrumbs
9. Add `resetDirty()` after successful save
10. Run typecheck + test

---

## Verification

- [ ] Two-column layout renders correctly
- [ ] Main column has Basic Info, Images, Pricing, Variants
- [ ] Sidebar has Status, Category, Shipping, Inventory, Digital
- [ ] ContextualSaveBar appears when form changes
- [ ] ContextualSaveBar disappears after save
- [ ] Digital toggle shows/hides file upload
- [ ] File upload is required when isDigital=true
- [ ] Breadcrumbs render correctly
- [ ] Mobile: columns stack vertically
- [ ] RTL layout works correctly
- [ ] Passes `npm run typecheck`
