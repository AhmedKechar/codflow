-- Migration 0024: Create carrier_tracking, notification_settings, blocked_ips tables
-- Adds carrier tracking events, per-store notification preferences, and IP blocking

CREATE TABLE `carrier_tracking` (
  `id` text PRIMARY KEY NOT NULL,
  `order_id` text NOT NULL,
  `store_id` text NOT NULL,
  `company_id` text NOT NULL,
  `tracking_number` text NOT NULL,
  `status` text NOT NULL,
  `status_raw` text,
  `status_ar` text,
  `location` text,
  `event_time` text NOT NULL,
  `raw_data` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`company_id`) REFERENCES `delivery_companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_carrier_tracking_number` ON `carrier_tracking` (`tracking_number`);
--> statement-breakpoint
CREATE INDEX `idx_carrier_tracking_order` ON `carrier_tracking` (`order_id`);
--> statement-breakpoint
CREATE INDEX `idx_carrier_tracking_store` ON `carrier_tracking` (`store_id`);
--> statement-breakpoint
CREATE INDEX `idx_carrier_tracking_store_order` ON `carrier_tracking` (`store_id`, `order_id`);
--> statement-breakpoint
ALTER TABLE `carrier_tracking` ADD CONSTRAINT `chk_tracking_status` CHECK (`status` IN ('received', 'in_transit', 'at_office', 'with_driver', 'delivered', 'returned'));
--> statement-breakpoint
CREATE TABLE `notification_settings` (
  `id` text PRIMARY KEY NOT NULL,
  `store_id` text NOT NULL,
  `order_status` text NOT NULL,
  `channel` text NOT NULL DEFAULT 'both',
  `enabled` integer NOT NULL DEFAULT 1,
  `template_whatsapp` text,
  `template_sms` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notification_settings_store` ON `notification_settings` (`store_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_settings_store_status_unique` ON `notification_settings` (`store_id`, `order_status`);
--> statement-breakpoint
ALTER TABLE `notification_settings` ADD CONSTRAINT `chk_notification_status` CHECK (`order_status` IN ('new', 'confirmed', 'unreachable', 'busy', 'postponed', 'shipped', 'delivered', 'cancelled', 'fake', 'duplicate', 'returned'));
--> statement-breakpoint
ALTER TABLE `notification_settings` ADD CONSTRAINT `chk_notification_channel` CHECK (`channel` IN ('whatsapp', 'sms', 'both'));
--> statement-breakpoint
CREATE TABLE `blocked_ips` (
  `id` text PRIMARY KEY NOT NULL,
  `store_id` text NOT NULL,
  `ip_address` text NOT NULL,
  `reason` text,
  `customer_id` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `expires_at` text,
  FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_blocked_ips_store` ON `blocked_ips` (`store_id`);
--> statement-breakpoint
CREATE INDEX `idx_blocked_ips_address` ON `blocked_ips` (`ip_address`);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocked_ips_store_ip_unique` ON `blocked_ips` (`store_id`, `ip_address`);
