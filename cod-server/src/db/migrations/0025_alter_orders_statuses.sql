-- Migration 0025: Add carrier_status, postponed_until, customer_ip to orders
-- Drops old status CHECK, adds new status CHECK with 11 statuses, adds carrier_status CHECK

ALTER TABLE `orders` ADD `carrier_status` text DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE `orders` ADD `postponed_until` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_ip` text;
--> statement-breakpoint
ALTER TABLE `orders` DROP CONSTRAINT `chk_orders_status`;
--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_status` CHECK (`status` IN ('new', 'confirmed', 'unreachable', 'busy', 'postponed', 'shipped', 'delivered', 'cancelled', 'fake', 'duplicate', 'returned'));
--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_carrier_status` CHECK (`carrier_status` IN ('none', 'received', 'in_transit', 'at_office', 'with_driver', 'delivered', 'returned'));
--> statement-breakpoint
CREATE INDEX `idx_orders_carrier_status` ON `orders` (`carrier_status`);
--> statement-breakpoint
CREATE INDEX `idx_orders_postponed` ON `orders` (`postponed_until`);
