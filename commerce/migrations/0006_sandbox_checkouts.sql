CREATE TABLE sandbox_checkouts (
  id TEXT PRIMARY KEY,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  tax_bps INTEGER NOT NULL,
  location_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved', 'creating', 'open', 'paid', 'canceled')),
  square_link_id TEXT,
  square_order_id TEXT,
  square_url TEXT,
  total_cents INTEGER
);

CREATE UNIQUE INDEX sandbox_one_checkout_per_find
  ON sandbox_checkouts (item_key) WHERE state <> 'canceled';
