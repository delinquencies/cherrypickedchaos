ALTER TABLE live_orders ADD COLUMN shipping_package TEXT;
ALTER TABLE live_orders ADD COLUMN shippo_state TEXT CHECK (shippo_state IN ('sending', 'sent', 'review'));
ALTER TABLE live_orders ADD COLUMN shippo_order_id TEXT;
ALTER TABLE live_orders ADD COLUMN alert_attempt_at INTEGER;
ALTER TABLE live_orders ADD COLUMN alert_sent_at INTEGER;
