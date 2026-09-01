# Shopify Match Checklist (CodFlow)

> Acceptance checklist for the Polaris/Dawn re-skin. Complete ✓ per item before
> a phase is done. Two columns per surface: **Dashboard** (client) and
> **Storefront** (theme02). Sources of truth: `DESIGN.dashboard.md`,
> `DESIGN.storefront.md`.

## Global
- [ ] Light polarity everywhere; no neon; no glassmorphism; no violet accent
      except merchant brand primary (dashboard) / store primary (storefront).
- [ ] All functionality intact (forms, thank-you, pixels, shipping,
      site-builder, discounts, messaging, billing, RTL, ar/en/fr).
- [ ] No new production dependencies; no hardcoded user-facing strings.
- [ ] Cleanup: no orphaned unused components/classes/CSS (build passes).

## Colour / tokens
- [ ] `background` = `#f6f6f7`, `card` = `#fff`, `border` = `#d1d5d9`,
      `muted` = `#f1f1f2`, `muted-foreground` = `#616161` (dashboard).
- [ ] `destructive` = `#d82c0d`, `success` = `#007f5f`, `warning` = `#b98900`
      (and status badges use muted pastel chips, not neon).
- [ ] Merchant/store brand primary still functional and contrast-gated.
- [ ] Storefront surfaces/ink/border per Dawn spec; accent from `--clr-primary`.

## Typography
- [ ] Dashboard scale (12/13/14/16/20px, weights 400/600/700) matches spec;
      Latin = system stack, Arabic = Cairo; tabular-nums for numbers.
- [ ] Storefront single family (Cairo / Plus Jakarta), scale 12–40px per spec.
- [ ] No `ss03`, no custom display face, no ALL-CAPS except eyebrows.

## Spacing / layout / radius
- [ ] 4px base scale respected; container width, card padding, row heights.
- [ ] Radius: dashboard `sm=4 md=6 lg=8 xl=12`; storefront card/input 8–12px.
- [ ] Two-column edit layouts where specified; stacking below md.

## Elevation
- [ ] Dashboard L1 hairline cards; L2 hover/popover; modal L3; no glow.
- [ ] Storefront near-zero shadow on cards; subtle hover lift.

## Components
- [ ] Buttons: primary=ink (brand override ok), secondary bordered, ghost,
      destructive; geometry per spec; disabled state per spec (dashboard).
- [ ] Storefront: solid primary CTA (add-to-cart), secondary outline, pill
      badge; submit h-12.
- [ ] Form fields: `1px #8c9196` border, 6px radius, focus ring, inline error,
      help text (dashboard); storefront `#d1d5d9` + 8px.
- [ ] Cards, tables (header/row hover/hairlines/pagination), badges/chips.
- [ ] Dialog/sheet/popover/dropdown/tabs per spec (structure + a11y retained).

## Navigation / shell
- [ ] Sidebar: left (right in RTL) rail, groups, active state ink/hairline,
      collapse to icons, mobile drawer; counts/badges.
- [ ] Top bar: white + bottom hairline, store/search left, actions right,
      32px avatar with initials.
- [ ] Storefront header: logo/nav/actions + cart badge; hamburger <1024;
      announcement bar wired; footer columns + legal row.

## UX / feedback
- [ ] Toast success/error copy unchanged; container restyled flat white.
- [ ] Empty/loading/error/stat-card states per spec (icon+title+body+CTA).
- [ ] Focus visible, keyboard nav, reduced-motion respected.

## Storefront specifics
- [ ] Product list: 2/3/4-col responsive, card hover zoom, price/compare-at,
      sale badge, add-to-cart.
- [ ] Product detail: gallery+thumbs, info, variant+quantity, section toggles
      (site-builder), trust indicators.
- [ ] Order form: numbered steps, fields per order_form_config, summary card,
      submit h-12.
- [ ] Thank-you: order number/total/steps/back-to-store gating mirror.
- [ ] theme02 activated via `themeId`; theme01 intact and switchable back.

## RTL / i18n
- [ ] Sidebar/drawer/nav flips in `[dir=rtl]`; logical spacing.
- [ ] ar/en/fr all render; no layout overlap; currency alignment.
- [ ] Storefront mirrored and Cairo-rendered for ar.

## Verification
- [ ] Dashboard: `npm run typecheck` && `npm test` && `npm run build`.
- [ ] Storefront: `npx astro check` && `npm run build` && `npm test` &&
      `npm run validate`.
- [ ] Human visual pass on a shadow page(s) per phase.
