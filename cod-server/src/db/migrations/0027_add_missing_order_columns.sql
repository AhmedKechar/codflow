-- Migration 0027: Add missing order columns for carrier tracking, postponement, and IP tracking
-- These columns were added to the Drizzle schema but never migrated to the database.
-- They cause INSERT failures on the orders table.

ALTER TABLE `orders` ADD `carrier_status` text DEFAULT 'none' NOT NULL;
ALTER TABLE `orders` ADD `postponed_until` text;
ALTER TABLE `orders` ADD `customer_ip` text;
