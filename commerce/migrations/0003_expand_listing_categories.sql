-- SQLite cannot replace a CHECK constraint in place. Copy the existing rows
-- into the expanded schema without changing their category or version.
CREATE TABLE listings_expanded (
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
    'gadgets', 'oddities', 'seasonal', 'glassware', 'handbags-accessories',
    'jewelry', 'sports-collectibles', 'pop-culture-collectibles', 'furniture', 'crafts-sewing'
  ))
);

INSERT INTO listings_expanded (id, title, description, price_cents, status, version, image_mime, image, updated_at, category)
SELECT id, title, description, price_cents, status, version, image_mime, image, updated_at, category FROM listings;

DROP TABLE listings;
ALTER TABLE listings_expanded RENAME TO listings;
CREATE INDEX listings_by_status ON listings (status, updated_at DESC);
