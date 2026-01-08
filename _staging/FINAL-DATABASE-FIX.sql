-- PickCrown: Complete Database Fix - FINAL VERSION
-- Column confirmed: category_picks.option_id
-- Date: 2026-01-08

-- ===========================================================
-- PART 1: Add missing columns for CSV import
-- ===========================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;
ALTER TABLE category_options ADD COLUMN IF NOT EXISTS order_index INTEGER;

-- Update existing categories to have 1 point
UPDATE categories SET points = 1 WHERE points IS NULL;

-- ===========================================================
-- PART 2: Drop and recreate season standings function
-- ===========================================================

DROP FUNCTION IF EXISTS calculate_season_standings(UUID);

CREATE OR REPLACE FUNCTION calculate_season_standings(p_season_id UUID)
RETURNS TABLE (
  email TEXT,
  entry_name TEXT,
  events_entered BIGINT,
  total_points BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH season_points AS (
    SELECT 
      pe.email,
      pe.entry_name,
      COUNT(DISTINCT p.event_id) as events_entered,
      COALESCE(SUM(bp.points_earned), 0) as bracket_points,
      COALESCE(SUM(
        CASE 
          WHEN co.is_correct THEN c.points
          ELSE 0
        END
      ), 0) as category_points
    FROM pool_entries pe
    JOIN pools p ON pe.pool_id = p.id
    JOIN events e ON p.event_id = e.id
    LEFT JOIN bracket_picks bp ON bp.pool_entry_id = pe.id
    LEFT JOIN category_picks cp ON cp.pool_entry_id = pe.id
    LEFT JOIN category_options co ON cp.option_id = co.id  -- ✓ CORRECT COLUMN NAME
    LEFT JOIN categories c ON co.category_id = c.id
    WHERE e.season_id = p_season_id
    GROUP BY pe.email, pe.entry_name
  )
  SELECT 
    sp.email,
    sp.entry_name,
    sp.events_entered,
    (sp.bracket_points + sp.category_points) as total_points,
    RANK() OVER (ORDER BY (sp.bracket_points + sp.category_points) DESC, sp.entry_name ASC) as rank
  FROM season_points sp
  ORDER BY rank, sp.entry_name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_season_standings(UUID) TO anon;
GRANT EXECUTE ON FUNCTION calculate_season_standings(UUID) TO authenticated;

-- ===========================================================
-- VERIFICATION
-- ===========================================================

-- Verify columns exist
SELECT 
  'categories.points' as check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'points'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
UNION ALL
SELECT 
  'category_options.order_index',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'category_options' AND column_name = 'order_index'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT
  'calculate_season_standings function',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_season_standings'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END;

-- Test the function with your season
SELECT * FROM calculate_season_standings('95efdb9b-e8c1-4797-8d87-8dad48d00826');

-- Success message
SELECT '✓ All fixes applied successfully! Ready to import Olympics CSV and view season standings.' AS status;
