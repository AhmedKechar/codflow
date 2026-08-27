-- Migration 0014: Add strategic indexes for multi-tenant performance
-- Only indexes on frequently queried columns. No over-indexing.

-- ─── Orders Domain ──────────────────────────────────────────────────────────────

-- High-traffic: orders by store + status (dashboard list)
CREATE INDEX `idx_orders_store_status` ON `orders` (`store_id`,`status`);
--> statement-breakpoint

-- Orders by store + creation date (reports, analytics)
CREATE INDEX `idx_orders_store_created` ON `orders` (`store_id`,`created_at`);
--> statement-breakpoint

-- Orders by store + phone (customer lookup)
CREATE INDEX `idx_orders_store_phone` ON `orders` (`store_id`,`phone`);
--> statement-breakpoint

-- Abandoned orders by store + status (recovery workflow)
CREATE INDEX `idx_abandoned_store_status` ON `abandoned_orders` (`store_id`,`status`);
--> statement-breakpoint

-- ─── Products Domain ────────────────────────────────────────────────────────────

-- Products by store + category (catalog browsing)
CREATE INDEX `idx_products_store_category` ON `products` (`store_id`,`category_id`);
--> statement-breakpoint

-- Products by store + status (active products list)
CREATE INDEX `idx_products_store_status` ON `products` (`store_id`,`status`);
--> statement-breakpoint

-- ─── Customers Domain ───────────────────────────────────────────────────────────

-- Customers by store + phone (search by phone)
CREATE INDEX `idx_customers_store_phone` ON `customers` (`store_id`,`phone`);
--> statement-breakpoint

-- ─── Drivers Domain ─────────────────────────────────────────────────────────────

-- Drivers by store + status (available drivers list)
CREATE INDEX `idx_drivers_store_status` ON `drivers` (`store_id`,`status`);
--> statement-breakpoint

-- ─── Activity Logs ──────────────────────────────────────────────────────────────

-- Activity logs by store (audit trail query)
CREATE INDEX `idx_activity_logs_store` ON `activity_logs` (`store_id`);
--> statement-breakpoint

-- Activity logs by store + entity (entity history)
CREATE INDEX `idx_activity_logs_store_entity` ON `activity_logs` (`store_id`,`entity_type`);
--> statement-breakpoint

-- ─── Stock Movements ────────────────────────────────────────────────────────────

-- Stock movements by store + product (product history)
CREATE INDEX `idx_stock_movements_store_product` ON `stock_movements` (`store_id`,`product_id`);
--> statement-breakpoint

-- ─── Webhook Events ─────────────────────────────────────────────────────────────

-- Webhook events by store (event log query)
CREATE INDEX `idx_webhook_events_store` ON `webhook_events` (`store_id`);
--> statement-breakpoint

-- ─── User Scopes ────────────────────────────────────────────────────────────────

-- User scopes by store (permission lookup)
CREATE INDEX `idx_user_scopes_store` ON `user_scopes` (`store_id`);
--> statement-breakpoint

-- User scopes by store + user (user permissions)
CREATE INDEX `idx_user_scopes_store_user` ON `user_scopes` (`store_id`,`user_id`);
