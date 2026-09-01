---
version: 1.0
name: codflow-polaris-dashboard
description: >
  The merchant dashboard design language, grounded on Shopify's Polaris design
  system (real values from polaris.shopify.com). Light, flat, neutral-grey
  surfaces with dark ink text. No neon, no glassmorphism, no violet accents
  (except where the merchant brand colour is applied via the preserve
  customization feature). This spec is the single source of truth for the
  cod-worker dashboard re-skin. The user-facing language stays Arabic/English/
  French via the existing locale packs; this document defines LOOK only.
---

<!--
  READ THIS FIRST.
  This is a LOOK-ONLY spec. It does not change any feature, function, copy,
  validation, data model, or permission. It re-skins the merchant dashboard
  to match Shopify Polaris. All colour/typography/spacing/component decisions
  below are authoritative for the cod-shared Tokens + shadcn/ui primitives +
  layout shell. Prefer the existing components (shadcn/ui) over new ones;
  do not add production dependencies; respect RTL + AR/EN/FR.
-->

# Polaris Dashboard Design System

## Visual Theme & Atmosphere

A calm, neutral, high-density administrative workspace. Light grey app chrome
(`#f6f6f7`) with white content cards elevated above it, separated by 1px
hairlines rather than heavy shadows. Flat, reduced elevation (Polaris
elevation levels 1–2 only). Text is near-black ink on white; secondary text is
mid-grey. Nothing glows. The product feels like "the admin panel of a serious
commerce platform," never like a marketing site.

- **Canvas polarity**: ONE light track. No dark marketing hero surfaces.
- **Density**: information-dense (accounting for Arabic line height + RTL).
- **Emphasis**: communicate importance with hierarchy/weight, not colour.
- **Merchant brand**: the merchant's `--primary` (from `brand.primaryColor`)
  is the ONLY saturated accent, applied sparingly to primary actions and the
  storefront link. Default is Polaris' neutral ink.

## Color Palette & Roles

### Surfaces & Text (neutral ladder)
| Role | Token (light) | Notes |
|---|---|---|
| App background | `#f6f6f7` | Main canvas behind cards |
| Surface (card) | `#ffffff` | Cards, dialogs, popovers |
| Surface subdue | `#fafafa` | Zebra rows, subdue panels |
| Surface neutral hover | `#f1f1f2` | Card hover, list-item hover |
| Surface emphasized | `#eceaea` | Pressed menu rows, active nav |
| Ink (default text) | `#202223` | Primary text |
| Ink secondary | `#616161` | Secondary text |
| Ink tertiary | `#5c5f62` | Tertiary/help text |
| Text on interactive | `#ffffff` | Text on filled buttons |
| Border | `#d1d5d9` | Card/list separators |
| Border subdue | `#e1e3e5` | Subtle separators |
| Input border | `#8c9196` | Form field borders |

### Interactive / Primary (merchant brand override)
| Role | Default (neutral) | When overridden |
|---|---|---|
| Button primary bg | `#202223` (ink) | Use `var(--primary)` ONLY when brand colour is set and has ≥3:1 contrast with white text |
| Button primary hover | `#000000` (lighten/darken ink ~14%) | brand-computed darker |
| Focus ring | `rgba(48,138,255,0.65)` | Polaris' blue focus ring; neutral everywhere |

### Semantic / Status (muted, non-neon)
| Role | Light |
|---|---|
| Success | `#007f5f` (text) / `#e3f1df` (bg) |
| Warning | `#b98900` (text) / `#ffd79d` (bg) or `#fff4ce` |
| Critical (error) | `#d82c0d` (text) / `#fbeae5` (bg) |
| Info | mapped to ink/neutral, not blue |
| Critical-strong focus | `#d72c0d` |

> Status badges should read as neutral/pastel chips, NEVER neon. Existing
> `--status-*` oklch values are re-mapped to the muted ladder above.

### Icons
- Source: `lucide-react` (already in use).
- Stroke: `1.5px`–`2px`; render at 16px in bars/menus, 20px in page headers.
- Colour: `currentColor` (ink / secondary); on the active nav row use ink.
- Never use custom-brand coloured icons inside tables except the state dot.

## Typography
Fonts: **Latin = system Sindical (Inter-like stack)**: `"Inter", -apple-system,
BlinkMacSystemFont, "San Francisco", "Segoe UI", Roboto, "Helvetica Neue",
Arial, sans-serif`; **Arabic = Cairo** (already loaded) as the active font.

| Role | Size | Weight | Line-height | Letter-spacing | Notes |
|---|---|---|---|---|---|
| Page title | 20px | 700 | 1.3 | -0.2px | Single page header |
| Section title | 16px | 600 | 1.3 | 0 | Card headers |
| Body / default | 14px | 400 | 1.6 | 0 | Default UI text |
| Body strong | 14px | 600 | 1.6 | 0 | Emphasized, labels |
| Subheading / table header | 13px | 600 | 1.6 | 0.2px (en) | Uppercase optional |
| Secondary / help | 13px | 400 | 1.6 | 0 | `ink-secondary` |
| Caption / metadata | 12px | 400 | 1.5 | 0 | Small notes, dates |
| Button label | 14px | 600 | 1 | 0 | Both button shapes |

- Numbers/tabular data: `font-variant-numeric: tabular-nums` where OS allows.
- Headings use sentence case (not ALL CAPS) except eyebrow labels.
- No `ss03`; no custom display face. Clean, legible, compact.

## Spacing & Layout
Base unit 4px (Polaris `--p-space-*` scaled 1:1). Full scale for padding/margins/gaps:
`0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 64`.

| Token | `px` |
|---|---|
| space-0.5 | 2 |
| space-1 | 4 |
| space-2 | 8 |
| space-3 | 12 |
| space-4 | 16 |
| space-5 | 20 |
| space-6 | 24 |
| space-8 | 32 |
| space-10 | 40 |
| space-12 | 48 |
| space-16 | 64 |

- **Page frame**: max-width container currently `max-w-7xl px-4 sm:px-6 py-6`.
  Keep; align vertical rhythm to 16/24/32.
- **Card internal padding**: `space-5` (20px) default, `space-6` for large forms.
- **Gap between stacked cards**: `space-4` (16px).
- **Row height (lists/tables)**: min 40–44px; dense mode 36px.
- **Two-column layouts** for edit pages: `grid-cols-1 lg:grid-cols-[2fr,1fr]` gap `space-4`.

## Radius
Polaris uses small radii. `--radius` maps to:
| Token | Value |
|---|---|
| sm | 4px |
| md (default) | 6px |
| lg | 8px |
| xl | 12px |
| full (pills) | 9999px |

Buttons: primary `md` (6px) — NOT full-pill; small controls `sm`; cards `lg`(8px)
or `md`. No 12px+ on data tables (0 on table cells).

## Elevation & Depth
Polaris elevation is minimal:
- **Level 1 (default card)**: `0 0 0 1px var(--border)` hairline only.
- **Level 2 (hover / popover)**: `0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px var(--border)`.
- **Modal/sheet**: `0 20px 30px rgba(0,0,0,0.18), 0 0 0 1px var(--border)`.
- No glow, no large diffuse shadows, no glass blur on surfaces.

## Components

### Page header
Single row: page title (20px/700) left; primary actions right; optional
subdued breadcrumb above the title; a border-bottom hairline dividing header
from content. Actions use `secondary` + one `primary`.

### Buttons
- **Primary**: `bg ink #202223`, white text, 6px radius, `h-8 px-4`, weight 600.
  Hover darken; focus ring blue. When merchant brand `--primary` is set and
  passes contrast, use it; otherwise ink.
- **Secondary**: white bg, `1px` `#8c9196` border, ink text, same geometry.
  Hover: `#fafafa`.
- **Plain / ghost**: transparent, ink text, hover `#f1f1f2` bg, no border.
- **Destructive**: `bg #d82c0d`, white text; link-danger variant = red text.
- **Sizes**: `sm` h-8 (32px), `default` h-9 (36px), `lg` h-12 (48px), icon-only 32×32.
- **Disabled**: `#0000001f` text on `#e4e5e7` bg, no shadow.

### Form fields (TextInput / Select / TextArea)
- White bg, `1px` `#8c9196` border, `6px` radius, internal padding `8px 12px`,
  `min-h-9`. Hover border `#5c5f62`; focus `2px` blue ring + `1px blue` border;
  disabled bg `#fafafa`, text `#6d7175`. Inline error: red text under field
  (13px) + red `1px` border. Help text below in `ink-secondary` 13px.
- Select: native appearance with a lucide chevron; no custom dropdown chrome.

### Card
- White bg on `#f6f6f7`, `1px` hairline border, `8px` radius, no shadow (L1).
- Header: 16px/600 title + optional action; content body 14px default.
- Section divider: `1px` `#e1e3e5` hairline.
- Footer / action row: right-aligned primary/secondary, hairline top.

### Tables (DataTable)
- Inside a Card. header row: `13px/600` `ink-secondary` uppercase(optional),
  bg `#fafafa`; cells `14px`, `py-2 px-4`; row hover `#fafafa`.
- No vertical borders; horizontal hairlines `#e1e3e5`.
- Zebra optional. Pagination below right-aligned, 14px.
- Selection checkbox first column; overflow handled by sticky action column.

### Badges / Status chips
- Pill-shaped, `space-0.5 space-2` padding, `13px/600`, muted pastel bg +
  `ink-secondary`/`ink` text (re-mapped `--status-*`); a 6px state dot.
- Critical = `#fbeae5`/`#d82c0d`; success = `#e3f1df`/`#007f5f`;
  neutral = `#e4e5e7`/`#5c5f62`.

### Navigation (sidebar)
- Fixed left (right in RTL) rail, `240px` (collapses to icon `68px`).
- bg `#f6f6f7` (matches app canvas), `1px` `#e1e3e5` right hairline.
- Rows: 36px tall, 14px label, lucide icon 16px `ink-secondary`.
- Row hover `#f1f1f2`; **active** row: `#eceaea` bg + ink text + icon `ink`;
  optional 2px `#202223` left indicator (ink, not brand colour).
- Groups: eyebrow uppercase 12px `ink-tertiary`, generous `space-3` gaps.
- Counts/badges (e.g. stock alerts) right-aligned small chip.

### Top bar (navbar)
- White bg, `1px` `#e1e3e5` bottom hairline, `h-14`.
- Left: store/search; right: help, app switcher icon, notifications, avatar menu.
- Avatar 32px circle with initials on `#e4e5e7`.

### Feedback (toasts / inline messages)
- **Success**: green check icon, message copy unchanged from locale packs;
  `#e3f1df` sx or green-tinted toast; duration short.
- **Error**: red alert icon, unchanged copy.
- **Info/warning**: neutral/amber.
- Keep existing sonner usage; restyle container to flat white + hairline +
  soft (L2) shadow, `12px` radius, no neon glow.
- Empty / loading / error page states: centered icon (48px, `#b5b5bd`), 16px/600
  title, 13px secondary body, one primary CTA.

### Dialog / Sheet / Popover / Dropdown
- White bg, `8px` radius, hairline border + L2/L3 shadow.
- Header: 16px/600, a close (×) icon button (ghost).
- Footer: right-aligned actions with primary/secondary; top hairline.
- Focus trap + Escape retained (existing a11y). Backdrop `rgba(0,0,0,0.32)`.

### Tabs
- Underline style: tab row with 16px/600 labels, active tab `2px` ink underline,
  inactive `ink-secondary`; hover `#f1f1f2`; no pill container.

## Interaction & Motion
- Durations: 120–180ms for hover/focus; 240ms for dialogs/sheets; ease
  `cubic-bezier(0.2,0,0.4,1)` (respects reduced-motion).
- Hover states: subtle bg change only.
- No entrance/stagger animations beyond standard fade/slide of dialogs.
- Rationale: Polaris favours calm, deterministic motion.

## Responsive Behavior
- **≥1024px**: sidebar permanent + top bar.
- **768–1023px**: sidebar collapses to icon rail; top bar shrinks.
- **<768px**: sidebar hidden → mobile bottom-nav/ hamburger (existing
  `mobile-nav`); cards stack; tables scroll horizontally; actions collapse to
  icon buttons; buttons full-width where helpful.
- Touch targets ≥40px on mobile; inputs min-h-10.

## RTL & Localization
- All spacing uses logical properties where classes allow (`pl-*/pr-*` → `ps-*`/
  `pe-*`); verify manually in `html[lang="ar"] [dir="rtl"]`.
- Sidebar sits on the right in RTL; nav order flips; icons that indicate
  direction (chevrons, arrows) flip automatically via CSS logical transforms.
- Typography: Cairo for Arabic everywhere; numeric currency right-aligned.
- Copy stays in locale packs (ar/en/fr) — this spec never hardcodes user text.

## Agent Prompt Guide
- Read this file before any dashboard UI change.
- Apply tokens via `globals.css` CSS variables + existing Tailwind utilities;
  prefer editing shadcn/ui primitives once over per-page hacks.
- Semantic mapping: `--background`→`#f6f6f7`, `--card`→`#fff`,
  `--border`→`#d1d5d9`, `--primary`→ink default (brand override kept),
  `--muted`→`#f1f1f2`, `--muted-foreground`→`#616161`,
  `--destructive`→`#d82c0d`, `--success`→`#007f5f`, `--warning`→`#b98900`,
  `--radius`→`6px`.
- Do NOT change: functionality, data flow, validation, permissions, copy,
  locale keys, or error codes.
- Do NOT add dependencies; do NOT introduce a dark-first or neon look.
- After CSS/token edits, delete `cod-client/tsconfig.tsbuildinfo` before
  `npm run typecheck` if locale JSONs were touched.
