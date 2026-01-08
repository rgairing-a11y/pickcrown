-- Debug Season 404 Issue
-- Season ID: 95efdb9b-e8c1-4797-8d87-8dad48d00826

-- 1. Check if season exists
SELECT 
  id,
  name,
  description,
  created_at,
  updated_at
FROM seasons 
WHERE id = '95efdb9b-e8c1-4797-8d87-8dad48d00826';

-- 2. List all seasons (to verify ID is correct)
SELECT 
  id,
  name,
  description,
  created_at
FROM seasons
ORDER BY created_at DESC;

-- 3. Check events associated with this season
SELECT 
  e.id,
  e.name,
  e.event_date,
  e.status,
  e.season_id
FROM events e
WHERE e.season_id = '95efdb9b-e8c1-4797-8d87-8dad48d00826'
ORDER BY e.event_date;

-- 4. Check if there are any pools for this season's events
SELECT 
  p.id AS pool_id,
  p.name AS pool_name,
  e.name AS event_name,
  e.season_id,
  COUNT(pe.id) AS entry_count
FROM pools p
JOIN events e ON p.event_id = e.id
LEFT JOIN pool_entries pe ON p.id = pe.pool_id
WHERE e.season_id = '95efdb9b-e8c1-4797-8d87-8dad48d00826'
GROUP BY p.id, p.name, e.name, e.season_id
ORDER BY e.event_date;

-- 5. Get season standings (manual calculation to verify data exists)
SELECT 
  pe.email,
  pe.entry_name,
  COUNT(DISTINCT e.id) AS events_entered,
  SUM(
    COALESCE(
      (SELECT SUM(bp.points_earned) FROM bracket_picks bp WHERE bp.pool_entry_id = pe.id),
      0
    ) +
    COALESCE(
      (SELECT SUM(
        CASE 
          WHEN co.is_correct THEN c.points
          ELSE 0
        END
      )
      FROM category_picks cp
      JOIN category_options co ON cp.category_option_id = co.id
      JOIN categories c ON co.category_id = c.id
      WHERE cp.pool_entry_id = pe.id),
      0
    )
  ) AS total_points
FROM pool_entries pe
JOIN pools p ON pe.pool_id = p.id
JOIN events e ON p.event_id = e.id
WHERE e.season_id = '95efdb9b-e8c1-4797-8d87-8dad48d00826'
GROUP BY pe.email, pe.entry_name
ORDER BY total_points DESC, pe.entry_name;

-- 6. If season doesn't exist, create a test season
-- Uncomment to run:
-- INSERT INTO seasons (name, description)
-- VALUES (
--   'Test Season 2026',
--   'A test season for debugging'
-- )
-- RETURNING id, name;
