CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 2000),
  price_cents INTEGER NOT NULL CHECK (price_cents BETWEEN 1 AND 9999999),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  image_mime TEXT NOT NULL CHECK (image_mime IN ('image/jpeg', 'image/png', 'image/webp')),
  image BLOB NOT NULL CHECK (length(image) BETWEEN 1 AND 1000000),
  updated_at TEXT NOT NULL
);

CREATE INDEX listings_by_status ON listings (status, updated_at DESC);
