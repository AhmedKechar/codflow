# Spec: Split orders.ts God File + Create Order Service

## Problem Statement

The `cod-shared/queries/orders.ts` file is 1577 lines with 18 exported functions, 3 internal helpers, and 3 types. It is imported by 15+ files across cod-server and cod-client. This god file violates the Single Responsibility Principle — reads, mutations, carrier tracking, and driver assignment all live in one module. Understanding any single operation requires scrolling through unrelated code. The file is the #1 code smell identified in the Architecture Review (AR2).

Additionally, handlers in cod-server directly compose query functions into multi-step business operations (e.g., create order → deduct inventory → log status → notify). This orchestration logic is duplicated across handlers and cannot be tested independently.

## Solution

Split `orders.ts` into four focused query modules under `cod-shared/queries/orders/`, connected by a barrel re-export that preserves all existing imports. Then create an Order Service in cod-server that composes query functions into testable business operations.

## User Stories

1. As a developer, I want to find the order listing query in under 5 seconds, so that I can modify filter logic without reading mutation code.
2. As a developer, I want to add a new mutation to orders without touching read queries, so that my change has minimal blast radius.
3. As a developer, I want to understand which functions handle carrier tracking, so that I can add a new carrier integration.
4. As a developer, I want to test order creation logic without spinning up HTTP handlers, so that I can iterate faster.
5. As a developer, I want to see which query functions a handler calls, so that I can understand the data flow.
6. As a developer, I want the barrel re-export to preserve my existing imports, so that I don't have to update 15+ files.
7. As a developer, I want batch prefetch helpers co-located with the mutations that use them, so that I can understand the N+1 prevention strategy.
8. As a developer, I want the Order Service to hide multi-step workflows, so that handlers become thin HTTP adapters.
9. As a developer, I want to test the Order Service independently, so that I can verify business logic without HTTP concerns.
10. As a developer, I want the Order Service to compose existing queries, so that there is no duplicated database logic.

## Implementation Decisions

### A1: orders.ts Split

**Target structure:**
```
cod-shared/queries/
├── orders.ts                    ← barrel re-export (0 logic)
├── orders/
│   ├── read.ts                  ← 5 functions + 3 types (~500 lines)
│   ├── mutations.ts             ← 7 functions + 3 internal helpers (~600 lines)
│   ├── tracking.ts              ← 3 functions (~100 lines)
│   └── assignment.ts            ← 3 functions (~100 lines)
```

**read.ts exports:** `getAllOrders`, `getOrdersCount`, `getOrderStatusCounts`, `getOrdersPaginated`, `getOrderById`, `OrderFilters`, `OrderListItem`, `OrdersResult`

**mutations.ts exports:** `createOrder`, `updateOrder`, `updateOrderStatus`, `setOrderProductReturn`, `deleteOrder`, `updateOrderStatusWebhook`, `incrementDeliveryAttempts` + internal: `batchFetchTrackInventory`, `batchFetchVariantInventory`, `batchFetchProductInventory`

**tracking.ts exports:** `syncOrderAfterCarrierUpdate`, `updateOrderTracking`, `clearOrderTracking`

**assignment.ts exports:** `assignDriver`, `unassignDriver`, `assignCompany`

**Barrel strategy:** `orders.ts` becomes `export * from "./orders/read"; export * from "./orders/mutations"; export * from "./orders/tracking"; export * from "./orders/assignment";`

**Import preservation:** All 15+ import sites continue to work unchanged because the barrel re-exports everything.

### A3: Order Service

**Location:** `cod-server/src/services/order-service.ts`

**Methods:**
- `getOrdersWithDetails(filters)` → composes `getOrdersPaginated`
- `getOrderWithDetails(id)` → composes `getOrderById`
- `createOrderWithInventory(data)` → composes `createOrder` + inventory + status history
- `updateOrderWithInventory(id, data)` → composes `updateOrder` + inventory recalculation
- `updateOrderStatusWithHistory(id, status, note?)` → composes `updateOrderStatus` + history
- `returnOrderProductWithInventory(orderId, productId, qty)` → composes `setOrderProductReturn`
- `deleteOrderWithInventory(id)` → composes `deleteOrder` + inventory restore
- `dispatchToCarrier(orderId, carrierId, shipmentData)` → composes `getOrderById` + `assignCompany` + `updateOrderTracking` + `updateOrderStatus`
- `cancelShipmentWithTracking(orderId)` → composes `getOrderById` + `clearOrderTracking` + `updateOrderStatus`

**Design:** Functions (not a class). Each method accepts `db` as first parameter. No side effects beyond DB writes. Returns results, doesn't throw on business errors (callers handle errors).

## Testing Decisions

**Seams:** Test at the query function level (unit tests with mock DB) and at the Order Service level (unit tests with mock queries).

**Existing tests:** `orders.queries.test.ts` (25 tests) — these test query functions directly and should continue to pass unchanged after A1.

**New tests needed:**
- `order-service.test.ts` — test each Order Service method with mock query functions
- Verify all 1235 existing tests pass after A1 and A3

**Test approach:** Use the existing `makeMockDb` pattern from `cod-server/src/test-utils/mock-db.ts`.

## Out of Scope

- Integrating `OrderStateMachine` (isTerminal, canTransition) into handlers — existing code still uses `STATUS_RANK` directly
- Integrating `adjustInventory` from `cod-shared/queries/inventory.ts` into mutations — existing inline stock logic remains
- Changing handler HTTP behavior or API contracts
- Modifying the reconcile module (already independent of orders.ts)
- Updating client action imports (barrel preserves them)

## Further Notes

- The `cod-shared/queries/orders/` directory already exists (empty) — it was created in anticipation of this split
- The `STATUS_RANK` constant in `order-state-machine.ts` is imported by `updateOrderStatusWebhook` in mutations.ts — this is the only cross-module dependency
- `reconcile.ts` operates directly on the schema, not through orders.ts — unaffected by this split
