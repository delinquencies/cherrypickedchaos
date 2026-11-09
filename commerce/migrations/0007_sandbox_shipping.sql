ALTER TABLE sandbox_checkouts ADD COLUMN shipping_cents INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0);
ALTER TABLE sandbox_checkouts ADD COLUMN shipping_address TEXT;

CREATE UNIQUE INDEX sandbox_square_order ON sandbox_checkouts (square_order_id) WHERE square_order_id IS NOT NULL;
