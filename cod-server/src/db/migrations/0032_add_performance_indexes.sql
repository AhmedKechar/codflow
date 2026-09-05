-- Phase 4: D1 Performance Indexes
-- Covers critical missing indexes for orders, products, drivers, reviews, and images.
-- Safe to run: CREATE INDEX IF NOT EXISTS prevents duplicates.

-- ═══════════════════════════════════════════════════════════════════════════
-- P0: CRITICAL — every order/product detail page hit
-- ═══════════════════════════════════════════════════════════════════════════

-- Order products by order (every getOrderById, updateOrder, deleteOrder, status change)
CREATE INDEX IF NOT EXISTS idx_order_products_order_id ON order_products (order_id);

-- Order status history by order + time (every order detail, getAllOrders subquery)
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_time ON order_status_history (order_id, timestamp DESC);

-- Product images by product + tenant + position (every product detail, storefront list)
CREATE INDEX IF NOT EXISTS idx_product_images_product_store_position ON product_images (product_id, store_id, position);

-- Driver payments by store + driver + time (zero indexes currently)
CREATE INDEX IF NOT EXISTS idx_driver_payments_store_driver_created ON driver_payments (store_id, driver_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- P1: HIGH IMPACT — variant listing, review stats, customer history
-- ═══════════════════════════════════════════════════════════════════════════

-- Product variants by product + tenant + position (variant listing sorted by position)
CREATE INDEX IF NOT EXISTS idx_product_variants_product_store_position ON product_variants (product_id, store_id, position);

-- Reviews by product + status + time (storefront review stats, review list)
CREATE INDEX IF NOT EXISTS idx_reviews_product_status_created ON reviews (product_id, status, created_at DESC);

-- Orders by customer (customer detail page, customer order history)
CREATE INDEX IF NOT EXISTS idx_orders_store_customer_created ON orders (store_id, customer_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- P2: FILTER OPTIMIZATION — admin list pages, driver queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Orders by driver + status (driver detail, pending settlements)
CREATE INDEX IF NOT EXISTS idx_orders_store_driver_status_created ON orders (store_id, driver_id, status, created_at DESC);

-- Reviews by store + status + time (review admin list, pending count)
CREATE INDEX IF NOT EXISTS idx_reviews_store_status_created ON reviews (store_id, status, created_at DESC);

-- Products with soft-delete awareness (admin product list: WHERE deleted_at IS NULL + status)
CREATE INDEX IF NOT EXISTS idx_products_store_deleted_status ON products (store_id, deleted_at, status, created_at DESC);

-- Customers by wilaya (customer list filter)
CREATE INDEX IF NOT EXISTS idx_customers_store_wilaya ON customers (store_id, wilaya_id);

-- Driver compensations by store + driver (compensation stats, driver list)
CREATE INDEX IF NOT EXISTS idx_driver_compensations_store_driver ON driver_compensations (store_id, driver_id);

-- Driver compensations by store + wilaya (driver list filtered by wilaya)
CREATE INDEX IF NOT EXISTS idx_driver_compensations_store_wilaya ON driver_compensations (store_id, wilaya_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- P3: OPTIMIZATION — defensive, edge-case queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Drivers by phone (duplicate check on create/update)
CREATE INDEX IF NOT EXISTS idx_drivers_store_phone ON drivers (store_id, phone);

-- Stock movements with variant support (stock history with optional variant filter)
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_variant ON stock_movements (store_id, product_id, variant_id, created_at DESC);

-- Activity logs by actor (user activity log page)
CREATE INDEX IF NOT EXISTS idx_activity_logs_store_actor ON activity_logs (store_id, actor_id, created_at DESC);

-- Communes by wilaya (commune lookup by wilaya — small table but frequently JOINed)
CREATE INDEX IF NOT EXISTS idx_communes_wilaya ON communes (wilaya_id);

-- Storefront product listing (full WHERE + ORDER BY coverage for store catalog)
CREATE INDEX IF NOT EXISTS idx_products_storefront ON products (store_id, show_in_store, status, visibility, store_featured, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP: Drop redundant subset index (saves write overhead + storage)
-- ═══════════════════════════════════════════════════════════════════════════

-- idx_orders_store_status is a strict subset of idx_orders_store_status_created.
-- The 3-column index serves all queries that use the 2-column index.
DROP INDEX IF EXISTS idx_orders_store_status;
