CREATE TABLE live_orders (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL,
  location_id TEXT NOT NULL,
  customer_name TEXT,
  shipping_address TEXT,
  state TEXT NOT NULL DEFAULT 'held' CHECK (state IN ('held', 'creating', 'open', 'paid', 'canceled')),
  expires_at INTEGER NOT NULL,
  square_link_id TEXT,
  square_order_id TEXT UNIQUE,
  square_url TEXT,
  square_payment_id TEXT UNIQUE,
  paid_at TEXT,
  refunded_cents INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX live_orders_one_hold ON live_orders(listing_id) WHERE state IN ('held', 'creating', 'open');
CREATE INDEX live_orders_expiry ON live_orders(expires_at) WHERE state IN ('held', 'creating', 'open');

CREATE TRIGGER protect_held_listing_update BEFORE UPDATE ON listings
WHEN EXISTS (SELECT 1 FROM live_orders WHERE listing_id = OLD.id AND state IN ('held', 'creating', 'open'))
BEGIN SELECT RAISE(ABORT, 'Listing has an active checkout'); END;

CREATE TRIGGER protect_held_listing_delete BEFORE DELETE ON listings
WHEN EXISTS (SELECT 1 FROM live_orders WHERE listing_id = OLD.id AND state IN ('held', 'creating', 'open'))
BEGIN SELECT RAISE(ABORT, 'Listing has an active checkout'); END;

CREATE TRIGGER mark_paid_listing_sold AFTER UPDATE OF state ON live_orders
WHEN OLD.state = 'open' AND NEW.state = 'paid'
BEGIN
  UPDATE listings SET status = 'sold', version = version + 1, updated_at = NEW.paid_at
  WHERE id = NEW.listing_id AND status = 'published';
END;
