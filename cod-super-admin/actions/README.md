# Server Actions

This directory contains Next.js server actions (`"use server"`) used by the
super-admin UI. They are the bridge between the super-admin frontend and the
backend.

## Auth & security pattern

- **Every action** first calls `await requireSuperAdmin()` from `@/lib/auth`.
  This is the single guard for the whole surface — no action is reachable
  without super-admin privileges.
- **Raw queries** run directly against D1 via `getDb(env.DB)` (from
  `getCloudflareContext`), mostly through the shared query layer in
  `cod-shared/queries/*`.
- **Writes** additionally call `revalidatePath(...)` after the mutation so the
  affected pages reflect the new server state.

## Files

| File | Functions |
|------|-----------|
| `plans.ts` | `listPlans`, `createPlanAction`, `updatePlanAction`, `deletePlanAction` |
| `payments.ts` | `listPendingPayments`, `approvePaymentAction`, `rejectPaymentAction` |
| `stores.ts` | `listStores` |
| `users.ts` | `listUsers` |
| `provider-keys.ts` | `listProviderKeys`, `createProviderKeyAction`, `toggleProviderKeyAction`, `deleteProviderKeyAction` |

## Plans

### `listPlans()`
- **What:** Lists all subscription plans.
- **Returns:** array of plan records from `getAllPlans(db)`.
- **Params:** none.
- **Auth:** `requireSuperAdmin()`.

### `createPlanAction(data: PlanInput)`
- **What:** Creates a new plan (a `randomUUID()` id is generated). Accepts a
  `PlanInput` (name, `nameAr`, `nameFr`, optional descriptions, `priceDzd`,
  `billingCycle`, `trialDays`, and various `max*` limits, plus `features` and
  `sortOrder`). The `isActive` field is stripped from the create payload.
- **Returns:** `{ ok: true, data: plan }`.
- **Params:** `data: PlanInput`.
- **Auth / side effects:** `requireSuperAdmin()`; `revalidatePath("/plans")`.

### `updatePlanAction(planId: string, data: Partial<PlanInput>)`
- **What:** Partially updates an existing plan.
- **Returns:** `{ ok: true, data: plan }`.
- **Params:** `planId: string`, `data: Partial<PlanInput>`.
- **Auth / side effects:** `requireSuperAdmin()`; `revalidatePath("/plans")`.

### `deletePlanAction(planId: string)`
- **What:** Deactivates a plan (via `deactivatePlan` — soft delete).
- **Returns:** `{ ok: true, data: plan }`.
- **Params:** `planId: string`.
- **Auth / side effects:** `requireSuperAdmin()`; `revalidatePath("/plans")`.

## Payments

### `listPendingPayments()`
- **What:** Lists pending payments, augmenting each with its store's `name`
  and `domain` (falling back to the store id / `null` when not found).
- **Returns:** array of pending payments (`{ ...payment, storeName, storeDomain }`).
- **Params:** none.
- **Auth:** `requireSuperAdmin()`.

### `approvePaymentAction(paymentId: string, notes?: string)`
- **What:** Approves a pending payment, recorded against the current signed-in
  user (`getUser()`); throws `"Not authenticated"` if no user is present.
- **Returns:** `{ ok: true, data: payment }`.
- **Params:** `paymentId: string`, `notes?: string`.
- **Auth / side effects:** `requireSuperAdmin()` (+ authenticated user);
  `revalidatePath("/payments")` and `revalidatePath("/dashboard")`.

### `rejectPaymentAction(paymentId: string, notes?: string)`
- **What:** Rejects a pending payment, recorded against the current signed-in
  user; throws `"Not authenticated"` if no user is present.
- **Returns:** `{ ok: true, data: payment }`.
- **Params:** `paymentId: string`, `notes?: string`.
- **Auth / side effects:** `requireSuperAdmin()` (+ authenticated user);
  `revalidatePath("/payments")` and `revalidatePath("/dashboard")`.

## Stores

### `listStores()`
- **What:** Lists all stores with their active/trialing/past-due subscription
  plan (left join on `subscriptions` filtered by status, then `plans`),
  ordered by most recently created.
- **Returns:** array of `{ store, plan }` rows.
- **Params:** none.
- **Auth:** `requireSuperAdmin()`.

## Users

### `listUsers()`
- **What:** Lists all platform users.
- **Returns:** array of user records from `getAllUsers(db)`.
- **Params:** none.
- **Auth:** `requireSuperAdmin()`.

## Provider Keys

### `listProviderKeys()`
- **What:** Lists all provider API keys.
- **Returns:** array of provider keys from `getAllProviderKeys(db)`.
- **Params:** none.
- **Auth:** `requireSuperAdmin()`.

### `createProviderKeyAction(data: ProviderKeyInput)`
- **What:** Creates a new provider key (a `randomUUID()` id is generated).
  Accepts `ProviderKeyInput` (`provider`, `keyName`, `keyValue`,
  optional `expiresAt`).
- **Returns:** `{ ok: true, data: key }`.
- **Params:** `data: ProviderKeyInput`.
- **Auth / side effects:** `requireSuperAdmin()`; `revalidatePath("/provider-keys")`.

### `toggleProviderKeyAction(keyId: string, isActive: boolean)`
- **What:** Activates or deactivates a provider key.
- **Returns:** `{ ok: true, data: key }`.
- **Params:** `keyId: string`, `isActive: boolean`.
- **Auth / side effects:** `requireSuperAdmin()`; `revalidatePath("/provider-keys")`.

### `deleteProviderKeyAction(keyId: string)`
- **What:** Deletes a provider key.
- **Returns:** `{ ok: true, data: key }`.
- **Params:** `keyId: string`.
- **Auth / side effects:** `requireSuperAdmin()`; `revalidatePath("/provider-keys")`.

## Security note

Every action in this directory calls the super-admin guard
(`requireSuperAdmin()` from `@/lib/auth`) before doing any work, so the whole
surface is only reachable by super-admins. All write operations
(`createPlanAction`, `updatePlanAction`, `deletePlanAction`,
`approvePaymentAction`, `rejectPaymentAction`, `createProviderKeyAction`,
`toggleProviderKeyAction`, `deleteProviderKeyAction`) call
`revalidatePath(...)` after mutating to keep the served pages consistent.
