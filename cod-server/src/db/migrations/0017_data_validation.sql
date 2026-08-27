-- Migration 0017: Data validation scripts
-- Run these after migration to verify data integrity

-- ─── Step 1: Get store ID for data migration ────────────────────────────────────
-- This script assigns all existing data to the first store.
-- In production, you'd need a more sophisticated migration strategy.

-- First, ensure at least one store exists
-- If no store exists, create a default one
INSERT OR IGNORE INTO `stores` (`id`, `name`, `created_at`, `updated_at`)
SELECT 'default_store', 'Default Store', datetime('now'), datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM `stores` WHERE `id` = 'default_store');
--> statement-breakpoint

-- ─── Step 2: Migrate existing data to default store ─────────────────────────────
-- Update all tables with empty store_id to use the default store

UPDATE `orders` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `order_assignments` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `order_status_history` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `order_products` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `abandoned_orders` SET `store_id` = 'default_store' WHERE `store_id` = '';
--> statement-breakpoint

UPDATE `products` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `product_variants` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `product_images` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `product_categories` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `stock_movements` SET `store_id` = 'default_store' WHERE `store_id` = '';
--> statement-breakpoint

UPDATE `customers` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `customer_groups` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `customer_group_members` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `customer_tags` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `customer_tag_assignments` SET `store_id` = 'default_store' WHERE `store_id` = '';
--> statement-breakpoint

UPDATE `drivers` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `driver_compensations` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `driver_payments` SET `store_id` = 'default_store' WHERE `store_id` = '';
--> statement-breakpoint

UPDATE `shipping_profiles` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `shipping_rules` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `shipping_rule_communes` SET `store_id` = 'default_store' WHERE `store_id` = '';
--> statement-breakpoint

UPDATE `delivery_companies` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `company_stop_desks` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `company_shipments` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `company_api_logs` SET `store_id` = 'default_store' WHERE `store_id` = '';
--> statement-breakpoint

UPDATE `offers` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `webhook_events` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `capi_event_log` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `activity_logs` SET `store_id` = 'default_store' WHERE `store_id` = '';
UPDATE `user_scopes` SET `store_id` = 'default_store' WHERE `store_id` = '';
--> statement-breakpoint

-- ─── Step 3: Create default subscription for the store ──────────────────────────

INSERT OR IGNORE INTO `subscriptions` (`id`, `store_id`, `plan_id`, `status`, `trial_start`, `trial_end`, `current_period_start`, `current_period_end`, `created_at`, `updated_at`)
VALUES ('sub_default', 'default_store', 'plan_free_trial', 'trialing', datetime('now'), datetime('now', '+30 days'), datetime('now'), datetime('now', '+30 days'), datetime('now'), datetime('now'));
--> statement-breakpoint

-- ─── Step 4: Create default AI credits for the store ────────────────────────────

INSERT OR IGNORE INTO `ai_credits` (`id`, `store_id`, `total_credits`, `used_credits`, `period_start`, `period_end`, `created_at`, `updated_at`)
VALUES ('ai_default', 'default_store', 0, 0, datetime('now'), datetime('now', '+30 days'), datetime('now'), datetime('now'));
