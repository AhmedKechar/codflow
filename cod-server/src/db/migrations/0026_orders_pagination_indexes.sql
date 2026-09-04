-- Migration 0026: Add indexes for server-side pagination
-- Optimized for orders list page with status + wilaya + date filtering

-- ─── Orders Pagination ────────────────────────────────────────────────────────

-- Composite index for status-based filtering with date sorting
-- Covers: status filtering, status + wilaya, status + date range
-- Leftmost prefix: store_id → status → created_at
CREATE INDEX `idx_orders_store_status_created` ON `orders` (`store_id`, `status`, `created_at` DESC);
--> statement-breakpoint

-- Composite index for wilaya-based filtering with date sorting
-- Covers: wilaya filtering, wilaya + date range
-- Leftmost prefix: store_id → wilaya_id → created_at
CREATE INDEX `idx_orders_store_wilaya_created` ON `orders` (`store_id`, `wilaya_id`, `created_at` DESC);
