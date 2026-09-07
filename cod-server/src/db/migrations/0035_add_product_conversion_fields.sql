-- Migration 0035: Add conversion tracking and popup config to products
-- order_count: total orders placed for this product
-- view_count: total page views for this product
-- popup_config: JSON for urgency popup (discount, delay, expiry)

ALTER TABLE products ADD COLUMN order_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN popup_config TEXT;
