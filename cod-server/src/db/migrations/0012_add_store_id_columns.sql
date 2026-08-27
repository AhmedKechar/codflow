-- Migration 0012: Add store_id to all store-specific tables
-- This is the foundation of multi-tenant isolation.
-- All business data tables get store_id with FK to stores(id).
-- Default value is empty string for existing data migration.

-- ─── Orders Domain ──────────────────────────────────────────────────────────────

ALTER TABLE `orders` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `order_assignments` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `order_status_history` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `order_products` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `abandoned_orders` ADD `store_id` text DEFAULT '' NOT NULL;

-- ─── Products Domain ────────────────────────────────────────────────────────────

ALTER TABLE `products` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `product_variants` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `product_images` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `product_categories` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `stock_movements` ADD `store_id` text DEFAULT '' NOT NULL;

-- ─── Customers Domain ───────────────────────────────────────────────────────────

ALTER TABLE `customers` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `customer_groups` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `customer_group_members` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `customer_tags` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `customer_tag_assignments` ADD `store_id` text DEFAULT '' NOT NULL;

-- ─── Drivers Domain ─────────────────────────────────────────────────────────────

ALTER TABLE `drivers` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `driver_compensations` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `driver_payments` ADD `store_id` text DEFAULT '' NOT NULL;

-- ─── Shipping Domain ────────────────────────────────────────────────────────────

ALTER TABLE `shipping_profiles` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `shipping_rules` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `shipping_rule_communes` ADD `store_id` text DEFAULT '' NOT NULL;

-- ─── Delivery Companies Domain ──────────────────────────────────────────────────

ALTER TABLE `delivery_companies` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `company_stop_desks` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `company_shipments` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `company_api_logs` ADD `store_id` text DEFAULT '' NOT NULL;

-- ─── Other Domains ──────────────────────────────────────────────────────────────

ALTER TABLE `offers` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `webhook_events` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `capi_event_log` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `activity_logs` ADD `store_id` text DEFAULT '' NOT NULL;
ALTER TABLE `user_scopes` ADD `store_id` text DEFAULT '' NOT NULL;
