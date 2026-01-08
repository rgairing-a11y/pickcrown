-- Comprehensive Schema Check for Season Standings Function
-- This will show all columns we need to reference

-- ======================================
-- BRACKET_PICKS TABLE
-- ======================================
SELECT '=== BRACKET_PICKS TABLE ===' as info;
SELECT 
  column_name,
  data_type,
  'bracket_picks' as table_name
FROM information_schema.columns
WHERE table_name = 'bracket_picks'
ORDER BY ordinal_position;

-- ======================================
-- CATEGORY_PICKS TABLE (already confirmed)
-- ======================================
SELECT '=== CATEGORY_PICKS TABLE ===' as info;
SELECT 
  column_name,
  data_type,
  'category_picks' as table_name
FROM information_schema.columns
WHERE table_name = 'category_picks'
ORDER BY ordinal_position;

-- ======================================
-- CATEGORY_OPTIONS TABLE
-- ======================================
SELECT '=== CATEGORY_OPTIONS TABLE ===' as info;
SELECT 
  column_name,
  data_type,
  'category_options' as table_name
FROM information_schema.columns
WHERE table_name = 'category_options'
ORDER BY ordinal_position;

-- ======================================
-- CATEGORIES TABLE
-- ======================================
SELECT '=== CATEGORIES TABLE ===' as info;
SELECT 
  column_name,
  data_type,
  'categories' as table_name
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- ======================================
-- KEY FINDINGS TO REPORT:
-- ======================================
-- 
-- 1. In bracket_picks, look for the points column. It might be:
--    - points
--    - points_earned
--    - score
-- 
-- 2. In category_options, confirm is_correct exists
-- 
-- 3. In categories, confirm points column exists (should be there after our migration)
