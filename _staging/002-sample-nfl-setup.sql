-- NFL Playoff Event Setup
-- Run this in Supabase SQL Editor after running the schema migration

-- 1. Create the event
INSERT INTO events (id, name, year, event_type, start_time, status, uses_reseeding)
VALUES (
  gen_random_uuid(),
  'NFL Playoffs',
  2025,
  'bracket',
  '2025-01-11 16:30:00-05',  -- Wild Card Saturday kickoff
  'open',
  TRUE  -- Enable reseeding!
)
RETURNING id;

-- Save the event ID, then use it below
-- For this example, let's use a placeholder that you'll replace

-- 2. Create rounds with point values
-- Replace EVENT_ID with the actual UUID from step 1
INSERT INTO rounds (event_id, name, round_order, points) VALUES
('EVENT_ID', 'Wild Card', 1, 3),
('EVENT_ID', 'Divisional', 2, 5),
('EVENT_ID', 'Conference Championship', 3, 8),
('EVENT_ID', 'Super Bowl', 4, 13);

-- 3. Create AFC teams
-- #1 and #2 seeds get byes in the old format, but current NFL has no byes
-- If there ARE byes, set has_bye = TRUE
INSERT INTO teams (event_id, name, seed, conference, has_bye) VALUES
('EVENT_ID', 'Kansas City Chiefs', 1, 'AFC', TRUE),   -- #1 gets bye
('EVENT_ID', 'Buffalo Bills', 2, 'AFC', FALSE),
('EVENT_ID', 'Baltimore Ravens', 3, 'AFC', FALSE),
('EVENT_ID', 'Houston Texans', 4, 'AFC', FALSE),
('EVENT_ID', 'Los Angeles Chargers', 5, 'AFC', FALSE),
('EVENT_ID', 'Pittsburgh Steelers', 6, 'AFC', FALSE),
('EVENT_ID', 'Denver Broncos', 7, 'AFC', FALSE);

-- 4. Create NFC teams
INSERT INTO teams (event_id, name, seed, conference, has_bye) VALUES
('EVENT_ID', 'Detroit Lions', 1, 'NFC', TRUE),   -- #1 gets bye
('EVENT_ID', 'Philadelphia Eagles', 2, 'NFC', FALSE),
('EVENT_ID', 'Los Angeles Rams', 3, 'NFC', FALSE),
('EVENT_ID', 'Tampa Bay Buccaneers', 4, 'NFC', FALSE),
('EVENT_ID', 'Minnesota Vikings', 5, 'NFC', FALSE),
('EVENT_ID', 'Washington Commanders', 6, 'NFC', FALSE),
('EVENT_ID', 'Green Bay Packers', 7, 'NFC', FALSE);

-- 5. Create Wild Card matchups (these ARE known)
-- Note: For 7-team format with 1 bye, Wild Card has 3 games per conference
-- Get round IDs first:
-- SELECT id, name FROM rounds WHERE event_id = 'EVENT_ID';
-- Get team IDs:
-- SELECT id, name, seed, conference FROM teams WHERE event_id = 'EVENT_ID';

-- AFC Wild Card matchups (2 vs 7, 3 vs 6, 4 vs 5)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id) VALUES
('EVENT_ID', 'WILD_CARD_ROUND_ID', 1, 'BILLS_ID', 'BRONCOS_ID'),           -- #2 vs #7
('EVENT_ID', 'WILD_CARD_ROUND_ID', 2, 'RAVENS_ID', 'STEELERS_ID'),         -- #3 vs #6
('EVENT_ID', 'WILD_CARD_ROUND_ID', 3, 'TEXANS_ID', 'CHARGERS_ID');         -- #4 vs #5

-- NFC Wild Card matchups
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id) VALUES
('EVENT_ID', 'WILD_CARD_ROUND_ID', 4, 'EAGLES_ID', 'PACKERS_ID'),          -- #2 vs #7
('EVENT_ID', 'WILD_CARD_ROUND_ID', 5, 'RAMS_ID', 'COMMANDERS_ID'),         -- #3 vs #6
('EVENT_ID', 'WILD_CARD_ROUND_ID', 6, 'BUCS_ID', 'VIKINGS_ID');            -- #4 vs #5

-- 6. Create a pool for the event
INSERT INTO pools (id, name, event_id, owner_email, status)
VALUES (
  gen_random_uuid(),
  'Family NFL Playoff Pool',
  'EVENT_ID',
  'you@email.com',
  'active'
);

-- ====================
-- COMPLETE SETUP SCRIPT (with actual IDs)
-- ====================
-- Use this version - it generates all IDs in one transaction

DO $$
DECLARE
  v_event_id UUID;
  v_wc_round_id UUID;
  v_div_round_id UUID;
  v_conf_round_id UUID;
  v_sb_round_id UUID;
  -- AFC teams
  v_chiefs_id UUID;
  v_bills_id UUID;
  v_ravens_id UUID;
  v_texans_id UUID;
  v_chargers_id UUID;
  v_steelers_id UUID;
  v_broncos_id UUID;
  -- NFC teams
  v_lions_id UUID;
  v_eagles_id UUID;
  v_rams_id UUID;
  v_bucs_id UUID;
  v_vikings_id UUID;
  v_commanders_id UUID;
  v_packers_id UUID;
BEGIN
  -- Create event
  INSERT INTO events (name, year, event_type, start_time, status, uses_reseeding)
  VALUES ('NFL Playoffs', 2025, 'bracket', '2025-01-11 16:30:00-05', 'open', TRUE)
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

  -- Create AFC teams
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Kansas City Chiefs', 1, 'AFC', TRUE) RETURNING id INTO v_chiefs_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Buffalo Bills', 2, 'AFC', FALSE) RETURNING id INTO v_bills_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Baltimore Ravens', 3, 'AFC', FALSE) RETURNING id INTO v_ravens_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Houston Texans', 4, 'AFC', FALSE) RETURNING id INTO v_texans_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Los Angeles Chargers', 5, 'AFC', FALSE) RETURNING id INTO v_chargers_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Pittsburgh Steelers', 6, 'AFC', FALSE) RETURNING id INTO v_steelers_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Denver Broncos', 7, 'AFC', FALSE) RETURNING id INTO v_broncos_id;

  -- Create NFC teams
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Detroit Lions', 1, 'NFC', TRUE) RETURNING id INTO v_lions_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Philadelphia Eagles', 2, 'NFC', FALSE) RETURNING id INTO v_eagles_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Los Angeles Rams', 3, 'NFC', FALSE) RETURNING id INTO v_rams_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Tampa Bay Buccaneers', 4, 'NFC', FALSE) RETURNING id INTO v_bucs_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Minnesota Vikings', 5, 'NFC', FALSE) RETURNING id INTO v_vikings_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Washington Commanders', 6, 'NFC', FALSE) RETURNING id INTO v_commanders_id;
  
  INSERT INTO teams (event_id, name, seed, conference, has_bye) 
  VALUES (v_event_id, 'Green Bay Packers', 7, 'NFC', FALSE) RETURNING id INTO v_packers_id;

  -- Create Wild Card matchups
  -- AFC
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 1, v_bills_id, v_broncos_id);
  
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 2, v_ravens_id, v_steelers_id);
  
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 3, v_texans_id, v_chargers_id);

  -- NFC
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 4, v_eagles_id, v_packers_id);
  
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 5, v_rams_id, v_commanders_id);
  
  INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
  VALUES (v_event_id, v_wc_round_id, 6, v_bucs_id, v_vikings_id);

  -- Create a pool
  INSERT INTO pools (name, event_id, owner_email, status)
  VALUES ('NFL Playoff Pool 2025', v_event_id, 'your@email.com', 'active');

  RAISE NOTICE 'Setup complete! Event ID: %', v_event_id;
END $$;

-- Verify setup
SELECT 'Events' as table_name, count(*) FROM events WHERE uses_reseeding = TRUE;
SELECT 'Rounds' as table_name, count(*) FROM rounds;
SELECT 'Teams' as table_name, count(*) FROM teams;
SELECT 'Matchups' as table_name, count(*) FROM matchups;
