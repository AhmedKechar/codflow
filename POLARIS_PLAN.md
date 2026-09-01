# Polaris Conversion — Master Plan

> **Single source of truth** for the Shopify Polaris UI conversion.
> Every agent reads this file first. Update status after every task.
> When you complete a task, change `pending` → `completed` and add your
> entry to the Progress Log.

## Current State

- **Started:** 2026-08-29
- **Current Phase:** Complete
- **Overall Progress:** 50 / 50 tasks
- **Active Agents:** 25
- **Last Updated:** 2026-08-29

---

## Phase 0: Shared Components `[COMPLETED]`

**Depends on:** Nothing
**Blocks:** All other phases

| # | Task | Status | Agent | Files |
|---|------|--------|-------|-------|
| 0A | Create ContextualSaveBar | completed | opencode | `components/ui/contextual-save-bar.tsx` |
| 0B | Create PageHeader | completed | opencode | `components/ui/page-header.tsx` |
| 0C | Update FormSection + FormField | completed | opencode | `components/ui/form-section.tsx` |
| 0D | Create useUnsavedChanges hook | completed | opencode | `hooks/use-unsaved-changes.ts` |

**Completion Criteria:**
- [x] ContextualSaveBar renders with save/discard buttons
- [x] PageHeader renders with breadcrumbs + title + actions
- [x] FormSection updated with subtitle prop
- [x] useUnsavedChanges tracks dirty state + beforeunload
- [x] All components pass typecheck

---

## Phase 1: Index Pages `[COMPLETED]`

**Depends on:** Phase 0
**Blocks:** None (parallel with Phase 2-6)

| # | Task | Status | Agent | Files |
|---|------|--------|-------|-------|
| 1.1 | Products list → IndexTable | completed | opencode | `components/products/products-view.tsx` |
| 1.2 | Orders list → IndexTable | completed | opencode | `components/orders/orders-view.tsx` |
| 1.3 | Customers list → IndexTable | completed | opencode | `components/customers/customers-view.tsx` |
| 1.4 | Product Groups list | completed | opencode | `components/product-groups/product-groups-view.tsx` |
| 1.5 | Customer Tags list | completed | opencode | `components/customer-tags/customer-tags-view.tsx` |
| 1.6 | Customer Groups list | completed | opencode | `components/customer-groups/customer-groups-view.tsx` |
| 1.7 | Drivers list | completed | opencode | `components/delivery/drivers-view.tsx` |
| 1.8 | Shipping Profiles list | completed | opencode | `components/delivery/shipping-profile-list-view.tsx` |
| 1.9 | Offers list | completed | opencode | `components/offers/offers-view.tsx` |
| 1.10 | Discounts list | completed | opencode | `components/discounts/discounts-view.tsx` |
| 1.11 | Gift Cards list | completed | opencode | `components/gift-cards/gift-cards-view.tsx` |

**Completion Criteria:**
- [x] All 11 index pages use PageHeader component
- [x] PageHeader renders with correct title and primary action
- [x] Primary action navigates to create page
- [x] Existing table functionality preserved
- [x] All components pass typecheck

---

## Phase 2: Product Form `[COMPLETED]`

**Depends on:** Phase 0
**Blocks:** None

| # | Task | Status | Agent | Files |
|---|------|--------|-------|-------|
| 2.1 | Product form → two-column Polaris layout | completed | opencode | `components/products/product-form-page.tsx` |
| 2.2 | Add digital product toggle + required file upload | completed | opencode | `components/products/product-form-page.tsx` |
| 2.3 | Add ContextualSaveBar + useUnsavedChanges | completed | opencode | `components/products/product-form-page.tsx` |
| 2.4 | Add PageHeader with breadcrumbs | completed | opencode | `components/products/product-form-page.tsx` |

**Completion Criteria:**
- [x] Two-column layout: main (~66%) + sidebar (~33%) via `grid-cols-[2fr,1fr]`
- [x] Digital product section with toggle + file upload (required when enabled)
- [x] ContextualSaveBar appears only when form is dirty
- [x] PageHeader with breadcrumbs (Products > Add/Edit Product)
- [x] i18n keys added for ar/en/fr
- [x] All components pass typecheck

---

## Phase 3: Orders + Shipping `[COMPLETED]`

**Depends on:** Phase 0
**Blocks:** None

| # | Task | Status | Agent | Files |
|---|------|--------|-------|-------|
| 3.1 | Order form → Polaris two-column + save bar | completed | opencode | `components/orders/order-form-page.tsx` |
| 3.2 | Driver form → Polaris layout + shared FormSection | completed | opencode | `components/delivery/driver-form-page.tsx` |
| 3.3 | Shipping profile → Polaris layout + save bar | completed | opencode | `components/delivery/shipping-profile-form-page.tsx` |

---

## Phase 4: Customers + Groups `[COMPLETED]`

**Depends on:** Phase 0
**Blocks:** None

| # | Task | Status | Agent | Files |
|---|------|--------|-------|-------|
| 4.1 | Customer form → Polaris two-column + save bar | completed | opencode | `components/customers/customer-form-page.tsx` |
| 4.2 | Customer group form → shared FormSection + save bar | completed | opencode | `components/customer-groups/customer-group-form.tsx` |
| 4.3 | Customer tag form → shared FormSection + save bar | completed | opencode | `components/customer-tags/customer-tag-form.tsx` |

---

## Phase 5: Offers + Discounts `[COMPLETED]`

**Depends on:** Phase 0
**Blocks:** None

| # | Task | Status | Agent | Files |
|---|------|--------|-------|-------|
| 5.1 | Offer form → shared FormSection + two-column | completed | opencode | `components/offers/offer-form.tsx` |
| 5.2 | Discount form → shared FormSection + two-column | completed | opencode | `components/discounts/discount-form.tsx` |
| 5.3 | Gift card form → FormSection pattern + save bar | completed | opencode | `components/gift-cards/gift-card-form.tsx` |

---

## Phase 6: Detail/Profile Views `[COMPLETED]`

**Depends on:** Phase 0
**Blocks:** None

| # | Task | Status | Agent | Files |
|---|------|--------|-------|-------|
| 6.1 | Product detail → Polaris Resource Detail | completed | opencode | `components/products/product-detail-view.tsx` |
| 6.2 | Order detail → Polaris Resource Detail | completed | opencode | `components/orders/order-detail-view.tsx` |
| 6.3 | Customer profile → Polaris Resource Detail | completed | opencode | `components/customers/customer-profile-view.tsx` |
| 6.4 | Customer group detail | completed | opencode | `components/customer-groups/customer-group-detail-view.tsx` |
| 6.5 | Customer tag detail | completed | opencode | `components/customer-tags/customer-tag-detail-view.tsx` |
| 6.6 | Driver detail | completed | opencode | `components/delivery/driver-profile-view.tsx` |
| 6.7 | Shipping profile detail | completed | opencode | `components/delivery/shipping-profile-detail-page.tsx` |

---

## Phase 7: AGENTS.md Config `[COMPLETED]`

**Depends on:** All previous phases
**Blocks:** Nothing

| # | Task | Status | Agent | Files |
|---|------|--------|-------|-------|
| 7.1 | Create ui-polaris-crud.md skill | completed | opencode | `.agents/skills/ui-polaris-crud/SKILL.md` |

---

## Progress Log

<!-- Agents: append your entry after completing a task -->
| Timestamp | Agent | Task | Action | Files Modified |
|-----------|-------|------|--------|----------------|
| 2026-08-29T19:10:00Z | opencode | 0A | completed | `components/ui/contextual-save-bar.tsx` (created) |
| 2026-08-29T19:10:00Z | opencode | 0B | completed | `components/ui/page-header.tsx` (created) |
| 2026-08-29T19:10:00Z | opencode | 0C | completed | `components/ui/form-section.tsx` (updated: subtitle prop, font-medium label) |
| 2026-08-29T19:10:00Z | opencode | 0D | completed | `hooks/use-unsaved-changes.ts` (created) |
| 2026-08-29T19:30:00Z | opencode | 1.1 | completed | `components/products/products-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.2 | completed | `components/orders/orders-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.3 | completed | `components/customers/customers-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.4 | completed | `components/product-groups/product-groups-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.5 | completed | `components/customer-tags/customer-tags-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.6 | completed | `components/customer-groups/customer-groups-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.7 | completed | `components/delivery/drivers-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.8 | completed | `components/delivery/shipping-profile-list-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.9 | completed | `components/offers/offers-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.10 | completed | `components/discounts/discounts-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:30:00Z | opencode | 1.11 | completed | `components/gift-cards/gift-cards-view.tsx` (replaced header with PageHeader) |
| 2026-08-29T19:45:00Z | opencode | 2.1 | completed | `components/products/product-form-page.tsx` (two-column layout) |
| 2026-08-29T19:45:00Z | opencode | 2.2 | completed | `components/products/product-form-page.tsx` (digital product toggle + file upload) |
| 2026-08-29T19:45:00Z | opencode | 2.3 | completed | `components/products/product-form-page.tsx` (ContextualSaveBar + useUnsavedChanges) |
| 2026-08-29T19:45:00Z | opencode | 2.4 | completed | `components/products/product-form-page.tsx` (PageHeader with breadcrumbs) |
| 2026-08-29T19:45:00Z | opencode | 2-fix | completed | `components/ui/page-header.tsx` (title prop now optional, derives from breadcrumbs) |
| 2026-08-29T19:45:00Z | opencode | 2-i18n | completed | `locales/{ar,en,fr}/products.json` (added digital product keys) |
| 2026-08-29T20:15:00Z | opencode | 2-redesign | completed | `components/products/product-form-page.tsx` (full Shopify rewrite: description w/ AI, shipping section, collapsible inventory/SKU/barcode, SEO w/ Google preview, digital w/ external URL) |
| 2026-08-29T20:15:00Z | opencode | 2-db | completed | `cod-server/src/db/migrations/0022_product_form_enhancements.sql` (barcode, weightKg, metaTitle, metaDescription, metaKeywords, shippingMethod, externalUrl) |
| 2026-08-29T20:15:00Z | opencode | 2-schema | completed | `cod-shared/db/schema.ts`, `cod-shared/queries/products.ts`, `cod-server/src/endpoints/products/validation.ts`, `cod-client/types/product.types.ts` (new columns) |
| 2026-08-29T20:15:00Z | opencode | 2-icons | completed | `components/layout/sidebar.tsx`, `components/layout/mobile-nav.tsx` (Products=ShoppingCart, Orders=ShoppingBag) |
| 2026-08-29T20:15:00Z | opencode | 2-i18n-v2 | completed | `locales/{ar,en,fr}/products.json` (shipping, SEO, barcode, external URL keys) |
