# CodFlow Architecture Review Report

**Date:** 2026-09-05
**Reviewer:** Architecture Reviewer Agent

---

## AR1: Module Depth Evaluation

### Shallow CRUD-Only Modules

| Module | Lines | Business Logic | Verdict |
|--------|-------|---------------|---------|
| discount-codes | 95 | No (validate/apply in shared) | SHALLOW |
| gift-cards | 103 | No (redeem/disable in shared) | SHALLOW |
| wilayas | 51 | No (read-only reference) | SHALLOW (intentional) |
| customer-tags | 146 | Minimal (assignment guard) | PARTIAL |
| customer-groups | 145 | Minimal (member guard) | PARTIAL |

**Finding:** discount-codes and gift-cards have business logic in `cod-shared/queries/` but the endpoint handlers don't expose it. The modules are pure CRUD shells.

**Recommendation:** Either expose business logic via dedicated endpoints (e.g., `POST /discount-codes/:id/validate`) or accept that validation is consumed by the orders flow only.

---

## AR2: Circular Dependencies

**No true circular import chains found.** The dependency graph is strictly layered:

```
cod-shared/db/schema.ts  <-- leaf
cod-shared/queries/* --> db/schema.ts (one-way)
cod-server/src/* --> cod-shared/* (one-way)
cod-client/actions/* --> cod-shared/* (one-way)
```

**Bidirectional coupling detected:**
- `orders/reconcile.ts` and `orders/shipment-operations.ts` import from `webhooks/noest-status-mapper.ts` and `webhooks/ecotrack-status-mapper.ts`
- `webhooks/handlers.ts` imports from `orders/validation.ts`

**Recommendation:** Extract carrier status mappers to `delivery-companies/mappers/` to eliminate cross-module coupling.

---

## AR3: Code Smells

### Large Files (>500 lines)

| File | Lines | Issue |
|------|-------|-------|
| `cod-shared/db/schema.ts` | 1,809 | Monolithic schema |
| `cod-shared/queries/orders.ts` | 1,407 | God query module |
| `cod-shared/queries/store.ts` | 1,035 | Mixed concerns |
| `cod-server/src/endpoints/orders/routes.ts` | 663 | Route definitions |
| `cod-server/src/endpoints/orders/dispatch.ts` | 565 | Carrier orchestration |
| `cod-server/src/endpoints/orders/shipment-operations.ts` | 553 | Shipment operations |

### Feature Envy

- `orders/dispatch.ts`, `orders/shipment-operations.ts` — severe envy toward `delivery-companies/`
- `webhooks/handlers.ts` — imports from `orders/validation.ts`

### Primitive Obsession

- Status values as raw strings (no branded types)
- Money amounts as raw `number` (no currency awareness)
- IDs as raw `string` (no UUID branding)
- Colors as raw strings (validated by regex only)

### Duplicated Code

- **Customer Tags vs Groups** — near-identical CRUD + assignment pattern
- **Client action boilerplate** — 23 files repeat same 5-line setup
- **Query list+search pattern** — 10+ modules duplicate identical logic

---

## Recommendations

| Priority | Action |
|----------|--------|
| HIGH | Extract carrier mappers from webhooks/ |
| HIGH | Split schema.ts into domain-grouped files |
| HIGH | Split orders.ts queries into sub-modules |
| MEDIUM | Create counted-assignment abstraction |
| MEDIUM | Extract client action boilerplate |
| LOW | Add branded types for IDs/statuses |
| LOW | Expose discount/gift-card business logic |
