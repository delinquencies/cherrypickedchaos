-- Expand the category check while retaining every listing and its shipping settings.
CREATE TABLE listings_with_gifts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 2000),
  price_cents INTEGER NOT NULL CHECK (price_cents BETWEEN 1 AND 9999999),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  image_mime TEXT NOT NULL CHECK (image_mime IN ('image/jpeg', 'image/png', 'image/webp')),
  image BLOB NOT NULL CHECK (length(image) BETWEEN 1 AND 1000000),
  updated_at TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN (
    'wear', 'stoneware', 'primitives', 'americana', 'other',
    'vintage-clothes', 'records', 'ephemera', 'toys', 'kitchenware',
    'gadgets', 'gifts', 'oddities', 'seasonal', 'glassware', 'handbags-accessories',
    'jewelry', 'sports-collectibles', 'pop-culture-collectibles', 'furniture', 'crafts-sewing'
  )),
  ship_weight_lb REAL CHECK (ship_weight_lb BETWEEN 0.01 AND 70),
  ship_length_in REAL CHECK (ship_length_in BETWEEN 1 AND 108),
  ship_width_in REAL CHECK (ship_width_in BETWEEN 1 AND 108),
  ship_height_in REAL CHECK (ship_height_in BETWEEN 1 AND 108),
  CHECK (
    (ship_weight_lb IS NULL AND ship_length_in IS NULL AND ship_width_in IS NULL AND ship_height_in IS NULL)
    OR (ship_weight_lb IS NOT NULL AND ship_length_in IS NOT NULL AND ship_width_in IS NOT NULL AND ship_height_in IS NOT NULL
      AND ship_length_in >= max(ship_width_in, ship_height_in)
      AND round(ship_length_in + 2 * (ship_width_in + ship_height_in), 2) <= 130)
  )
);

INSERT INTO listings_with_gifts (
  id, title, description, price_cents, status, version, image_mime, image, updated_at, category,
  ship_weight_lb, ship_length_in, ship_width_in, ship_height_in
)
SELECT id, title, description, price_cents, status, version, image_mime, image, updated_at, category,
  ship_weight_lb, ship_length_in, ship_width_in, ship_height_in
FROM listings;

DROP TABLE listings;
ALTER TABLE listings_with_gifts RENAME TO listings;
CREATE INDEX listings_by_status ON listings (status, updated_at DESC);
