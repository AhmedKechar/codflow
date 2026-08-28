# Site Builder Tabs Plan — Products, Product page, Order form, Thank-you, Pages

## Status: ✅ COMPLETE

## Quick Reference

| Phase | Feature | Agent | Dependencies | Status |
|-------|---------|-------|--------------|--------|
| 0 | Pre-flight decisions + plan file | — | None | ✅ |
| A | Shared foundation (config + builder UI kit + state hook) | A | None | ✅ |
| B | Products tab editor + storefront wiring | B | A | ✅ |
| C | Product page tab editor + storefront wiring | C | A | ✅ |
| D | Order form tab (consolidate Appearance UI) | D | A | ✅ |
| E | Thank-you tab editor + storefront wiring | E | A | ✅ |
| F | Pages tab editor (built-in visibility) + storefront wiring | F | A | ✅ |
| G | i18n (ar/en/fr), tests, typecheck, storefront build gate | G | All | ✅ |

## Phase 0 — Pre-flight decisions (CONFIRMED)

1. **Order form = its own column.** The existing `order_form_config` top-level
   store column (edited today in the Appearance tab's "Order Form
   Customization") stays the single source of truth. The new dedicated
   "Order form" tab **consolidates** that UI out of the Appearance tab and into
   its own editor — it saves via `updateThemeColors`, NOT siteJson. No
   duplication.
2. **Pages tab = built-in page visibility** toggles (show/hide products page,
   category pages, announcement bar). Custom-pages CRUD is deferred.
3. **Shared editor architecture**: extract the UI primitives
   (`PanelCard`/`ToggleRow`/`Stepper`/input) from `site-builder.tsx` into a
   shared `builder-ui` module; centralize `SiteBuilderConfig` state in a
   `useSiteBuilder` hook + `SiteBuilderSaveBar`; one thin editor component per
   tab (Products/ProductPage/ThankYou/Pages) plus the OrderForm editor (own
   state, no siteJson).
4. **Never modify `src/core/`** (storefront engine). Theme edits only under
   `cod-astro/theme01/src/theme/`. Keep AR/FR/EN + RTL. Empty/unset siteJson =>
   current storefront unchanged (backward compatible).

## Phase A — Shared foundation

### A1. `cod-shared/site-builder.ts` — extend config (Agent A)

Add these sub-objects to `SiteBuilderConfig` (defaults + mergeSiteBuilder):

- `products: ProductsConfig`
  - `desktopCols: number` (default 4), `mobileCols: number` (default 2)
  - `showCategoryFilter: boolean` (default true)
  - `showSort: boolean` (default false)
  - `pageSize: number` (default 12)
- `productPage: ProductPageConfig`
  - `showGallery: boolean` (default true)
  - `showInfo: boolean` (default true)
  - `showOrderForm: boolean` (default true)
  - `showReviews: boolean` (default true)
  - `showShipping: boolean` (default true)
  - `showTrustSeals: boolean` (default true)
- `thankYou: ThankYouConfig`
  - `showOrderNumber: boolean` (default true)
  - `showTotal: boolean` (default true)
  - `showSteps: boolean` (default true)
  - `showBackToStore: boolean` (default true)
- `pages: PagesConfig`
  - `showProductsPage: boolean` (default true)
  - `showCategoryPages: boolean` (default true)
  - `showAnnouncementBar: boolean` (default true)

`mergeSiteBuilder` deep-merges each new key over defaults (backward
compatible); no throwing on malformed input.

### A2. Client shared UI kit — `components/themes/builder-ui.tsx` (Agent A)

Extract and re-export the primitives currently defined inline in
`site-builder.tsx`:
- `PanelCard`, `ToggleRow`, `Stepper`, `TextInput` (new generic input), and the
  `inputCls` constant.
- `SiteBuilderSaveBar` — the save/footer bar (dirty state + async save + toasts)
  so every tab shares identical save UX.

Refactor `SiteBuilderEditor` (Homepage) to consume these (deletes its private
copies). Behaviour unchanged.

### A3. Central site-builder state — `components/themes/site-builder-state.ts` (Agent A)

- `useSiteBuilder(siteJson)` hook: initializes via
  `mergeSiteBuilder(JSON.parse(siteJson))` (try/catch => defaults), exposes
  `{ site, update, dirty, save, saving }`.
- `save` calls `updateSiteBuilder(site)`; on success clears dirty + returns
  true; on error toasts and returns false (caller decides whether to re-fetch).
- `HomepageEditor` (refactor of existing `SiteBuilderEditor`) and the new
  Products/ProductPage/ThankYou/Pages editors all use it.

**Done (A):** `npm run typecheck` in cod-client passes; Homepage builder still
works; builder-ui exports resolve.

## Phase B — Products tab (Agent B)

- `components/themes/editors/products-editor.tsx` (client)
  - Uses `useSiteBuilder`; controls `site.products` (cols steppers, filter/sort
    toggles, page size) + `site.pages.showProductsPage`.
  - Own `PanelCard`/`ToggleRow`/`Stepper` + `SiteBuilderSaveBar`.
- `theme-page-content.tsx`: replace `products` placeholder with the editor.
- Storefront (`cod-astro/theme01`):
  - `src/theme/config/store.ts` already exposes `siteBuilder` via
    `getStoreContext()`.
  - `src/pages/products/index.astro`: read `siteBuilder`, pass
    `siteBuilder.products` into `ProductsListContent`, and `StoreLayout` gets
    `siteBuilder` (page-level visibility can redirect/noindex if hidden later).
  - `src/theme/components/products/ProductsListContent.astro`: read
    `siteBuilder.products` (cols, category filter, sort, page size).

**Done (B):** products listing reflects dashboard toggle/grid values; storefront
ASTRO build passes.

## Phase C — Product page tab (Agent C)

- `components/themes/editors/product-page-editor.tsx` (client)
  - Controls `site.productPage` visibility toggles.
- `theme-page-content.tsx`: replace `product-page` placeholder.
- Storefront:
  - `src/pages/products/[slug].astro`: pass `siteBuilder.productPage` to
    `ProductDetailContent` + `siteBuilder` to StoreLayout.
  - `src/theme/components/product/ProductDetailContent.astro`: conditionally
    render ProductGallery / ProductInfo / OrderForm / Reviews / Shipping /
    TrustSeals based on config (defaults true = current layout).

**Done (C):** product page hides/shows sections from dashboard; build passes.

## Phase D — Order form tab (Agent D)

- `components/themes/editors/order-form-editor.tsx` (client)
  - Manage `OrderFormConfig` locally (same defaults as Appearance today), save
    via `updateThemeColors({ orderFormConfig })`.
  - Field-visibility checkboxes + submit text + summary display.
- `theme-page-content.tsx`: replace `order-form` placeholder.
- `theme-selector.tsx`: REMOVE the Order Form Customization panel (consolidated);
  keep trust seals + colors. Remove `ClipboardList` import + orderForm state.
- Storefront: `ProductDetailContent.astro` currently calls `<OrderForm>` without
  `orderFormConfig`; wire `config.orderFormConfig` through so field visibility
  + submit text + summary actually apply (CustomerFields/OrderSummary already
  respect it).

**Done (D):** Appearance no longer duplicates order form; Order form tab edits
`order_form_config`; product page honours it; build passes.

## Phase E — Thank-you tab (Agent E)

- `components/themes/editors/thank-you-editor.tsx` (client)
  - Controls `site.thankYou` toggles.
- `theme-page-content.tsx`: replace `thank-you` placeholder.
- Storefront: `src/pages/thank-you.astro` read `siteBuilder` and conditionally
  render order-number / total / steps / back-to-store blocks.

**Done (E):** thank-you page reflects dashboard; build passes.

## Phase F — Pages tab (Agent F)

- `components/themes/editors/pages-editor.tsx` (client)
  - Controls `site.pages` (products page, category pages, announcement bar).
- `theme-page-content.tsx`: replace `pages` placeholder.
- Storefront: `StoreLayout.astro` announcement bar gated by
  `siteBuilder.pages.showAnnouncementBar`; products/category gating in
  `src/pages/products/index.astro` + category page routing.

**Done (F):** pages visibility works; build passes.

## Phase G — Integration + i18n (Agent G)

- Extend `cod-client/locales/{ar,en,fr}/themes.json` with keys for every new
  tab/label/toast (NO hardcoded user-facing strings):
  - products_* (cols/filter/sort/page size), productpage_*, thankyou_*,
    pages_*, orderform_*.
- Note: `theme-selector.tsx` Trust Seals + Order Form panels currently use
  **hardcoded Arabic strings** (legacy) — left as-is (out of scope) unless a
  quick win is safe.
- Verify:
  - `cd cod-client && npm run typecheck`
  - `cd cod-client && npm test` (currently 141/141)
  - `cd cod-client && npm run build` (Next Turbopack; siteJson dynamic route)
  - `cd cod-astro/theme01 && npm run build` (green gate)
  - Manual: empty-siteJson store renders current layout unchanged.

## Traps / constraints for any session

- `cod-client/actions/themes.ts` is `"use server"` => ONLY async exports.
  `mergeSiteBuilder`/`getDefaultSiteBuilder` are imported from cod-shared (plain
  module), never defined in an action file.
- Use `cod-shared/*` path alias in client components (proven by
  `preset-picker.tsx`); `cod-shared/site-builder` is the single source of truth.
- `site_json` column stores the JSON string; `updateSiteBuilder` PATCHes
  `/api/stores/me { siteJson }` + revalidates.
- `order_form_config` is a SEPARATE top-level column edited via
  `updateThemeColors`, not siteJson.
- Storefront `getStoreContext()` returns `siteBuilder` already merged over
  defaults; pass it to `StoreLayout` and the content components.
- `CountdownTimer.astro` has pre-existing typecheck warnings (unrelated); ASTRO
  BUILD is the green gate, not `astro check`.

## Verification (this run) — all green

- `cd cod-client && npm run typecheck` — pass (clear stale
  `cod-client/tsconfig.tsbuildinfo` before trusting edits to locale keys)
- `cd cod-client && npm test` — 141 passed (9 files)
- `cd cod-client && npm run build` — Next 16.3.1 Turbopack pass; `/store/theme`
  is a dynamic (ƒ) route
- `cd cod-astro/theme01 && npm run build` — astro build pass
- Backward compatibility: empty/unset `siteJson` merges over defaults, so the
  current storefront layout is unchanged.

## Files created/changed

- `cod-shared/site-builder.ts` — added `products`, `productPage`, `thankYou`,
  `pages` config + defaults + `mergeSiteBuilder` arms
- `cod-client/components/themes/builder-ui.tsx` — shared UI kit
  (`PanelCard`/`ToggleRow`/`Stepper`/`TextInput`/`SiteBuilderSaveBar`)
- `cod-client/components/themes/site-builder-state.ts` — `useSiteBuilder` hook
- `cod-client/components/themes/site-builder.tsx` — refactored to shared kit+hook
- `cod-client/components/themes/editors/{products,product-page,order-form,thank-you,pages}-editor.tsx` — new tab editors
- `cod-client/app/(dashboard)/store/theme/theme-page-content.tsx` — real editors wired into tabs
- `cod-client/components/themes/theme-selector.tsx` — removed duplicated Order
  Form Customization (consolidated into the Order form tab)
- `cod-client/locales/{ar,en,fr}/themes.json` — added ~55 keys per locale
- `cod-astro/theme01/...` — `products/index.astro`, `products/[slug].astro`,
  `category/[slug].astro`, `thank-you.astro`,
  `components/products/ProductsListContent.astro`,
  `components/product/ProductDetailContent.astro`, `layouts/StoreLayout.astro`
