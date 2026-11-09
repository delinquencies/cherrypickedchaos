ALTER TABLE listings ADD COLUMN category TEXT NOT NULL DEFAULT 'other'
  CHECK (category IN ('wear', 'stoneware', 'primitives', 'americana', 'other'));
