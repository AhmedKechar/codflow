-- Migration 0013: Create new SaaS tables
-- Subscription management, payments, AI credits, WhatsApp, custom domains, etc.

-- ─── Subscription Plans ─────────────────────────────────────────────────────────

CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_fr` text NOT NULL,
	`description` text,
	`description_ar` text,
	`description_fr` text,
	`price_dzd` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'DZD' NOT NULL,
	`billing_cycle` text DEFAULT 'monthly' NOT NULL,
	`trial_days` integer DEFAULT 0,
	`max_orders` integer DEFAULT 20 NOT NULL,
	`max_products` integer DEFAULT 100,
	`max_drivers` integer DEFAULT 5,
	`max_customers` integer DEFAULT 1000,
	`max_team_members` integer DEFAULT 2,
	`max_ai_credits` integer DEFAULT 0,
	`features` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint

-- ─── Store Subscriptions ────────────────────────────────────────────────────────

CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`status` text DEFAULT 'trialing' NOT NULL,
	`trial_start` text,
	`trial_end` text,
	`current_period_start` text,
	`current_period_end` text,
	`cancel_at` text,
	`canceled_at` text,
	`payment_method` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE INDEX `idx_subscriptions_store` ON `subscriptions` (`store_id`);
--> statement-breakpoint

CREATE INDEX `idx_subscriptions_status` ON `subscriptions` (`status`);
--> statement-breakpoint

-- ─── Payments ──────────────────────────────────────────────────────────────────

CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`store_id` text NOT NULL,
	`amount_dzd` integer NOT NULL,
	`currency` text DEFAULT 'DZD' NOT NULL,
	`payment_method` text NOT NULL,
	`receipt_url` text,
	`receipt_file` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`review_notes` text,
	`reference_number` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE INDEX `idx_payments_store` ON `payments` (`store_id`);
--> statement-breakpoint

CREATE INDEX `idx_payments_subscription` ON `payments` (`subscription_id`);
--> statement-breakpoint

CREATE INDEX `idx_payments_status` ON `payments` (`status`);
--> statement-breakpoint

-- ─── Store Members (User-Store junction) ────────────────────────────────────────

CREATE TABLE `store_members` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`store_id` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`invited_by` text,
	`invited_at` text,
	`joined_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE INDEX `idx_store_members_user` ON `store_members` (`user_id`);
--> statement-breakpoint

CREATE INDEX `idx_store_members_store` ON `store_members` (`store_id`);
--> statement-breakpoint

CREATE UNIQUE INDEX `idx_store_members_user_store` ON `store_members` (`user_id`,`store_id`);
--> statement-breakpoint

-- ─── Invitations ────────────────────────────────────────────────────────────────

CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`invited_by` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`accepted_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE UNIQUE INDEX `idx_invitations_store_email` ON `invitations` (`store_id`,`email`);
--> statement-breakpoint

CREATE UNIQUE INDEX `idx_invitations_token` ON `invitations` (`token`);
--> statement-breakpoint

-- ─── Gift Cards ────────────────────────────────────────────────────────────────

CREATE TABLE `gift_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`code` text NOT NULL,
	`initial_amount_dzd` integer NOT NULL,
	`remaining_amount_dzd` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`recipient_name` text,
	`recipient_phone` text,
	`recipient_email` text,
	`sender_name` text,
	`message` text,
	`expires_at` text,
	`used_at` text,
	`created_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE INDEX `idx_gift_cards_store` ON `gift_cards` (`store_id`);
--> statement-breakpoint

CREATE UNIQUE INDEX `idx_gift_cards_store_code` ON `gift_cards` (`store_id`,`code`);
--> statement-breakpoint

-- ─── Discount Codes ────────────────────────────────────────────────────────────

CREATE TABLE `discount_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`value` integer NOT NULL,
	`min_order_amount` integer,
	`max_uses` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`starts_at` text,
	`expires_at` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE INDEX `idx_discount_codes_store` ON `discount_codes` (`store_id`);
--> statement-breakpoint

CREATE UNIQUE INDEX `idx_discount_codes_store_code` ON `discount_codes` (`store_id`,`code`);
--> statement-breakpoint

-- ─── AI Credits ────────────────────────────────────────────────────────────────

CREATE TABLE `ai_credits` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`total_credits` integer DEFAULT 0 NOT NULL,
	`used_credits` integer DEFAULT 0 NOT NULL,
	`period_start` text,
	`period_end` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE UNIQUE INDEX `idx_ai_credits_store` ON `ai_credits` (`store_id`);
--> statement-breakpoint

-- ─── AI Credit Usage ───────────────────────────────────────────────────────────

CREATE TABLE `ai_credit_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`agent_type` text NOT NULL,
	`operation` text NOT NULL,
	`model` text NOT NULL,
	`credits_used` integer NOT NULL,
	`tokens_in` integer,
	`tokens_out` integer,
	`request_summary` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE INDEX `idx_ai_credit_usage_store` ON `ai_credit_usage` (`store_id`);
--> statement-breakpoint

CREATE INDEX `idx_ai_credit_usage_store_agent` ON `ai_credit_usage` (`store_id`,`agent_type`);
--> statement-breakpoint

-- ─── WhatsApp Messages ─────────────────────────────────────────────────────────

CREATE TABLE `whatsapp_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`order_id` text,
	`customer_id` text,
	`phone_number` text NOT NULL,
	`message_type` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_message` text,
	`sent_at` text,
	`delivered_at` text,
	`read_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE INDEX `idx_whatsapp_messages_store` ON `whatsapp_messages` (`store_id`);
--> statement-breakpoint

CREATE INDEX `idx_whatsapp_messages_store_order` ON `whatsapp_messages` (`store_id`,`order_id`);
--> statement-breakpoint

-- ─── SMS Messages ──────────────────────────────────────────────────────────────

CREATE TABLE `sms_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`order_id` text,
	`customer_id` text,
	`phone_number` text NOT NULL,
	`message_type` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_message` text,
	`sent_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE INDEX `idx_sms_messages_store` ON `sms_messages` (`store_id`);
--> statement-breakpoint

-- ─── Custom Domains ────────────────────────────────────────────────────────────

CREATE TABLE `custom_domains` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`domain` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`ssl_status` text DEFAULT 'pending',
	`verification_token` text,
	`verified_at` text,
	`expires_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE INDEX `idx_custom_domains_store` ON `custom_domains` (`store_id`);
--> statement-breakpoint

CREATE UNIQUE INDEX `idx_custom_domains_domain` ON `custom_domains` (`domain`);
--> statement-breakpoint

-- ─── Provider API Keys (Super Admin managed) ───────────────────────────────────

CREATE TABLE `provider_api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`key_name` text NOT NULL,
	`key_value` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`last_used_at` text,
	`expires_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX `idx_provider_api_keys_provider_name` ON `provider_api_keys` (`provider`,`key_name`);
--> statement-breakpoint

-- ─── Automation Workflows ──────────────────────────────────────────────────────

CREATE TABLE `automation_workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`trigger_type` text NOT NULL,
	`trigger_config` text,
	`actions` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`last_run_at` text,
	`run_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE INDEX `idx_automation_workflows_store` ON `automation_workflows` (`store_id`);
