-- NFL Playoff Event Setup - 2025-2026 Season
-- Run this in Supabase SQL Editor after running the schema migration (001-schema-migration.sql)

-- ====================
-- COMPLETE SETUP SCRIPT (with actual IDs)
-- ====================
-- This version generates all IDs in one transaction

DO $$
DECLARE
  v_event_id UUID;
  v_wc_round_id UUID;
  v_div_round_id UUID;
  v_conf_round_id UUID;
  v_sb_round_id UUID;
  -- AFC teams
  v_broncos_id UUID;      -- #1 BYE
  v_patriots_id UUID;     -- #2
  v_jaguars_id UUID;      -- #3
  v_steelers_id UUID;     -- #4
  v_bills_id UUID;        -- #5
  v_texans_id UUID;       -- #6
  v_chargers_id UUID;     -- #7
  -- NFC teams
  v_seahawks_id UUID;     -- #1 BYE
  v_bears_id UUID;        -- #2
  v_eagles_id UUID;       -- #3
  v_panthers_id UUID;     -- #4
  v_rams_id UUID;         -- #5
  v_niners_id UUID;       -- #6
  -- v_nfc7_id UUID;      -- #7 - MISSING - Need to add when known
BEGIN
  -- Create event
  INSERT INTO events (name, year, event_type, start_time, status, uses_reseeding)
  VALUES ('NFL Playoffs', 2026, 'bracket', '2026-01-10 16:30:00-05', 'open', TRUE)
  RETURNING id INTO v_event_id;
  
  RAISE NOTICE 'Created event: %', v_event_id;

  -- Create rounds
  INSERT INTO rounds (event_id, name, round_order, points) 
  VALUES (v_event_id, 'Wild Card', 1, 3) RETURNING id INTO v_wc_round_id;
  
  INSERT INTO rounds (event_id, name, round_order, points) 
  VALUES (v_event_id, 'Divisional', 2, 5) RETURNING id INTO v_div_round_id;
  
  INSERT INTO rounds (event_id, name, round_order, points) 
  VALUES (v_event_id, 'Conference Championship', 3, 8) RETURNING id INTO v_conf_round_id;
  
  INSERT INTO rounds (event_id, name, round_order, points) 
  VALUES (v_event_id, 'Super Bowl', 4, 13) RETURNING id INTO v_sb_round_id;

  -- ==================
  -- AFC TEAMS
  -- ==================
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Denver Broncos', 1, 'AFC', TRUE) RETURNING id INTO v_broncos_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'New England Patriots', 2, 'AFC', FALSE) RETURNING id INTO v_patriots_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Jacksonville Jaguars', 3, 'AFC', FALSE) RETURNING id INTO v_jaguars_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Pittsburgh Steelers', 4, 'AFC', FALSE) RETURNING id INTO v_steelers_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Buffalo Bills', 5, 'AFC', FALSE) RETURNING id INTO v_bills_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Houston Texans', 6, 'AFC', FALSE) RETURNING id INTO v_texans_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Los Angeles Chargers', 7, 'AFC', FALSE) RETURNING id INTO v_chargers_id;

  -- ==================
  -- NFC TEAMS
  -- ==================
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Seattle Seahawks', 1, 'NFC', TRUE) RETURNING id INTO v_seahawks_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Chicago Bears', 2, 'NFC', FALSE) RETURNING id INTO v_bears_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Philadelphia Eagles', 3, 'NFC', FALSE) RETURNING id INTO v_eagles_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Carolina Panthers', 4, 'NFC', FALSE) RETURNING id INTO v_panthers_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Los Angeles Rams', 5, 'NFC', FALSE) RETURNING id INTO v_rams_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'San Francisco 49ers', 6, 'NFC', FALSE) RETURNING id INTO v_niners_id;

  -- ⚠️ NFC #7 SEED MISSING - Add when known:
  -- INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  -- VALUES (v_event_id, 'TBD Team', 7, 'NFC', FALSE) RETURNING id INTO v_nfc7_id;

  -- ==================
  -- AFC WILD CARD MATCHUPS
  -- ==================
  -- #2 Patriots vs #7 Chargers
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 1, v_patriots_id, v_chargers_id);
  
  -- #3 Jaguars vs #6 Texans
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 2, v_jaguars_id, v_texans_id);
  
  -- #4 Steelers vs #5 Bills
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 3, v_steelers_id, v_bills_id);

  -- ==================
  -- NFC WILD CARD MATCHUPS
  -- ==================
  -- ⚠️ INCOMPLETE - Need NFC #7 seed to complete
  -- Once #7 is added, uncomment and update:
  
  -- #2 Bears vs #7 [TBD]
  -- INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  -- VALUES (v_event_id, v_wc_round_id, 4, v_bears_id, v_nfc7_id);
  
  -- #3 Eagles vs #6 49ers
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 5, v_eagles_id, v_niners_id);
  
  -- #4 Panthers vs #5 Rams
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 6, v_panthers_id, v_rams_id);

  -- ==================
  -- CREATE POOL
  -- ==================
  INSERT INTO pools (name, event_id, owner_email, status)
  VALUES ('NFL Playoff Pool 2026', v_event_id, 'your@email.com', 'active');

  RAISE NOTICE 'Setup complete! Event ID: %', v_event_id;
  RAISE NOTICE '⚠️ WARNING: NFC #7 seed is missing. Add team and Bears vs #7 matchup when known.';
END $$;

-- ==================
-- VERIFY SETUP
-- ==================
SELECT 'Event' as item, id, name, year, uses_reseeding 
FROM events WHERE name = 'NFL Playoffs' AND year = 2026;

SELECT 'Rounds' as item, name, round_order, points 
FROM rounds r 
JOIN events e ON r.event_id = e.id 
WHERE e.name = 'NFL Playoffs' AND e.year = 2026
ORDER BY round_order;

SELECT 'Teams' as item, conference, seed, name, has_bye 
FROM teams t 
JOIN events e ON t.event_id = e.id 
WHERE e.name = 'NFL Playoffs' AND e.year = 2026
ORDER BY conference, seed;

SELECT 'Matchups' as item, 
  ta.name as team_a, 
  tb.name as team_b,
  r.name as round
FROM matchups m 
JOIN events e ON m.event_id = e.id 
JOIN teams ta ON m.team_a_id = ta.id
JOIN teams tb ON m.team_b_id = tb.id
JOIN rounds r ON m.round_id = r.id
WHERE e.name = 'NFL Playoffs' AND e.year = 2026;

-- ==================
-- TO ADD NFC #7 LATER:
-- ==================
-- 1. Get event ID:
--    SELECT id FROM events WHERE name = 'NFL Playoffs' AND year = 2026;
--
-- 2. Add the team (replace EVENT_ID and TEAM_NAME):
--    INSERT INTO teams (event_id, name, seed, conference, has_bye) 
--    VALUES ('EVENT_ID', 'TEAM_NAME', 7, 'NFC', FALSE);
--
-- 3. Get the new team ID and Bears ID:
--    SELECT id, name FROM teams WHERE event_id = 'EVENT_ID' AND conference = 'NFC';
--
-- 4. Add the matchup (replace IDs):
--    INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
--    VALUES ('EVENT_ID', 'WC_ROUND_ID', 4, 'BEARS_ID', 'NFC7_ID');
