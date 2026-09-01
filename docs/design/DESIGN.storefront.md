---
version: 1.0
name: codflow-dawn-storefront
description: >
  Storefront (theme02) design language for CodFlow, modelled on Shopify's Dawn
  theme: clean white, product-first commerce. Light polarity, generous white
  space, one clear type system, and a single primary colour controlled by the
  merchant's store customization (kept functional). Swappable theme layer
  under cod-astro; engine (src/core) untouched.
---

<!--
  READ THIS FIRST.
  A LOOK-ONLY spec for the NEW storefront theme (theme02). It changes only
  presentation: layout, typography, spacing, tokens, components, and the
  default values behind the merchant's customization. It MUST keep the
  merchant-customization feature working (colour/font/radius/shadow stay
  editable from the dashboard and are injected at runtime by StoreLayout as
  sanitized CSS custom properties). engine logic in src/core is never touched.
  AR/FR/EN + RTL always respected; no hardcoded user-facing strings.
-->

# Dawn storefront Design System (theme02)

## Visual Theme & Atmosphere

A quiet, editorial, product-first storefront inspired by Shopify's Dawn theme:
white/off-white canvas, a clear and restrained type hierarchy, large product
imagery, generous padding, and exactly one accent colour (the store's brand).
It reads as "a clean premium shop", not as a decorated template.

- Light polarity throughout; white surfaces with very few shadows.
- Product photography is the hero (large, uncluttered frames).
- One primary accent used for a single class of actions (add-to-cart,
  primary CTA) and small brand moments. Accent comes from the merchant config
  (`--clr-primary`), sanitized at runtime.
- Announcement bar, badges, section headers stay minimal and flat.

## Color Palette & Roles

Surfaces (light):
| Role | Token | Notes |
|---|---|---|
| Page background | `--clr-bg` (default `#ffffff`) | Runtime config |
| Surface / card | `--clr-surface` `#ffffff` | Product cards etc. |
| Surface alt | `#f7f7f7` | Section bands, footer |
| Ink (text) | `--clr-text` default `#111111` | Primary text |
| Ink muted | `--clr-text-2` default `#6d7175` | Secondary text |
| Border | `#e5e5e5` | hairlines |

Accent / interactive:
| Role | Token |
|---|---|
| Primary (buttons, links, announcement) | `--clr-primary` (merchant config, sanitized; default `#202020` ink) |
| Primary-foreground | white (contrast-gated by existing validator) |

Semantic: success `#0a7a4b`, error `#bf0711`, warning kept amber-ish but muted.

- Default ratio: near-black primary (`#202020`) so the theme looks like Dawn
  out of the box; the dashboard colour picker overrides it.

## Typography
- Body + headings: ONE family to feel like Dawn. Arabic default **Cairo**;
  Latin **Plus Jakarta Sans / Inter** across all weights (already wired).
- Accent/display moments reuse the same family at larger weights — Dawn does
  not need a second display face.
- Scale (px): 12 / 13 / 14 / 16 / 18 / 20 / 24 / 30 / 34 / 40.
- Weights: 400 body, 500/600 subheads, 600–700 headings; bold sparingly.
- Line-height 1.5 body; 1.15 headings; RTL legible via Cairo.
- Letter-spacing: normal; eyebrow labels `0.05em` uppercase where used.

## Spacing & Layout
- Base 4px; generous section rhythm: `space-12`(48)–`space-16`(64) between
  sections; `space-6`–`space-8` inside cards.
- Page gutter: `px-4 md:px-8`; content max-width ~1200–1280px centered.
- Grid: product list `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`, gap
  `space-4 md:space-6`; category cards `grid-cols-2 md:grid-cols-3`.
- Hero: full-width with large image, headline + one primary CTA, white space
  around, no busy gradients by default.

## Radius
| Token | Value |
|---|---|
| card | 12px (soft) |
| input/button | 8px (not pill) |
| image frame | 12px |
> Matches Dawn's mild radii. The dashboard radius setting may adjust.

## Elevation
- Very low: default `none` (hairline border) on cards; hover `0 2px 12px
  rgba(0,0,0,0.08)`. Image hover: subtle scale (1.02) on the picture.
- Header sticky with `1px` bottom hairline; no glass by default.

## Components

### Announcement bar
- Full width, `--clr-primary` bg, white 12–13px text, centered, small
  spacing; hidden by site-builder toggle (already wired).

### Header
- Sticky: logo left/center, nav inline links (ink, 14px), actions right
  (search, account, cart with count badge). Cart count = small pill.
- Below 1024px: hamburger → slide-in drawer (keeps existing MobileNav),
  cart stays visible.
- Bottom hairline; transparent-over-hero optional, otherwise white.

### Product card
- White card, image frame `12px`, square/4:5 image with hover zoom.
- Body: title 14–15px/500 (2-line clamp), price 14px/600 (with compare-at
  strikethrough), optional sale badge (small pill, primary or ink).
- "Add to cart" secondary-on-image or quick button on hover (desktop);
  full-width button on mobile.

### Product detail
- Two-column (image gallery | info) on desktop; stacked on mobile.
- **Gallery**: large main image + thumbnail strip; zoom on hover; badges.
- **Info**: title (24px/600), price (20px/600 + compare), short description,
  variant selector + quantity, primary add-to-cart (full-width, solid),
  trust indicators row, accordion sections (details, shipping, reviews).
- Order flow surfaced via the platform's OrderForm (below). Section visibility
  driven by existing site-builder toggles (unchanged logic).

### Order form (COD checkout)
- Clean single-column card; numbered steps header (existing stepper) minimal.
- Fields: 14px inputs, `1px` border `#d1d5d9`, 8px radius, inline error text
  (13px red); labels 13px/500. Fields map to the existing `order_form_config`
  toggles (showName/Phone/…, submitButtonText, summaryDisplay) — NOT changed.
- Order summary: plain card listing line items, totals, shipping target;
  reflects site-builder thank-you + summary settings.
- Submit button: primary solid full-width `h-12`.

### Thank-you page
- Centered confirmation: success icon, order number (if enabled), total
  (if enabled), order steps (if enabled), back-to-store button (if enabled).
  Mirrors existing gating — presentation only.

### Footer
- `#f7f7f7` or white bg with `1px` top hairline; columns of quiet links,
  brand blurb, payment/delivery note, social icons; bottom legal row 12px.

### Store pages (products list)
- Breadcrumb, H1 (24px/600), filter/sort controls (if enabled) as flat
  buttons/selects; grid of product cards; pagination simple.

## Interaction & Motion
- Durations 150–250ms; image hover scale; header reveal optional.
- Respect `prefers-reduced-motion`.
- No neon, no confetti, no auto-playing parallax.

## Responsive
- Mobile-first; `sm=640 md=768 lg=1024 xl=1280`.
- <768: drawer nav, stacked detail, grid 2-col, order form single column.
- Touch targets ≥40px.

## RTL & Multi-language
- Whole theme mirrored via `dir="rtl"` + logical CSS; Cairo handles Arabic.
- All copy from `theme/content/{ar,en,fr}.ts` (exists) — never hardcoded.
- Currency alignment respected across locales.

## Agent Prompt Guide
- Build/alter this spec's components under the NEW `theme02` folder,
  duplicating `theme01/src/theme` as a starting skeleton, then restyle.
  NEVER touch `src/core`; leave `theme01` intact as a safety net.
- Map tokens through existing `@theme` + `--clr-*` runtime vars; keep
  `StoreLayout` sanitization + brand injection.
- Keep every feature/section toggle (site-builder, order_form_config,
  thank-you gating, category redirect) working — presentation only.
- Verify with `npx astro check`, `npm run build`, `npm test`,
  `npm run validate`; test AR/EN/FR + RTL in `npm run dev`.
- No hardcoded user-facing strings; edit `theme/content` packs if a key is
  missing (add to all three), then run `npm run validate`.
