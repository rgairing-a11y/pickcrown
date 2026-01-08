-- PickCrown: Fix CSV Import - Add Missing Columns
-- Run this entire file in Supabase SQL Editor
-- Date: 2026-01-08

-- ===========================================================
-- MIGRATION 1: Add points column to categories
-- ===========================================================

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;

ALTER TABLE categories 
ADD CONSTRAINT categories_points_positive 
CHECK (points > 0);

COMMENT ON COLUMN categories.points IS 
  'Point value awarded for correctly picking this category. Default is 1 point.';

-- Update existing categories to have 1 point
UPDATE categories 
SET points = 1 
WHERE points IS NULL;


-- ===========================================================
-- MIGRATION 2: Add order_index column to category_options
-- ===========================================================

ALTER TABLE category_options 
ADD COLUMN IF NOT EXISTS order_index INTEGER;

ALTER TABLE category_options 
ADD CONSTRAINT category_options_order_index_non_negative 
CHECK (order_index >= 0);

COMMENT ON COLUMN category_options.order_index IS 
  'Display order for this option within its category. Lower numbers appear first.';

-- Update existing options to have sequential order
WITH numbered_options AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY id) - 1 AS new_order
  FROM category_options
  WHERE order_index IS NULL
)
UPDATE category_options co
SET order_index = no.new_order
FROM numbered_options no
WHERE co.id = no.id;


-- ===========================================================
-- VERIFICATION QUERIES
-- ===========================================================

-- Check categories table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND column_name IN ('points', 'question', 'event_id')
ORDER BY column_name;

-- Check category_options table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'category_options' 
AND column_name IN ('order_index', 'option_text', 'category_id')
ORDER BY column_name;

-- If you have existing categories, verify they have points
SELECT 
  id,
  question,
  points,
  (SELECT COUNT(*) FROM category_options WHERE category_id = categories.id) as option_count
FROM categories
ORDER BY created_at DESC
LIMIT 10;

-- Success message
SELECT 'Migrations completed successfully! You can now import your CSV.' AS status;
