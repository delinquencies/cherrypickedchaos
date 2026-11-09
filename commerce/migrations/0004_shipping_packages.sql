-- Existing listings remain pickup only until a packed weight and box size are saved.
ALTER TABLE listings ADD COLUMN ship_weight_lb REAL CHECK (ship_weight_lb BETWEEN 0.01 AND 70);
ALTER TABLE listings ADD COLUMN ship_length_in REAL CHECK (ship_length_in BETWEEN 1 AND 108);
ALTER TABLE listings ADD COLUMN ship_width_in REAL CHECK (ship_width_in BETWEEN 1 AND 108);
ALTER TABLE listings ADD COLUMN ship_height_in REAL CHECK (ship_height_in BETWEEN 1 AND 108)
  CHECK (
    (ship_weight_lb IS NULL AND ship_length_in IS NULL AND ship_width_in IS NULL AND ship_height_in IS NULL)
    OR (ship_weight_lb IS NOT NULL AND ship_length_in IS NOT NULL AND ship_width_in IS NOT NULL AND ship_height_in IS NOT NULL
      AND ship_length_in >= max(ship_width_in, ship_height_in)
      AND round(ship_length_in + 2 * (ship_width_in + ship_height_in), 2) <= 130)
  );
