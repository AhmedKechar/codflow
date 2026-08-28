# CRO Enhancements Plan — Countdown + Trust Seals + Order Form Customization

## Status: ✅ COMPLETE

## Quick Reference

| # | Feature | Status | Agent | Dependencies |
|---|---------|--------|-------|--------------|
| 1 | DB Foundation (Schema + Migration) | ✅ | Agent 1 | None |
| 2 | Server Validation + Routes + OpenAPI | ✅ | Agent 2 | Agent 1 |
| 3 | Client Types (StoreConfig + UpdateStoreData) | ✅ | Agent 3 | Agent 1 |
| 4 | Storefront Schema + Query (endsAt) | ✅ | Agent 4 | Agent 1 |
| 5 | Dashboard UI (Trust Seals + Order Form settings) | ✅ | Agent 5 | Agent 2+3 |
| 6 | Countdown Timer component | ✅ | Agent 6 | Agent 4 |
| 7 | Trust Seals component | ✅ | Agent 7 | Agent 4 |
| 8 | Order Form Customization | ✅ | Agent 8 | Agent 4 |
| 9 | Translations (ar/en/fr) | ✅ | Agent 9 | None |
| 10 | Tests + Typecheck | ✅ | Agent 10 | All |

---

## Phase 1: DB Foundation (serial)

### Agent 1: Schema + Migration

**Files:**
- `cod-shared/db/schema.ts:849-903` — Add `trustSeals` + `orderFormConfig` columns to stores table
- `cod-shared/db/migrations/0020_cro_enhancements.sql` — NEW: ALTER TABLE ADD COLUMN

**SQL:**
```sql
-- trustSeals: JSON array of enabled seal types, NULL = no seals
ALTER TABLE stores ADD COLUMN trust_seals TEXT;

-- orderFormConfig: JSON object with form field visibility, NULL = defaults
ALTER TABLE stores ADD COLUMN order_form_config TEXT;
```

**Drizzle schema:**
```typescript
trustSeals: text("trust_seals"),  // JSON, nullable
orderFormConfig: text("order_form_config"),  // JSON, nullable
```

---

## Phase 2: Integration (parallel — 3 agents)

### Agent 2: Server Validation + Routes + OpenAPI

**Files:**
- `cod-server/src/endpoints/stores/validation.ts` — Add to updateStoreSchema
- `cod-server/src/endpoints/stores/routes.ts:71-90` — Add to OpenAPI Zod body
- `cod-server/src/openapi/schemas/store.ts:10-64, 261-296` — Add to StoreSchema + StoreConfigSchema

**Zod schema:**
```typescript
trustSeals: z.object({
  cashOnDelivery: z.boolean().optional(),
  freeReturns: z.boolean().optional(),
  secureCheckout: z.boolean().optional(),
  fastDelivery: z.boolean().optional(),
  customerSupport: z.boolean().optional(),
  qualityGuarantee: z.boolean().optional(),
}).nullable().optional(),

orderFormConfig: z.object({
  showName: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showAddress: z.boolean().optional(),
  showWilaya: z.boolean().optional(),
  showCommune: z.boolean().optional(),
  showDeliveryType: z.boolean().optional(),
  showNotes: z.boolean().optional(),
  showQuantity: z.boolean().optional(),
  submitButtonText: z.string().max(50).nullable().optional(),
  summaryDisplay: z.enum(["open", "closed", "hidden"]).optional(),
}).nullable().optional(),
```

### Agent 3: Client Types

**Files:**
- `cod-client/actions/stores.ts:14-38` — Add to StoreConfig interface
- `cod-client/actions/stores.ts:40-62` — Add to UpdateStoreData Pick

**Types:**
```typescript
export interface TrustSealsConfig {
  cashOnDelivery?: boolean;
  freeReturns?: boolean;
  secureCheckout?: boolean;
  fastDelivery?: boolean;
  customerSupport?: boolean;
  qualityGuarantee?: boolean;
}

export interface OrderFormConfig {
  showName?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showAddress?: boolean;
  showWilaya?: boolean;
  showCommune?: boolean;
  showDeliveryType?: boolean;
  showNotes?: boolean;
  showQuantity?: boolean;
  submitButtonText?: string | null;
  summaryDisplay?: "open" | "closed" | "hidden";
}

// In StoreConfig:
trustSeals: TrustSealsConfig | null;
orderFormConfig: OrderFormConfig | null;
```

### Agent 4: Storefront Schema + Query

**Files:**
- `cod-shared/queries/store.ts:194-234` — Add `startsAt`, `endsAt` to returned offer objects
- `cod-astro/theme01/src/core/api/validation.ts:33-44` — Add to OfferSchema

**Updated OfferSchema:**
```typescript
export const OfferSchema = z.object({
  // ... existing fields ...
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
});
```

---

## Phase 3: UI + Components (parallel — 5 agents)

### Agent 5: Dashboard UI

**Files:**
- `cod-client/components/settings/theme-settings.tsx` — Add Trust Seals checkboxes + Order Form config section

**Sections:**
1. Trust Seals: 6 checkboxes with icons
2. Order Form: toggles for each field + submit button text input + summary display dropdown

### Agent 6: Countdown Timer

**Files:**
- `cod-astro/theme01/src/theme/components/order/CountdownTimer.astro` — NEW: countdown component
- `cod-astro/theme01/src/theme/components/order/OfferTiers.astro:29-37` — Render countdown
- `cod-astro/theme01/src/theme/scripts/product.ts:68-78` — Countdown logic + hide on expire

**Design:**
```
┌─────────────────────────────────────┐
│  اشترِ 2 واحصل على 1 مجاناً        │
│  ⏳ ينتهي خلال: 02:30:45           │
└─────────────────────────────────────┘
```

### Agent 7: Trust Seals Component

**Files:**
- `cod-astro/theme01/src/theme/components/product/TrustSeals.astro` — NEW: seals display
- `cod-astro/theme01/src/theme/components/product/ProductDetailContent.astro` — Add TrustSeals

**Design:**
```
┌─────────────────────────────────────────────────────┐
│  ✅ الدفع عند الاستلام  │  ✅ استرجاع مجاني  │  ✅ توصيل آمن  │
└─────────────────────────────────────────────────────┘
```

### Agent 8: Order Form Customization

**Files:**
- `cod-astro/theme01/src/theme/components/order/CustomerFields.astro:15-142` — Read config + conditional render
- `cod-astro/theme01/src/theme/components/order/OrderForm.astro:12-24` — Pass config + button text
- `cod-astro/theme01/src/theme/components/order/OrderSummary.astro:1-71` — Summary display modes
- `cod-astro/theme01/src/theme/scripts/product.ts` — Collapse/expand logic

**Config defaults:**
```json
{
  "showName": true,
  "showPhone": true,
  "showEmail": false,
  "showAddress": true,
  "showWilaya": true,
  "showCommune": true,
  "showDeliveryType": true,
  "showNotes": false,
  "showQuantity": true,
  "submitButtonText": null,
  "summaryDisplay": "open"
}
```

### Agent 9: Translations

**Files:**
- `cod-astro/theme01/src/theme/content/ar.ts` — Arabic translations
- `cod-astro/theme01/src/theme/content/en.ts` — English translations
- `cod-astro/theme01/src/theme/content/fr.ts` — French translations
- `cod-astro/theme01/src/theme/content/types.ts` — New content keys

**Translation keys:**
```typescript
// Countdown
countdownLabel: string;
countdownExpired: string;

// Trust Seals
sealCashOnDelivery: string;
sealFreeReturns: string;
sealSecureCheckout: string;
sealFastDelivery: string;
sealCustomerSupport: string;
sealQualityGuarantee: string;

// Order Form
formEmailPlaceholder: string;
formSummaryOpen: string;
formSummaryClosed: string;
```

---

## Phase 4: Tests (serial)

### Agent 10: Tests + Typecheck

**Tasks:**
1. Update `cod-server/src/endpoints/stores/stores.test.ts` — Add `trustSeals` + `orderFormConfig` to storeRow()
2. Run `cd cod-server && npm test`
3. Run `cd cod-client && npx tsc --noEmit`
4. Verify all 1173+ tests pass

---

## Dependencies Graph

```
Agent 1 (DB)
    │
    ├──→ Agent 2 (Server) ──┐
    ├──→ Agent 3 (Types) ───┤
    └──→ Agent 4 (Schema) ──┤
                             │
         ┌───────────────────┤
         │                   │
         ▼                   ▼
    ┌─────────┐        ┌─────────┐
    │Agent 5  │        │Agent 9  │
    │Dashboard│        │Trans-   │
    │UI       │        │lations  │
    └────┬────┘        └─────────┘
         │
    ┌────┴────┬────────┬────────┐
    │         │        │        │
    ▼         ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐
│Agent 6 ││Agent 7 ││Agent 8 │
│Count-  ││Trust   ││Order   │
│down    ││Seals   ││Form    │
└───┬────┘└───┬────┘└───┬────┘
    │         │         │
    └─────────┴─────────┘
              │
              ▼
         ┌─────────┐
         │Agent 10 │
         │Tests    │
         └─────────┘
```

---

## Translation Keys Reference

### Arabic (ar)
```typescript
countdownLabel: "ينتهي خلال:";
countdownExpired: "انتهى العرض";
sealCashOnDelivery: "الدفع عند الاستلام";
sealFreeReturns: "استرجاع مجاني خلال 7 أيام";
sealSecureCheckout: "دفع آمن ومشفر";
sealFastDelivery: "توصيل سريع";
sealCustomerSupport: "دعم فني 24/7";
sealQualityGuarantee: "ضمان الجودة";
formEmailPlaceholder: "بريدك الإلكتروني";
formSummaryOpen: "ملخص الطلب";
formSummaryClosed: "افتح ملخص الطلب";
```

### English (en)
```typescript
countdownLabel: "Ends in:";
countdownExpired: "Offer expired";
sealCashOnDelivery: "Cash on Delivery";
sealFreeReturns: "Free Returns (7 days)";
sealSecureCheckout: "Secure Checkout";
sealFastDelivery: "Fast Delivery";
sealCustomerSupport: "24/7 Customer Support";
sealQualityGuarantee: "Quality Guarantee";
formEmailPlaceholder: "Your email";
formSummaryOpen: "Order Summary";
formSummaryClosed: "Open order summary";
```

### French (fr)
```typescript
countdownLabel: "Se termine dans:";
countdownExpired: "Offre expirée";
sealCashOnDelivery: "Paiement à la livraison";
sealFreeReturns: "Retours gratuits (7 jours)";
sealSecureCheckout: "Paiement sécurisé";
sealFastDelivery: "Livraison rapide";
sealCustomerSupport: "Support client 24/7";
sealQualityGuarantee: "Garantie qualité";
formEmailPlaceholder: "Votre email";
formSummaryOpen: "Résumé de la commande";
formSummaryClosed: "Ouvrir le résumé";
```

---

## File Changes Summary

| Package | Files Changed | Files New |
|---------|--------------|-----------|
| cod-shared | 2 | 1 |
| cod-server | 3 | 0 |
| cod-client | 2 | 0 |
| cod-astro/theme01 | 8 | 2 |
| **Total** | **15** | **3** |

---

## Estimated Time

| Phase | Agents | Time |
|-------|--------|------|
| 1. DB Foundation | 1 | ~5 min |
| 2. Integration | 3 (parallel) | ~10 min |
| 3. UI + Components | 5 (parallel) | ~20 min |
| 4. Tests | 1 | ~10 min |
| **Total** | **10** | **~45 min** |

---

## Notes

- Email field (`showEmail`) defaults to `false` (hidden)
- Order summary defaults to `"open"` (fully visible)
- Countdown timer uses vanilla JS (no framework)
- Trust Seals are manual (merchant toggles each one)
- All new text must have ar/en/fr translations
- Colors follow store's primaryColor/accentColor
- Border radius uses existing CSS variable tokens
