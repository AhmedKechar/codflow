# Shared Queries Context

The centralized data access layer for CodFlow — Drizzle queries, types, and helpers consumed by both cod-server (Cloudflare Workers) and cod-client (Next.js server actions). This is the single source of truth for database operations; no query logic lives outside `cod-shared/`.

## Language

### Core Concepts

**Query Module**:
A focused unit of database operations grouped by aggregate root (orders, products, customers). Each module exposes a small interface of functions that handlers and server actions call directly.
_Avoid_: Service, repository, DAO

**Aggregate Root**:
The primary entity whose lifecycle owns the related data. Orders own order products, status history, and inventory adjustments. Products own variants and images.
_Avoid_: Parent entity, main table

**Batch Prefetch**:
Loading related data for multiple parent records in one query (e.g., all order products for a page of orders) instead of N+1 individual queries. Returns `Map<parentId, related[]>`.
_AVOID_: Eager loading, includes

**Atomic Stock Update**:
A single `UPDATE...WHERE inventory >= abs(delta)...RETURNING` statement that deducts or restores inventory and detects insufficient stock in one round-trip. Replaces the read-then-write pattern.
_Avoid_: Optimistic locking, version check

**Transaction Boundary**:
A `db.transaction()` block that groups multiple writes so they either all succeed or all roll back. Used in createOrder (6+ operations) and deleteOrder (cascade cleanup).
_Avoid_: Atomic operation, saga

### Order Lifecycle

**Order Read Module** (`orders.read.ts`):
Functions that fetch order data without modifying it: listing, counting, filtering, and detail views. Consumed by both server handlers and client server actions.
_Avoid_: Query layer, read service

**Order Mutation Module** (`orders.mutations.ts`):
Functions that create, update, or delete orders and their related records (products, status history, inventory). Includes batch prefetch helpers used internally by mutations.
_Avoid_: Write layer, command handlers

**Order Tracking Module** (`orders.tracking.ts`):
Functions that manage carrier-specific shipment state: tracking numbers, carrier sync, and remark clearing. Only used by shipment-operations and dispatch handlers.
_Avoid_: Shipment queries, carrier queries

**Order Assignment Module** (`orders.assignment.ts`):
Functions that allocate drivers or delivery companies to orders. Small, isolated, tested directly.
_Avoid_: Allocation layer, routing queries

**Order Service** (`cod-server/src/services/order-service.ts`):
A thin orchestration layer in cod-server that composes query functions into business operations. Handlers call the service; the service calls queries. Hides multi-step workflows (create order + deduct inventory + log status) behind a single method.
_Avoid_: Business logic layer, domain service

### Inventory Operations

**Batch Inventory Fetch**:
Three internal helpers (`batchFetchTrackInventory`, `batchFetchVariantInventory`, `batchFetchProductInventory`) that load current stock levels for multiple products/variants in one query. Used by mutations before deducting or restoring inventory.
_Avoid_: Stock check, inventory query

**Stock Movement**:
An audit record in `stockMovements` tracking every inventory change: who changed it, by how much, and why (order create, return, manual adjustment).
_Avoid_: Inventory log, stock history

### Carrier Integration

**Dispatch**:
Creating a shipment with a delivery company via their API. Sets `deliveryMethod` to "company" and writes the tracking number.
_Avoid_: Ship, send, transmit

**Carrier Sync**:
Pulling the latest shipment status from a carrier's API and updating the order status accordingly. Triggered by `syncOrderAfterCarrierUpdate`.
_Avoid_: Webhook processing, status pull

**Bulk Dispatch**:
Creating up to 100 shipments in one API call. Returns per-order success/failure results.
_Avoid_: Batch dispatch, mass dispatch

### Types

**OrderFilters**:
The filter interface for order listing: status, date range, search term, delivery method, driver, carrier. Used by both `getAllOrders` and `getOrdersPaginated`.
_Avoid_: Query params, list options

**OrderListItem**:
The shape of one row in the order list: order info + customer name + driver name + product count + review score. Returned by `getAllOrders`.
_Avoid_: Order summary, list row

**OrdersResult**:
Paginated wrapper: `{ orders: OrderListItem[], total: number, page, limit }`.
_Avoid_: Paginated response, list result

## Boundaries

Terms owned by neighboring contexts — use them, don't redefine here:

- **Order statuses** (new, confirmed, processing, shipped, etc.): Orders endpoint context (`cod-server/src/endpoints/orders/CONTEXT.md`)
- **Status transitions and guards**: Order State Machine (`cod-shared/lib/order-state-machine.ts`)
- **Adjust inventory helper**: Inventory module (`cod-shared/queries/inventory.ts`)
- **Store configuration and branding**: Store Settings context
- **Driver availability and compensation**: Drivers context
- **Carrier API specifics**: Each carrier's own context (Yalidine, NOEST, ZR Express, EcoTrack)

## Module Structure

```
cod-shared/queries/
├── orders.ts              ← barrel re-export (all public API)
├── orders/
│   ├── read.ts            ← getAllOrders, getOrderById, getOrdersCount, getOrderStatusCounts, getOrdersPaginated
│   ├── mutations.ts       ← createOrder, updateOrder, updateOrderStatus, setOrderProductReturn, deleteOrder, updateOrderStatusWebhook, incrementDeliveryAttempts + batch helpers
│   ├── tracking.ts        ← syncOrderAfterCarrierUpdate, updateOrderTracking, clearOrderTracking
│   └── assignment.ts      ← assignDriver, unassignDriver, assignCompany
├── inventory.ts           ← adjustInventory (shared helper)
├── store.ts               ← storefront queries (N+1 batch prefetch)
└── ...                    ← other query modules
```

## Edge Cases

**Barrel re-export preserves all imports**: The original `orders.ts` becomes a barrel that re-exports everything from the four sub-modules. All existing `import { X } from "cod-shared/queries/orders"` continue to work without changes.

**Batch helpers stay with mutations**: The three `batchFetch*` functions are internal to the mutation module — they are never imported directly by handlers or tests. They exist solely to support createOrder, updateOrder, updateOrderStatus, deleteOrder, and updateOrderStatusWebhook.

**reconcile.ts is independent**: The reconciliation module operates directly on the schema (`ordersTable`), not through orders.ts. It is unaffected by this split.

**Client actions import directly**: `cod-client/actions/orders.ts` imports from `cod-shared/queries/orders` (not via barrel). The barrel re-export ensures these imports continue to resolve.

**Test imports are direct**: `orders.queries.test.ts` imports directly from `cod-shared/queries/orders`. The barrel re-export ensures these imports continue to resolve.
