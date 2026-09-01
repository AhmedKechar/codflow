# Phase 1: Index Pages

**Status:** READY (Phase 0 completed)
**Depends on:** Phase 0
**Blocks:** None (parallel with Phase 2-6)
**Max Parallel Agents:** 5

---

## Overview

Convert all 11 list/table pages to Polaris IndexTable pattern:
- PageHeader with title + primary action (e.g., "New Product")
- Filter bar with search + status filter
- Tabs for status filtering (All / Active / Draft / Archived)
- Data table with selectable rows + bulk actions
- Pagination

---

## Pattern Reference

Each index page should follow this structure:

```tsx
"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useState } from "react";

export function ResourceView({ data, onDelete }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Resources"
        primaryAction={{
          label: "New Resource",
          onClick: () => router.push("/resources/new"),
        }}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Input placeholder="Search..." value={search} onChange={...} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({counts.draft})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="name"
      />
    </div>
  );
}
```

---

## Tasks

### 1.1 Products list → IndexTable
**File:** `components/products/products-view.tsx`
**Current:** Simple header + ProductsTable
**Changes:**
- Add PageHeader with "Products" title + "New Product" button
- Add status filter tabs
- Ensure table has bulk actions (delete selected)
- Add search input

### 1.2 Orders list → IndexTable
**File:** `components/orders/orders-view.tsx`
**Current:** Simple header + OrdersTable
**Changes:**
- Add PageHeader with "Orders" title + "New Order" button
- Add status filter tabs (All / Pending / Shipped / Delivered)
- Ensure table has bulk actions

### 1.3 Customers list → IndexTable
**File:** `components/customers/customers-view.tsx`
**Current:** Simple header + CustomersTable
**Changes:**
- Add PageHeader with "Customers" title + "Add Customer" button
- Add search input
- Ensure table has bulk actions

### 1.4 Product Groups list
**File:** `app/(dashboard)/product-groups/page.tsx`
**Changes:**
- Add PageHeader with "Product Groups" title + "New Group" button
- Wrap existing content in consistent layout

### 1.5 Customer Tags list
**File:** `app/(dashboard)/customer-tags/page.tsx`
**Changes:**
- Add PageHeader with "Customer Tags" title + "New Tag" button

### 1.6 Customer Groups list
**File:** `app/(dashboard)/customer-groups/page.tsx`
**Changes:**
- Add PageHeader with "Customer Groups" title + "New Group" button

### 1.7 Drivers list
**File:** `app/(dashboard)/delivery/drivers/page.tsx`
**Changes:**
- Add PageHeader with "Drivers" title + "Add Driver" button

### 1.8 Shipping Profiles list
**File:** `app/(dashboard)/delivery/shipping-profiles/page.tsx`
**Changes:**
- Add PageHeader with "Shipping Profiles" title + "New Profile" button

### 1.9 Offers list
**File:** `app/(dashboard)/offers/page.tsx`
**Changes:**
- Add PageHeader with "Offers" title + "New Offer" button

### 1.10 Discounts list
**File:** `app/(dashboard)/discounts/page.tsx`
**Changes:**
- Add PageHeader with "Discounts" title + "New Discount" button

### 1.11 Gift Cards list
**File:** `app/(dashboard)/store/gift-cards/page.tsx`
**Changes:**
- Add PageHeader with "Gift Cards" title + "New Gift Card" button

---

## Verification Checklist

For each page:
- [ ] PageHeader renders with correct title and primary action
- [ ] Primary action navigates to create page
- [ ] Existing table functionality preserved
- [ ] RTL layout works correctly
- [ ] Passes `npm run typecheck`
- [ ] Passes `npm test` (if tests exist)

---

## File Dependencies

All tasks in this phase are independent and can be done in parallel.
No task depends on another task within this phase.
