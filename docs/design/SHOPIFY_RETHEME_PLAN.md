# Shopify Re-theme Plan (CodFlow)

> Companion handoff for the Polaris/Dawn re-skin. Read the design specs
> (`docs/design/DESIGN.dashboard.md`, `docs/design/DESIGN.storefront.md`) and
> the acceptance checklist (`docs/design/SHOPIFY_MATCH_CHECKLIST.md`) with this
> plan. Status below is tracked per phase.

## Principals
- **LOOK ONLY.** No feature, function, copy, validation, data model, or
  permission changes. Forms, thank-you, pixels, shipping, site-builder, RTL,
  and ar/en/fr all stay intact.
- Reference = real **Polaris** (light/flat) for the dashboard; **Dawn**-clean
  for the storefront (`theme02`). The "Shopifi" file was used only as a
  template for spec structure — its dark/cream values are NOT adopted.
- Rollback: dashboard via git; storefront via a NEW `theme02` activated by
  `themeId`, leaving `theme01` intact.
- Clean up old/unused code that becomes orphaned during re-skin, without
  breaking references (verify with tsc/build).

## Deliverables (Phase 0) — DONE
- [x] `docs/design/DESIGN.dashboard.md` — Polaris dashboard spec
- [x] `docs/design/DESIGN.storefront.md` — Dawn storefront spec
- [x] `docs/design/SHOPIFY_MATCH_CHECKLIST.md` — acceptance checklist
- [ ] (planning) confirm theme02 wiring vs `themeId` + theme selector UI

## Phase 1 — Tokens + app shell (dashboard)
- `cod-client/app/globals.css`: re-map tokens to Polaris light ladder
  (background `#f6f6f7`, card `#fff`, border `#d1d5d9`, primary=ink default,
  muted `#f1f1f2`, destructive/success/warning, radius `6px`, shadows L1/L2,
  status badges muted). Keep `--primary-*` overridable by `brand.primaryColor`
  in `app/(dashboard)/layout.tsx`.
- `components/layout/sidebar.tsx`, `navbar.tsx`, `mobile-nav.tsx`: Polaris rail
  + top bar + mobile drawer.
- Cleanup: prune unused CSS utilities (glass/glow/noise) if orphaned.
- Verify: `npm run typecheck` → `npm test` → `npm run build`; visual RTL/LTR.

## Phase 2 — shadcn/ui primitives (28)
- Re-skin `components/ui/*`: button, card, input, select, label, checkbox,
  switch, textarea, dialog, sheet, dropdown-menu, popover, tabs, table, badge,
  avatar, tooltip, sonner, pagination, skeleton, separator, scroll-area,
  empty/error/loading-state, page-skeletons, stat-card, status-badge,
  data-table, use-confirm.
- One edit per primitive → system-wide effect.
- Cleanup: remove now-unused duplicate styling; close references.
- Verify: `typecheck` + `test` + spot-check major modules.

## Phase 3 — Dashboard module re-skin (parallel)
- Home/dashboard, orders (incl. abandoned), products, customers,
  customer-groups/tags, delivery (companies/drivers/shipping-profiles),
  discounts, gift-cards, messaging, ai, billing, settings, store/theme,
  store/domains, team, profile, mcp, reviews.
- Presentation only; apply Polaris patterns to real containers.
- Cleanup dead classes/components; tsc catches dangling imports.
- Verify: `build` + full checklist pass.

## Phase 4 — Storefront (Dawn) — restyle theme01 in place
- DECISION (reviewed with user 2026-08-28): there is NO runtime theme loader.
  `src/pages/*` statically import `@/theme/*` (one theme baked into the
  singular `cod-astro/theme01` Astro project), and `StoreConfig.themeId` is
  metadata only — never read at build/runtime. Creating a `theme02` folder or
  second Astro project would require new loader/deploy infra, not "wiring
  themeId". So we restyle the existing `theme01/src/theme` to Dawn in place.
- Rollback for the storefront is therefore via git (commit the re-skin so it
  can be reverted cleanly), not via a themeId switch.
- Restyle `cod-astro/theme01/src/theme/**` to `docs/design/DESIGN.storefront.md`
  (Dawn): white/off-white canvas, hairline borders, 8px buttons / 12px cards,
  muted `#6d7175` text, one ink `#202020` primary by default. Keep all
  toggles/sections (site-builder, order_form_config, thank-you gating,
  category redirect), runtime `--clr-*` brand injection, AR/EN/FR + RTL.
- Adjust Dawn-appropriate FALLBACK defaults only: `DEFAULT_CONFIG` in
  `config/store.ts` (primary `#202020`, bg `#ffffff`, text `#111111`) and the
  sanitize fallbacks in `layouts/StoreLayout.astro`. Dashboard colour picker
  still overrides at runtime.
- Never touch `src/core`.
- Verify: `npx astro check` → `build` → `test` → `validate`; AR/EN/FR/RTL.

## Verification gate (every phase)
1. Dashboard: `npm run typecheck` → `npm test` → `npm run build`.
   (If locale JSON changed, delete `cod-client/tsconfig.tsbuildinfo` first.)
2. Storefront: `npx astro check` → `npm run build` → `npm test` →
   `npm run validate`.
3. Match: complete `SHOPIFY_MATCH_CHECKLIST.md` (✓ per item) before a phase is
   "done"; human approval between phases (start with a shadow order's page).
4. Rollback: `git checkout` (dashboard); `git checkout` (storefront theme).

## File manifest (key)
- `docs/design/DESIGN.dashboard.md`, `docs/design/DESIGN.storefront.md`,
  `docs/design/SHOPIFY_MATCH_CHECKLIST.md` (this plan alongside).
- Dashboard: `cod-client/app/globals.css`; `components/layout/{sidebar,navbar,
  mobile-nav,language-switcher}.tsx`; `components/ui/*`.
- Storefront: `cod-astro/theme01/src/theme/**` (in place); `config/store.ts`,
  `styles/global.css`, `layouts/StoreLayout.astro`, `components/**`,
  `content/{ar,en,fr}.ts`.
