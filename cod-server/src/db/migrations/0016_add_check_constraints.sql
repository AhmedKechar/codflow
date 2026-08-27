-- Migration 0016: Add CHECK constraints for data integrity
-- Enforce business rules at the database level

-- ─── Orders Domain ──────────────────────────────────────────────────────────────

-- Orders must have positive price
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_price` CHECK (`price` >= 0);
--> statement-breakpoint

-- Orders must have positive delivery fee
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_delivery_fee` CHECK (`delivery_fee` >= 0);
--> statement-breakpoint

-- Orders must have positive driver fee
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_driver_fee` CHECK (`driver_fee` >= 0);
--> statement-breakpoint

-- Orders must have positive COD amount
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_cod_amount` CHECK (`cod_amount` >= 0);
--> statement-breakpoint

-- Order status must be valid
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_status` CHECK (`status` IN ('new', 'confirmed', 'unreachable', 'preparing', 'ready', 'assigned', 'dispatched', 'out_for_delivery', 'delivered', 'returned', 'cancelled'));
--> statement-breakpoint

-- Order type must be valid
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_order_type` CHECK (`order_type` IN ('online', 'offline'));
--> statement-breakpoint

-- Delivery method must be valid
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_delivery_method` CHECK (`delivery_method` IN ('unassigned', 'driver', 'company'));
--> statement-breakpoint

-- Delivery type must be valid
ALTER TABLE `orders` ADD CONSTRAINT `chk_orders_delivery_type` CHECK (`delivery_type` IN ('home', 'stop_desk'));
--> statement-breakpoint

-- ─── Order Products ─────────────────────────────────────────────────────────────

-- Order products must have positive quantity
ALTER TABLE `order_products` ADD CONSTRAINT `chk_order_products_qty` CHECK (`quantity` > 0);
--> statement-breakpoint

-- Order products must have positive price
ALTER TABLE `order_products` ADD CONSTRAINT `chk_order_products_price` CHECK (`price_per_unit` >= 0);
--> statement-breakpoint

-- Order products must have positive line total
ALTER TABLE `order_products` ADD CONSTRAINT `chk_order_products_line_total` CHECK (`line_total` >= 0);
--> statement-breakpoint

-- Order products status must be valid
ALTER TABLE `order_products` ADD CONSTRAINT `chk_order_products_status` CHECK (`status` IN ('fulfilled', 'partially_returned', 'returned'));
--> statement-breakpoint

-- ─── Products Domain ────────────────────────────────────────────────────────────

-- Products must have positive price
ALTER TABLE `products` ADD CONSTRAINT `chk_products_price` CHECK (`price` >= 0);
--> statement-breakpoint

-- Products must have non-negative inventory
ALTER TABLE `products` ADD CONSTRAINT `chk_products_inventory` CHECK (`inventory` >= 0);
--> statement-breakpoint

-- Products status must be valid
ALTER TABLE `products` ADD CONSTRAINT `chk_products_status` CHECK (`status` IN ('DRAFT', 'ACTIVE', 'ARCHIVED'));
--> statement-breakpoint

-- Product type must be valid
ALTER TABLE `products` ADD CONSTRAINT `chk_products_type` CHECK (`type` IN ('PHYSICAL', 'DIGITAL'));
--> statement-breakpoint

-- ─── Product Variants ───────────────────────────────────────────────────────────

-- Variants must have positive price
ALTER TABLE `product_variants` ADD CONSTRAINT `chk_variants_price` CHECK (`price` >= 0);
--> statement-breakpoint

-- Variants must have non-negative inventory
ALTER TABLE `product_variants` ADD CONSTRAINT `chk_variants_inventory` CHECK (`inventory` >= 0);
--> statement-breakpoint

-- ─── Customers Domain ───────────────────────────────────────────────────────────

-- Customers must have non-negative totals
ALTER TABLE `customers` ADD CONSTRAINT `chk_customers_total_orders` CHECK (`total_orders` >= 0);
ALTER TABLE `customers` ADD CONSTRAINT `chk_customers_total_spent` CHECK (`total_spent` >= 0);
--> statement-breakpoint

-- ─── Drivers Domain ─────────────────────────────────────────────────────────────

-- Drivers must have non-negative totals
ALTER TABLE `drivers` ADD CONSTRAINT `chk_drivers_total_delivered` CHECK (`total_delivered` >= 0);
ALTER TABLE `drivers` ADD CONSTRAINT `chk_drivers_total_earnings` CHECK (`total_earnings` >= 0);
ALTER TABLE `drivers` ADD CONSTRAINT `chk_drivers_pending_cash` CHECK (`pending_cash` >= 0);
ALTER TABLE `drivers` ADD CONSTRAINT `chk_drivers_total_paid` CHECK (`total_paid` >= 0);
--> statement-breakpoint

-- Driver status must be valid
ALTER TABLE `drivers` ADD CONSTRAINT `chk_drivers_status` CHECK (`status` IN ('available', 'busy', 'inactive'));
--> statement-breakpoint

-- ─── Driver Compensations ───────────────────────────────────────────────────────

-- Compensation fee must be non-negative
ALTER TABLE `driver_compensations` ADD CONSTRAINT `chk_compensations_fee` CHECK (`fee_per_delivery` >= 0);
--> statement-breakpoint

-- ─── Driver Payments ────────────────────────────────────────────────────────────

-- Payment amount must be positive
ALTER TABLE `driver_payments` ADD CONSTRAINT `chk_payments_amount` CHECK (`amount` >= 0);
ALTER TABLE `driver_payments` ADD CONSTRAINT `chk_payments_order_count` CHECK (`order_count` >= 0);
--> statement-breakpoint

-- Payment type must be valid
ALTER TABLE `driver_payments` ADD CONSTRAINT `chk_payments_type` CHECK (`type` IN ('cod_remittance', 'fee_payment', 'net_settlement'));
--> statement-breakpoint

-- ─── Shipping Domain ────────────────────────────────────────────────────────────

-- Shipping prices must be non-negative
ALTER TABLE `shipping_rules` ADD CONSTRAINT `chk_shipping_home_price` CHECK (`home_price` >= 0);
ALTER TABLE `shipping_rules` ADD CONSTRAINT `chk_shipping_stop_desk_price` CHECK (`stop_desk_price` >= 0);
--> statement-breakpoint

-- ─── Reviews ────────────────────────────────────────────────────────────────────

-- Review rating must be 1-5
ALTER TABLE `reviews` ADD CONSTRAINT `chk_reviews_rating` CHECK (`rating` >= 1 AND `rating` <= 5);
--> statement-breakpoint

-- Review status must be valid
ALTER TABLE `reviews` ADD CONSTRAINT `chk_reviews_status` CHECK (`status` IN ('pending', 'approved', 'rejected'));
--> statement-breakpoint

-- ─── Offers Domain ──────────────────────────────────────────────────────────────

-- Offer trigger quantity must be positive
ALTER TABLE `offers` ADD CONSTRAINT `chk_offers_trigger_qty` CHECK (`trigger_quantity` > 0);
--> statement-breakpoint

-- Offer reward quantity must be positive
ALTER TABLE `offers` ADD CONSTRAINT `chk_offers_reward_qty` CHECK (`reward_quantity` > 0);
--> statement-breakpoint

-- Offer discount type must be valid
ALTER TABLE `offers` ADD CONSTRAINT `chk_offers_discount_type` CHECK (`discount_type` IN ('free', 'free_shipping'));
--> statement-breakpoint

-- Offer status must be valid
ALTER TABLE `offers` ADD CONSTRAINT `chk_offers_status` CHECK (`status` IN ('active', 'inactive'));
--> statement-breakpoint

-- ─── Stock Movements ────────────────────────────────────────────────────────────

-- Stock movement delta must be non-zero
ALTER TABLE `stock_movements` ADD CONSTRAINT `chk_stock_delta` CHECK (`delta` != 0);
--> statement-breakpoint

-- Stock movement type must be valid
ALTER TABLE `stock_movements` ADD CONSTRAINT `chk_stock_type` CHECK (`type` IN ('PURCHASE', 'ADJUSTMENT_ADD', 'ADJUSTMENT_REMOVE', 'ORDER_DEDUCTED', 'ORDER_CANCELLED', 'ORDER_RETURNED', 'OFFLINE_SALE'));
--> statement-breakpoint

-- ─── New SaaS Tables ────────────────────────────────────────────────────────────

-- Subscription status must be valid
ALTER TABLE `subscriptions` ADD CONSTRAINT `chk_subscriptions_status` CHECK (`status` IN ('trialing', 'active', 'past_due', 'canceled', 'expired'));
--> statement-breakpoint

-- Payment amount must be positive
ALTER TABLE `payments` ADD CONSTRAINT `chk_payments_amount_dzd` CHECK (`amount_dzd` > 0);
--> statement-breakpoint

-- Payment method must be valid
ALTER TABLE `payments` ADD CONSTRAINT `chk_payments_method` CHECK (`payment_method` IN ('ccp', 'baridi_mob', 'wise', 'redotpay'));
--> statement-breakpoint

-- Payment status must be valid
ALTER TABLE `payments` ADD CONSTRAINT `chk_payments_review_status` CHECK (`status` IN ('pending', 'approved', 'rejected'));
--> statement-breakpoint

-- Store member role must be valid
ALTER TABLE `store_members` ADD CONSTRAINT `chk_store_members_role` CHECK (`role` IN ('owner', 'admin', 'staff'));
--> statement-breakpoint

-- Store member status must be valid
ALTER TABLE `store_members` ADD CONSTRAINT `chk_store_members_status` CHECK (`status` IN ('active', 'inactive', 'invited'));
--> statement-breakpoint

-- Gift card amounts must be positive
ALTER TABLE `gift_cards` ADD CONSTRAINT `chk_gift_cards_initial_amount` CHECK (`initial_amount_dzd` > 0);
ALTER TABLE `gift_cards` ADD CONSTRAINT `chk_gift_cards_remaining_amount` CHECK (`remaining_amount_dzd` >= 0);
--> statement-breakpoint

-- Gift card status must be valid
ALTER TABLE `gift_cards` ADD CONSTRAINT `chk_gift_cards_status` CHECK (`status` IN ('active', 'used', 'expired', 'disabled'));
--> statement-breakpoint

-- Discount code type must be valid
ALTER TABLE `discount_codes` ADD CONSTRAINT `chk_discount_codes_type` CHECK (`type` IN ('percentage', 'fixed'));
--> statement-breakpoint

-- Discount code value must be positive
ALTER TABLE `discount_codes` ADD CONSTRAINT `chk_discount_codes_value` CHECK (`value` > 0);
--> statement-breakpoint

-- Discount code status must be valid
ALTER TABLE `discount_codes` ADD CONSTRAINT `chk_discount_codes_status` CHECK (`status` IN ('active', 'inactive', 'expired'));
--> statement-breakpoint

-- AI credits must be non-negative
ALTER TABLE `ai_credits` ADD CONSTRAINT `chk_ai_credits_total` CHECK (`total_credits` >= 0);
ALTER TABLE `ai_credits` ADD CONSTRAINT `chk_ai_credits_used` CHECK (`used_credits` >= 0);
--> statement-breakpoint

-- AI credit usage must be positive
ALTER TABLE `ai_credit_usage` ADD CONSTRAINT `chk_ai_credit_usage_credits` CHECK (`credits_used` > 0);
--> statement-breakpoint

-- AI agent type must be valid
ALTER TABLE `ai_credit_usage` ADD CONSTRAINT `chk_ai_credit_usage_agent` CHECK (`agent_type` IN ('marketing', 'finance', 'design', 'branding', 'product'));
--> statement-breakpoint

-- WhatsApp message type must be valid
ALTER TABLE `whatsapp_messages` ADD CONSTRAINT `chk_whatsapp_type` CHECK (`message_type` IN ('order_update', 'marketing', 'support', 'automated'));
--> statement-breakpoint

-- WhatsApp status must be valid
ALTER TABLE `whatsapp_messages` ADD CONSTRAINT `chk_whatsapp_status` CHECK (`status` IN ('pending', 'sent', 'delivered', 'read', 'failed'));
--> statement-breakpoint

-- SMS message type must be valid
ALTER TABLE `sms_messages` ADD CONSTRAINT `chk_sms_type` CHECK (`message_type` IN ('order_update', 'marketing', 'support', 'automated'));
--> statement-breakpoint

-- SMS status must be valid
ALTER TABLE `sms_messages` ADD CONSTRAINT `chk_sms_status` CHECK (`status` IN ('pending', 'sent', 'delivered', 'failed'));
--> statement-breakpoint

-- Custom domain status must be valid
ALTER TABLE `custom_domains` ADD CONSTRAINT `chk_custom_domains_status` CHECK (`status` IN ('pending', 'verifying', 'active', 'failed', 'expired'));
--> statement-breakpoint

-- Custom domain SSL status must be valid
ALTER TABLE `custom_domains` ADD CONSTRAINT `chk_custom_domains_ssl` CHECK (`ssl_status` IN ('pending', 'active', 'failed'));
--> statement-breakpoint

-- Automation workflow trigger type must be valid
ALTER TABLE `automation_workflows` ADD CONSTRAINT `chk_automation_trigger` CHECK (`trigger_type` IN ('order_created', 'order_status_changed', 'abandoned_cart', 'customer_signup', 'custom'));
--> statement-breakpoint

-- Plan price must be non-negative
ALTER TABLE `plans` ADD CONSTRAINT `chk_plans_price` CHECK (`price_dzd` >= 0);
--> statement-breakpoint

-- Plan limits must be non-negative (or -1 for unlimited)
ALTER TABLE `plans` ADD CONSTRAINT `chk_plans_max_orders` CHECK (`max_orders` >= -1);
ALTER TABLE `plans` ADD CONSTRAINT `chk_plans_max_products` CHECK (`max_products` >= -1);
ALTER TABLE `plans` ADD CONSTRAINT `chk_plans_max_drivers` CHECK (`max_drivers` >= -1);
ALTER TABLE `plans` ADD CONSTRAINT `chk_plans_max_customers` CHECK (`max_customers` >= -1);
ALTER TABLE `plans` ADD CONSTRAINT `chk_plans_max_team_members` CHECK (`max_team_members` >= -1);
ALTER TABLE `plans` ADD CONSTRAINT `chk_plans_max_ai_credits` CHECK (`max_ai_credits` >= 0);
