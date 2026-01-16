# World Cup 2026 - PickCrown Admin Guide

**Last Updated:** January 2026  
**Tournament Dates:** June 11 – July 19, 2026  
**Hosts:** USA, Canada, Mexico

---

## Table of Contents

1. [Tournament Format](#1-tournament-format)
2. [The Groups (Draw Results)](#2-the-groups-draw-results)
3. [Teams Still TBD](#3-teams-still-tbd)
4. [Pool Format Options](#4-pool-format-options)
5. [Two-Phase Pool Setup (Recommended)](#5-two-phase-pool-setup)
6. [Complete SQL Setup Script](#6-complete-sql-setup-script)
7. [Phase Transition Guide](#7-phase-transition-guide)
8. [Timeline & Checklist](#8-timeline--checklist)
9. [Scoring Summary](#9-scoring-summary)

---

## 1. Tournament Format

### Structure
- **48 teams** in **12 groups** of 4
- Top 2 from each group advance (24 teams)
- 8 best 3rd-place teams advance (32 total)
- **Knockout:** Round of 32 → R16 → QF → SF → Final

### Key Dates
| Date | Event |
|------|-------|
| March 26, 2026 | UEFA Playoff Semifinals |
| March 31, 2026 | UEFA Playoff Finals |
| March 2026 | Intercontinental Playoffs |
| June 11, 2026 | Tournament Opens (Mexico vs South Africa) |
| June 27, 2026 | Group Stage Ends (approx) |
| June 28, 2026 | Round of 32 Begins |
| July 19, 2026 | Final (MetLife Stadium, NJ) |

---

## 2. The Groups (Draw Results)

The draw was held December 5, 2025. Here are all 12 groups:

### Group A (Mexico's Group)
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Mexico | 15 | Host |
| South Africa | 59 | |
| Korea Republic | 23 | |
| **TBD** | — | UEFA Playoff D winner |

### Group B (Canada's Group)
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Canada | 40 | Host |
| **TBD** | — | UEFA Playoff A winner |
| Qatar | 35 | 2022 Hosts |
| Switzerland | 18 | |

### Group C
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Brazil | 5 | 5x Champions |
| Morocco | 17 | 2022 Semifinalists |
| Haiti | 81 | |
| Scotland | 52 | |

### Group D (USA's Group)
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| USA | 14 | Host |
| Paraguay | 54 | |
| Australia | 26 | |
| **TBD** | — | UEFA Playoff C winner |

### Group E
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Germany | 9 | 4x Champions |
| Ecuador | 29 | |
| Côte d'Ivoire | 44 | |
| Curaçao | 82 | First WC, smallest nation ever |

### Group F
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Netherlands | 7 | |
| Japan | 19 | |
| **TBD** | — | UEFA Playoff B winner |
| Tunisia | 37 | |

### Group G
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Belgium | 8 | |
| Egypt | 33 | |
| Iran | 21 | |
| New Zealand | 103 | |

### Group H
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Spain | 1 | Euro 2024 Champions |
| Uruguay | 16 | |
| Saudi Arabia | 56 | |
| Cape Verde | 61 | First WC |

### Group I
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| France | 3 | 2018 Champions |
| Senegal | 20 | |
| **TBD** | — | Intercontinental Playoff 2 |
| Norway | 46 | |

### Group J
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Argentina | 2 | Defending Champions |
| Algeria | 30 | |
| Austria | 22 | |
| Jordan | 68 | First WC |

### Group K
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| Portugal | 6 | |
| **TBD** | — | Intercontinental Playoff 1 |
| Uzbekistan | 50 | First WC |
| Colombia | 13 | |

### Group L
| Team | FIFA Rank | Notes |
|------|-----------|-------|
| England | 4 | |
| Croatia | 11 | 2018 Finalists |
| Ghana | 72 | |
| Panama | 41 | |

---

## 3. Teams Still TBD

### UEFA Playoffs (March 26-31, 2026)

| Path | Semifinal 1 | Semifinal 2 | Goes to Group |
|------|-------------|-------------|---------------|
| A | Italy vs N. Ireland | Wales vs Bosnia | **Group B** |
| B | Ukraine vs Sweden | Poland vs Albania | **Group F** |
| C | Slovakia vs Kosovo | Türkiye vs Romania | **Group D** |
| D | Czechia vs Rep. Ireland | Denmark vs N. Macedonia | **Group A** |

### Intercontinental Playoffs (March 2026)

| Pathway | Teams | Goes to Group |
|---------|-------|---------------|
| 1 | New Caledonia vs Jamaica → winner vs DR Congo | **Group K** |
| 2 | Bolivia vs Suriname → winner vs Iraq | **Group I** |

**Action Required:** Update team names in database after March 31, 2026.

---

## 4. Pool Format Options

### Option A: Full Pre-Pick (Simple)
- Users predict all group winners/runners-up AND full knockout bracket before tournament
- Locks: June 11
- Pros: Simple, one deadline
- Cons: Knockout picks are blind guesses

### Option B: Two-Phase (Recommended) ✓
- **Phase 1:** Pick group winners + runners-up (locks June 11)
- **Phase 2:** Pick knockout bracket with ACTUAL qualifiers (locks ~June 28)
- Pros: More engaging, informed knockout picks
- Cons: Requires phase transition admin work

### Option C: Knockout Only
- Skip group picks entirely
- Only pick Round of 32 onward
- Locks: ~June 28

---

## 5. Two-Phase Pool Setup

This is the recommended format.

### Phase 1: Group Stage Predictions
- Pick Winner + Runner-up for each of 12 groups
- **24 total picks** (12 groups × 2)
- **2 points each** = 48 max points
- Locks: June 11, 2026 (before first match)

### Phase 2: Knockout Bracket
- Opens after group stage completes (~June 27)
- Users see ACTUAL qualified teams
- Round of 32 → Final = **31 picks**
- Points: 3 / 5 / 8 / 13 / 21
- Locks: Before Round of 32 begins (~June 28)

### Phase 2 Point Breakdown
| Round | Matches | Points Each | Max Points |
|-------|---------|-------------|------------|
| Round of 32 | 16 | 3 | 48 |
| Round of 16 | 8 | 5 | 40 |
| Quarterfinals | 4 | 8 | 32 |
| Semifinals | 2 | 13 | 26 |
| Final | 1 | 21 | 21 |
| **Total** | **31** | — | **167** |

### Grand Total: 215 possible points

---

## 6. Complete SQL Setup Script

### Schema Reference

Before running, note these PickCrown schema requirements:

| Table | Column | Valid Values |
|-------|--------|--------------|
| phases | status | `'upcoming'`, `'open'`, `'locked'`, `'completed'` |
| phases | type | `'pick_one'`, `'bracket'` |
| categories | type | `'single_select'`, `'yes_no'`, `'match_prediction'` |
| teams | conference | Used for grouping (not `region`) |
| pools | status | `'active'`, `'archived'` (check constraint) |

---

### STEP 1: Create Event

```sql
INSERT INTO events (id, name, year, event_type, start_time, status)
VALUES (
  gen_random_uuid(),
  'FIFA World Cup 2026',
  2026,
  'hybrid',
  '2026-06-11 15:00:00-04',  -- First match: Mexico vs South Africa
  'draft'
)
RETURNING id, name;

-- ⚠️ SAVE THE RETURNED ID
-- Replace [EVENT_ID] in all queries below
```

---

### STEP 2: Create Phases

```sql
INSERT INTO phases (id, event_id, name, phase_order, lock_time, status, type) VALUES
(gen_random_uuid(), '[EVENT_ID]', 'Group Stage Picks', 1, '2026-06-11 14:00:00-04', 'upcoming', 'pick_one'),
(gen_random_uuid(), '[EVENT_ID]', 'Knockout Bracket', 2, '2026-06-28 11:00:00-04', 'upcoming', 'bracket');

-- Verify
SELECT id, name, status, type FROM phases WHERE event_id = '[EVENT_ID]' ORDER BY phase_order;
```

---

### STEP 3: Create All 48 Teams

```sql
INSERT INTO teams (event_id, name, seed, conference) VALUES
-- GROUP A (Mexico's Group)
('[EVENT_ID]', 'Mexico', 1, 'Group A'),
('[EVENT_ID]', 'South Africa', 2, 'Group A'),
('[EVENT_ID]', 'Korea Republic', 3, 'Group A'),
('[EVENT_ID]', 'UEFA Playoff D', 4, 'Group A'),

-- GROUP B (Canada's Group)  
('[EVENT_ID]', 'Canada', 1, 'Group B'),
('[EVENT_ID]', 'UEFA Playoff A', 2, 'Group B'),
('[EVENT_ID]', 'Qatar', 3, 'Group B'),
('[EVENT_ID]', 'Switzerland', 4, 'Group B'),

-- GROUP C
('[EVENT_ID]', 'Brazil', 1, 'Group C'),
('[EVENT_ID]', 'Morocco', 2, 'Group C'),
('[EVENT_ID]', 'Haiti', 3, 'Group C'),
('[EVENT_ID]', 'Scotland', 4, 'Group C'),

-- GROUP D (USA's Group)
('[EVENT_ID]', 'USA', 1, 'Group D'),
('[EVENT_ID]', 'Paraguay', 2, 'Group D'),
('[EVENT_ID]', 'Australia', 3, 'Group D'),
('[EVENT_ID]', 'UEFA Playoff C', 4, 'Group D'),

-- GROUP E
('[EVENT_ID]', 'Germany', 1, 'Group E'),
('[EVENT_ID]', 'Ecuador', 2, 'Group E'),
('[EVENT_ID]', 'Côte d''Ivoire', 3, 'Group E'),
('[EVENT_ID]', 'Curaçao', 4, 'Group E'),

-- GROUP F
('[EVENT_ID]', 'Netherlands', 1, 'Group F'),
('[EVENT_ID]', 'Japan', 2, 'Group F'),
('[EVENT_ID]', 'UEFA Playoff B', 3, 'Group F'),
('[EVENT_ID]', 'Tunisia', 4, 'Group F'),

-- GROUP G
('[EVENT_ID]', 'Belgium', 1, 'Group G'),
('[EVENT_ID]', 'Egypt', 2, 'Group G'),
('[EVENT_ID]', 'Iran', 3, 'Group G'),
('[EVENT_ID]', 'New Zealand', 4, 'Group G'),

-- GROUP H
('[EVENT_ID]', 'Spain', 1, 'Group H'),
('[EVENT_ID]', 'Uruguay', 2, 'Group H'),
('[EVENT_ID]', 'Saudi Arabia', 3, 'Group H'),
('[EVENT_ID]', 'Cape Verde', 4, 'Group H'),

-- GROUP I
('[EVENT_ID]', 'France', 1, 'Group I'),
('[EVENT_ID]', 'Senegal', 2, 'Group I'),
('[EVENT_ID]', 'Intercontinental 2', 3, 'Group I'),
('[EVENT_ID]', 'Norway', 4, 'Group I'),

-- GROUP J
('[EVENT_ID]', 'Argentina', 1, 'Group J'),
('[EVENT_ID]', 'Algeria', 2, 'Group J'),
('[EVENT_ID]', 'Austria', 3, 'Group J'),
('[EVENT_ID]', 'Jordan', 4, 'Group J'),

-- GROUP K
('[EVENT_ID]', 'Portugal', 1, 'Group K'),
('[EVENT_ID]', 'Intercontinental 1', 2, 'Group K'),
('[EVENT_ID]', 'Uzbekistan', 3, 'Group K'),
('[EVENT_ID]', 'Colombia', 4, 'Group K'),

-- GROUP L
('[EVENT_ID]', 'England', 1, 'Group L'),
('[EVENT_ID]', 'Croatia', 2, 'Group L'),
('[EVENT_ID]', 'Ghana', 3, 'Group L'),
('[EVENT_ID]', 'Panama', 4, 'Group L');

-- Verify (should be 48 teams)
SELECT conference, name, seed FROM teams WHERE event_id = '[EVENT_ID]' ORDER BY conference, seed;
```

---

### STEP 4: Create Group Stage Categories

```sql
INSERT INTO categories (id, event_id, name, order_index, phase_id, points, type) VALUES
-- Group A
(gen_random_uuid(), '[EVENT_ID]', 'Group A - Winner', 1, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group A - Runner-up', 2, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group B
(gen_random_uuid(), '[EVENT_ID]', 'Group B - Winner', 3, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group B - Runner-up', 4, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group C
(gen_random_uuid(), '[EVENT_ID]', 'Group C - Winner', 5, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group C - Runner-up', 6, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group D
(gen_random_uuid(), '[EVENT_ID]', 'Group D - Winner', 7, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group D - Runner-up', 8, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group E
(gen_random_uuid(), '[EVENT_ID]', 'Group E - Winner', 9, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group E - Runner-up', 10, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group F
(gen_random_uuid(), '[EVENT_ID]', 'Group F - Winner', 11, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group F - Runner-up', 12, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group G
(gen_random_uuid(), '[EVENT_ID]', 'Group G - Winner', 13, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group G - Runner-up', 14, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group H
(gen_random_uuid(), '[EVENT_ID]', 'Group H - Winner', 15, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group H - Runner-up', 16, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group I
(gen_random_uuid(), '[EVENT_ID]', 'Group I - Winner', 17, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group I - Runner-up', 18, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group J
(gen_random_uuid(), '[EVENT_ID]', 'Group J - Winner', 19, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group J - Runner-up', 20, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group K
(gen_random_uuid(), '[EVENT_ID]', 'Group K - Winner', 21, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group K - Runner-up', 22, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
-- Group L
(gen_random_uuid(), '[EVENT_ID]', 'Group L - Winner', 23, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select'),
(gen_random_uuid(), '[EVENT_ID]', 'Group L - Runner-up', 24, (SELECT id FROM phases WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks'), 2, 'single_select');

-- Verify (should be 24 categories)
SELECT name, order_index, points, type FROM categories WHERE event_id = '[EVENT_ID]' ORDER BY order_index;
```

---

### STEP 5: Link Teams to Categories as Options

```sql
DO $$
DECLARE
  group_letter TEXT;
  cat_type TEXT;
  cat_id UUID;
  event_uuid UUID := '[EVENT_ID]'::UUID;
BEGIN
  FOREACH group_letter IN ARRAY ARRAY['A','B','C','D','E','F','G','H','I','J','K','L'] LOOP
    FOREACH cat_type IN ARRAY ARRAY['Winner', 'Runner-up'] LOOP
      SELECT id INTO cat_id 
      FROM categories 
      WHERE event_id = event_uuid 
        AND name = 'Group ' || group_letter || ' - ' || cat_type;
      
      INSERT INTO category_options (category_id, name, order_index)
      SELECT cat_id, t.name, t.seed
      FROM teams t
      WHERE t.event_id = event_uuid 
        AND t.conference = 'Group ' || group_letter
      ORDER BY t.seed;
    END LOOP;
  END LOOP;
END $$;

-- Verify (should be 96 options)
SELECT COUNT(*) as option_count FROM category_options 
WHERE category_id IN (SELECT id FROM categories WHERE event_id = '[EVENT_ID]');
```

---

### STEP 6: Create Knockout Rounds

```sql
INSERT INTO rounds (id, event_id, name, round_order, points) VALUES
(gen_random_uuid(), '[EVENT_ID]', 'Round of 32', 1, 3),
(gen_random_uuid(), '[EVENT_ID]', 'Round of 16', 2, 5),
(gen_random_uuid(), '[EVENT_ID]', 'Quarterfinals', 3, 8),
(gen_random_uuid(), '[EVENT_ID]', 'Semifinals', 4, 13),
(gen_random_uuid(), '[EVENT_ID]', 'Final', 5, 21);

-- Verify
SELECT name, round_order, points FROM rounds WHERE event_id = '[EVENT_ID]' ORDER BY round_order;
```

---

### STEP 7: Create Empty Knockout Matchups

```sql
-- Round of 32 (16 matches)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT '[EVENT_ID]', r.id, pos, NULL, NULL
FROM rounds r, generate_series(1, 16) AS pos
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'Round of 32';

-- Round of 16 (8 matches)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT '[EVENT_ID]', r.id, pos, NULL, NULL
FROM rounds r, generate_series(1, 8) AS pos
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'Round of 16';

-- Quarterfinals (4 matches)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT '[EVENT_ID]', r.id, pos, NULL, NULL
FROM rounds r, generate_series(1, 4) AS pos
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'Quarterfinals';

-- Semifinals (2 matches)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT '[EVENT_ID]', r.id, pos, NULL, NULL
FROM rounds r, generate_series(1, 2) AS pos
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'Semifinals';

-- Final (1 match)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT '[EVENT_ID]', r.id, 1, NULL, NULL
FROM rounds r
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'Final';

-- Verify (should be 31 total matchups)
SELECT r.name, COUNT(*) as matches
FROM matchups m
JOIN rounds r ON r.id = m.round_id
WHERE m.event_id = '[EVENT_ID]'
GROUP BY r.name, r.round_order
ORDER BY r.round_order;
```

---

### STEP 8: Create Pools

```sql
-- Pool A
INSERT INTO pools (id, event_id, name, owner_email, status)
VALUES (
  gen_random_uuid(),
  '[EVENT_ID]',
  'World Cup 2026 - Pool A',
  'your@email.com',  -- CHANGE THIS
  'active'
)
RETURNING id, name;

-- Pool B
INSERT INTO pools (id, event_id, name, owner_email, status)
VALUES (
  gen_random_uuid(),
  '[EVENT_ID]',
  'World Cup 2026 - Pool B',
  'your@email.com',  -- CHANGE THIS
  'active'
)
RETURNING id, name;
```

---

### VERIFICATION

```sql
SELECT 'Events' as item, COUNT(*) as count FROM events WHERE id = '[EVENT_ID]'
UNION ALL SELECT 'Phases', COUNT(*) FROM phases WHERE event_id = '[EVENT_ID]'
UNION ALL SELECT 'Teams', COUNT(*) FROM teams WHERE event_id = '[EVENT_ID]'
UNION ALL SELECT 'Categories', COUNT(*) FROM categories WHERE event_id = '[EVENT_ID]'
UNION ALL SELECT 'Category Options', COUNT(*) FROM category_options WHERE category_id IN (SELECT id FROM categories WHERE event_id = '[EVENT_ID]')
UNION ALL SELECT 'Rounds', COUNT(*) FROM rounds WHERE event_id = '[EVENT_ID]'
UNION ALL SELECT 'Matchups', COUNT(*) FROM matchups WHERE event_id = '[EVENT_ID]'
UNION ALL SELECT 'Pools', COUNT(*) FROM pools WHERE event_id = '[EVENT_ID]';
```

**Expected Results:**
| item | count |
|------|-------|
| Events | 1 |
| Phases | 2 |
| Teams | 48 |
| Categories | 24 |
| Category Options | 96 |
| Rounds | 5 |
| Matchups | 31 |
| Pools | 2 |

---

### OPEN FOR PICKS (When Ready)

```sql
UPDATE phases SET status = 'open' WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks';
UPDATE events SET status = 'open' WHERE id = '[EVENT_ID]';
```

---

## 7. Phase Transition Guide

### After Group Stage Ends (~June 27)

#### Step 1: Mark Group Results

```sql
-- Example: Brazil won Group C, Morocco was runner-up
UPDATE category_options SET is_correct = TRUE 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Group C - Winner' AND event_id = '[EVENT_ID]')
  AND name = 'Brazil';

UPDATE category_options SET is_correct = TRUE 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Group C - Runner-up' AND event_id = '[EVENT_ID]')
  AND name = 'Morocco';

-- Repeat for all 12 groups (24 updates total)
```

#### Step 2: Complete Phase 1

```sql
UPDATE phases SET status = 'completed' 
WHERE event_id = '[EVENT_ID]' AND name = 'Group Stage Picks';
```

#### Step 3: Populate Round of 32 Matchups

The Round of 32 bracket structure for 2026 is complex due to 3rd-place qualifiers. You'll need to populate based on FIFA's actual bracket once groups are complete.

```sql
-- Example: Populate first R32 match
UPDATE matchups SET 
  team_a_id = (SELECT id FROM teams WHERE event_id = '[EVENT_ID]' AND name = 'Brazil'),
  team_b_id = (SELECT id FROM teams WHERE event_id = '[EVENT_ID]' AND name = '3rd Place Team X')
WHERE event_id = '[EVENT_ID]' 
  AND round_id = (SELECT id FROM rounds WHERE event_id = '[EVENT_ID]' AND name = 'Round of 32')
  AND bracket_position = 1;

-- Repeat for all 16 R32 matches
```

#### Step 4: Open Phase 2

```sql
UPDATE phases SET status = 'open' 
WHERE event_id = '[EVENT_ID]' AND name = 'Knockout Bracket';
```

#### Step 5: After Each Knockout Round

```sql
-- Set winner for completed match
UPDATE matchups SET winner_team_id = (SELECT id FROM teams WHERE name = 'Winner Name' AND event_id = '[EVENT_ID]')
WHERE event_id = '[EVENT_ID]' AND round_id = '[ROUND_ID]' AND bracket_position = [N];

-- Then populate next round's matchups with winners
```

---

## 8. Timeline & Checklist

### ✅ DONE
- [x] Draw completed (December 5, 2025)
- [x] Groups known (12 groups of 4)
- [x] 42 of 48 teams confirmed

### 📅 AFTER MARCH 31, 2026 (Playoffs Complete)

Update 6 placeholder team names:

```sql
-- UEFA Playoff A Winner → Group B
UPDATE teams SET name = 'ACTUAL_WINNER' WHERE event_id = '[EVENT_ID]' AND name = 'UEFA Playoff A';
UPDATE category_options SET name = 'ACTUAL_WINNER' WHERE name = 'UEFA Playoff A';

-- UEFA Playoff B Winner → Group F  
UPDATE teams SET name = 'ACTUAL_WINNER' WHERE event_id = '[EVENT_ID]' AND name = 'UEFA Playoff B';
UPDATE category_options SET name = 'ACTUAL_WINNER' WHERE name = 'UEFA Playoff B';

-- UEFA Playoff C Winner → Group D
UPDATE teams SET name = 'ACTUAL_WINNER' WHERE event_id = '[EVENT_ID]' AND name = 'UEFA Playoff C';
UPDATE category_options SET name = 'ACTUAL_WINNER' WHERE name = 'UEFA Playoff C';

-- UEFA Playoff D Winner → Group A
UPDATE teams SET name = 'ACTUAL_WINNER' WHERE event_id = '[EVENT_ID]' AND name = 'UEFA Playoff D';
UPDATE category_options SET name = 'ACTUAL_WINNER' WHERE name = 'UEFA Playoff D';

-- Intercontinental Playoff 1 → Group K
UPDATE teams SET name = 'ACTUAL_WINNER' WHERE event_id = '[EVENT_ID]' AND name = 'Intercontinental 1';
UPDATE category_options SET name = 'ACTUAL_WINNER' WHERE name = 'Intercontinental 1';

-- Intercontinental Playoff 2 → Group I
UPDATE teams SET name = 'ACTUAL_WINNER' WHERE event_id = '[EVENT_ID]' AND name = 'Intercontinental 2';
UPDATE category_options SET name = 'ACTUAL_WINNER' WHERE name = 'Intercontinental 2';
```

### 📅 BEFORE JUNE 11, 2026
- [ ] Verify all team names are correct
- [ ] Open Phase 1 for picks
- [ ] Share pool links

### 📅 ~JUNE 27, 2026 (Group Stage Ends)
- [ ] Mark all group results as correct (24 updates)
- [ ] Complete Phase 1
- [ ] Populate Round of 32 matchups with qualifiers
- [ ] Open Phase 2

### 📅 JUNE 28 – JULY 19, 2026 (Knockout)
- [ ] Enter results after each round
- [ ] Update standings
- [ ] Send results email after Final

---

## 9. Scoring Summary

| Phase | Picks | Points Each | Max Points |
|-------|-------|-------------|------------|
| **Phase 1: Groups** | 24 | 2 | **48** |
| **Phase 2: R32** | 16 | 3 | 48 |
| **Phase 2: R16** | 8 | 5 | 40 |
| **Phase 2: QF** | 4 | 8 | 32 |
| **Phase 2: SF** | 2 | 13 | 26 |
| **Phase 2: Final** | 1 | 21 | 21 |
| **TOTAL** | **55** | — | **215** |

---

## Troubleshooting

### Duplicate Category Options
If you run Step 5 multiple times accidentally:

```sql
-- Delete ALL options for this event
DELETE FROM category_options 
WHERE category_id IN (
  SELECT id FROM categories WHERE event_id = '[EVENT_ID]'
);

-- Re-run Step 5 once
```

### Check Schema Constraints

```sql
-- View all check constraints for a table
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname LIKE 'TABLE_NAME%check%';

-- View columns for a table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'TABLE_NAME' 
ORDER BY ordinal_position;
```

### Get Pool URLs

```sql
SELECT id, name FROM pools WHERE event_id = '[EVENT_ID]';
```

Pool URLs: `https://pickcrown.com/pool/[POOL_ID]`

---

## Reference: Your World Cup 2026 Event

**Event ID:** `6d6f6259-c655-457a-8e57-d60aa90ebf0e`

Get pool IDs:
```sql
SELECT id, name FROM pools WHERE event_id = '6d6f6259-c655-457a-8e57-d60aa90ebf0e';
```
