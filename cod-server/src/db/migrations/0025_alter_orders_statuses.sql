-- Migration 0025: Add carrier_status, postponed_until, customer_ip to orders

ALTER TABLE `orders` ADD `carrier_status` text DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE `orders` ADD `postponed_until` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_ip` text;
--> statement-breakpoint
CREATE INDEX `idx_orders_carrier_status` ON `orders` (`carrier_status`);
--> statement-breakpoint
CREATE INDEX `idx_orders_postponed` ON `orders` (`postponed_until`);
