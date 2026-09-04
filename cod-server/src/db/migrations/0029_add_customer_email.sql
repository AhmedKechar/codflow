ALTER TABLE customers ADD COLUMN email TEXT;

CREATE UNIQUE INDEX idx_customers_email_per_store
ON customers (store_id, email)
WHERE email IS NOT NULL AND email != '';
