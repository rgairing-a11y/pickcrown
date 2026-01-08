-- Migration: Add order_index column to category_options table
-- Date: 2026-01-08
-- Purpose: Support ordering of options in pick-one categories

-- Add order_index column with default value
ALTER TABLE category_options 
ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Add check constraint to ensure order_index is non-negative
ALTER TABLE category_options 
ADD CONSTRAINT category_options_order_index_non_negative 
CHECK (order_index >= 0);

-- Add comment for documentation
COMMENT ON COLUMN category_options.order_index IS 
  'Display order for this option within its category. Lower numbers appear first.';

-- Update existing rows to have sequential order_index values
-- This groups by category_id and assigns order based on existing order (by id or created_at)
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

-- Verify the migration
SELECT 
  co.id,
  c.question AS category,
  co.option_text,
  co.order_index
FROM category_options co
JOIN categories c ON co.category_id = c.id
ORDER BY c.question, co.order_index;
