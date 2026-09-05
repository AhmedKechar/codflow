-- Migration 0034: Add ON DELETE CASCADE to critical foreign keys
-- Prevents orphaned rows when parent records are deleted

-- Orders → customers: SET NULL on delete (keep order history)
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Orders → drivers: SET NULL on delete (keep order history)
ALTER TABLE orders ADD CONSTRAINT fk_orders_driver
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

-- Orders → delivery_companies: SET NULL on delete
ALTER TABLE orders ADD CONSTRAINT fk_orders_company
  FOREIGN KEY (company_id) REFERENCES delivery_companies(id) ON DELETE SET NULL;

-- Order products → orders: CASCADE on delete
ALTER TABLE order_products ADD CONSTRAINT fk_order_products_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Order products → products: RESTRICT (prevent deleting products with orders)
ALTER TABLE order_products ADD CONSTRAINT fk_order_products_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- Order products → product_variants: RESTRICT (prevent deleting variants with orders)
ALTER TABLE order_products ADD CONSTRAINT fk_order_products_variant
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT;

-- Company shipments → delivery_companies: CASCADE
ALTER TABLE company_shipments ADD CONSTRAINT fk_shipments_company
  FOREIGN KEY (company_id) REFERENCES delivery_companies(id) ON DELETE CASCADE;

-- Company shipments → orders: CASCADE
ALTER TABLE company_shipments ADD CONSTRAINT fk_shipments_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Carrier tracking → orders: CASCADE
ALTER TABLE carrier_tracking ADD CONSTRAINT fk_tracking_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Carrier tracking → delivery_companies: CASCADE
ALTER TABLE carrier_tracking ADD CONSTRAINT fk_tracking_company
  FOREIGN KEY (company_id) REFERENCES delivery_companies(id) ON DELETE CASCADE;

-- Webhook events → orders: CASCADE
ALTER TABLE webhook_events ADD CONSTRAINT fk_webhooks_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Webhook events → delivery_companies: CASCADE
ALTER TABLE webhook_events ADD CONSTRAINT fk_webhooks_company
  FOREIGN KEY (company_id) REFERENCES delivery_companies(id) ON DELETE CASCADE;

-- Order status history → orders: CASCADE
ALTER TABLE order_status_history ADD CONSTRAINT fk_history_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Stock movements → orders (via reference): SET NULL (reference is nullable)
-- No FK constraint needed — reference is a generic string ID

-- Reviews → orders: CASCADE
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Driver compensations → drivers: CASCADE
ALTER TABLE driver_compensations ADD CONSTRAINT fk_compensations_driver
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;

-- Driver compensations → orders (via order_ids JSON): No direct FK
-- Driver wilayas → drivers: CASCADE
ALTER TABLE driver_wilayas ADD CONSTRAINT fk_driver_wilayas_driver
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;

-- Store members → users: CASCADE
ALTER TABLE store_members ADD CONSTRAINT fk_members_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Store members → stores: CASCADE
ALTER TABLE store_members ADD CONSTRAINT fk_members_store
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- User scopes → users: CASCADE
ALTER TABLE user_scopes ADD CONSTRAINT fk_scopes_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- WhatsApp messages → orders: CASCADE
ALTER TABLE whatsapp_messages ADD CONSTRAINT fk_whatsapp_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- WhatsApp messages → customers: CASCADE
ALTER TABLE whatsapp_messages ADD CONSTRAINT fk_whatsapp_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- SMS messages → orders: CASCADE
ALTER TABLE sms_messages ADD CONSTRAINT fk_sms_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- SMS messages → customers: CASCADE
ALTER TABLE sms_messages ADD CONSTRAINT fk_sms_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Company API logs → orders: CASCADE
ALTER TABLE company_api_logs ADD CONSTRAINT fk_apilogs_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Company API logs → delivery_companies: CASCADE
ALTER TABLE company_api_logs ADD CONSTRAINT fk_apilogs_company
  FOREIGN KEY (company_id) REFERENCES delivery_companies(id) ON DELETE CASCADE;
