# Bracket with Byes Guide (CFB Playoff Style)

How to set up a bracket tournament where top seeds get first-round byes.

---

## Overview

The CFB Playoff format has 12 teams but only 8 play in the first round. The top 4 seeds get byes and enter in the Quarterfinals.

```
First Round (8 teams play):
  #5 vs #12
  #6 vs #11  
  #7 vs #10
  #8 vs #9

Quarterfinals (8 teams):
  #1 vs Winner(#8/#9)      ← #1 had bye
  #2 vs Winner(#7/#10)     ← #2 had bye
  #3 vs Winner(#6/#11)     ← #3 had bye
  #4 vs Winner(#5/#12)     ← #4 had bye

Semifinals (4 teams):
  Winner(QF1) vs Winner(QF4)
  Winner(QF2) vs Winner(QF3)

Championship (2 teams):
  Winner(SF1) vs Winner(SF2)
```

---

## Setup Steps

### Step 1: Create the Event

```sql
INSERT INTO events (name, year, event_type, start_time, status)
VALUES (
  'College Football Playoff',
  2025,
  'bracket',
  '2025-01-09 19:30:00-05',
  'open'
)
RETURNING id;
-- Returns: event-uuid
```

### Step 2: Create All 12 Teams

```sql
INSERT INTO teams (event_id, name, seed) VALUES
('event-uuid', 'Indiana', 1),
('event-uuid', 'Ohio State', 2),
('event-uuid', 'Georgia', 3),
('event-uuid', 'Texas Tech', 4),
('event-uuid', 'Oregon', 5),
('event-uuid', 'Ole Miss', 6),
('event-uuid', 'Texas A&M', 7),
('event-uuid', 'Oklahoma', 8),
('event-uuid', 'Alabama', 9),
('event-uuid', 'Miami', 10),
('event-uuid', 'Tulane', 11),
('event-uuid', 'James Madison', 12);
```

### Step 3: Create Rounds with Points

```sql
INSERT INTO rounds (event_id, name, round_order, points) VALUES
('event-uuid', 'First Round', 1, 5),
('event-uuid', 'Quarterfinals', 2, 8),
('event-uuid', 'Semifinals', 3, 13),
('event-uuid', 'Championship', 4, 21);
```

### Step 4: Create First Round Matchups (No Byes)

Only seeds 5-12 play in the first round:

```sql
-- Get round IDs
SELECT id, name FROM rounds WHERE event_id = 'event-uuid';
-- first_round_id, quarterfinals_id, semifinals_id, championship_id

-- Get team IDs
SELECT id, name, seed FROM teams WHERE event_id = 'event-uuid';

-- First Round matchups (8 teams play, 4 matchups)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id) VALUES
('event-uuid', 'first-round-id', 1, 'oklahoma-id', 'alabama-id'),      -- #8 vs #9
('event-uuid', 'first-round-id', 2, 'oregon-id', 'james-madison-id'),  -- #5 vs #12
('event-uuid', 'first-round-id', 3, 'texas-am-id', 'miami-id'),        -- #7 vs #10
('event-uuid', 'first-round-id', 4, 'ole-miss-id', 'tulane-id');       -- #6 vs #11
```

### Step 5: Create Quarterfinal Matchups (With Byes)

The bye teams are pre-filled in team_a. Team_b comes from First Round winners.

```sql
-- Quarterfinals: bye teams vs first round winners
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id) VALUES
('event-uuid', 'quarterfinals-id', 1, 'indiana-id', NULL),     -- #1 vs Winner(FR1)
('event-uuid', 'quarterfinals-id', 2, 'texas-tech-id', NULL),  -- #4 vs Winner(FR2)
('event-uuid', 'quarterfinals-id', 3, 'ohio-state-id', NULL),  -- #2 vs Winner(FR3)
('event-uuid', 'quarterfinals-id', 4, 'georgia-id', NULL);     -- #3 vs Winner(FR4)
```

### Step 6: Create Empty Later Round Matchups

```sql
-- Semifinals (teams TBD)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id) VALUES
('event-uuid', 'semifinals-id', 1, NULL, NULL),
('event-uuid', 'semifinals-id', 2, NULL, NULL);

-- Championship (teams TBD)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id) VALUES
('event-uuid', 'championship-id', 1, NULL, NULL);
```

---

## How Users Pick

Users must pick ALL rounds at submission time, including:
- First Round winners (4 picks)
- Quarterfinal winners (4 picks) 
- Semifinal winners (2 picks)
- Championship winner (1 pick)

**Total: 11 picks**

For Quarterfinals, users see:
- Team A: The bye team (e.g., #1 Indiana)
- Team B: Choose from possible First Round winners

---

## Entering Results

### First Round Results

```sql
-- Example: Alabama beats Oklahoma in FR1
UPDATE matchups 
SET winner_team_id = 'alabama-id'
WHERE event_id = 'event-uuid' 
AND round_id = 'first-round-id' 
AND bracket_position = 1;
```

### Advancing Teams to Quarterfinals

After First Round, update Quarterfinal matchups with the winners:

```sql
-- FR1 winner (Alabama) goes to QF1 as team_b
UPDATE matchups 
SET team_b_id = 'alabama-id'
WHERE event_id = 'event-uuid' 
AND round_id = 'quarterfinals-id' 
AND bracket_position = 1;

-- FR2 winner goes to QF2 as team_b
-- ... and so on
```

### Quarterfinal Results

```sql
-- Example: Indiana beats Alabama in QF1
UPDATE matchups 
SET winner_team_id = 'indiana-id'
WHERE event_id = 'event-uuid' 
AND round_id = 'quarterfinals-id' 
AND bracket_position = 1;
```

Then advance to Semifinals...

---

## Scoring

Points are awarded based on the round points:

| Pick | If Correct |
|------|-----------|
| First Round | 5 pts each |
| Quarterfinals | 8 pts each |
| Semifinals | 13 pts each |
| Championship | 21 pts |

**Max possible:** 4×5 + 4×8 + 2×13 + 1×21 = 20 + 32 + 26 + 21 = **99 points**

---

## Bracket Position Mapping

For CFB Playoff, the bracket positions should follow this structure:

```
First Round:
  Position 1: #8 vs #9  → feeds QF1
  Position 2: #5 vs #12 → feeds QF2 (note: after bracket flip)
  Position 3: #7 vs #10 → feeds QF3
  Position 4: #6 vs #11 → feeds QF4

Quarterfinals:
  Position 1: #1 (bye) vs FR1 winner
  Position 2: #4 (bye) vs FR2 winner
  Position 3: #2 (bye) vs FR3 winner
  Position 4: #3 (bye) vs FR4 winner

Semifinals:
  Position 1: QF1 winner vs QF4 winner
  Position 2: QF2 winner vs QF3 winner

Championship:
  Position 1: SF1 winner vs SF2 winner
```

---

## Complete SQL Script

```sql
-- CFB Playoff 2025 Setup Script

-- 1. Create event
INSERT INTO events (id, name, year, event_type, start_time, status)
VALUES (
  gen_random_uuid(),
  'College Football Playoff',
  2025,
  'bracket',
  '2025-01-09 19:30:00-05',
  'open'
);

-- Store event ID for subsequent queries
-- SELECT id FROM events WHERE name = 'College Football Playoff' AND year = 2025;

-- 2. Create teams (use your event ID)
INSERT INTO teams (event_id, name, seed) VALUES
('[EVENT_ID]', 'Indiana', 1),
('[EVENT_ID]', 'Ohio State', 2),
('[EVENT_ID]', 'Georgia', 3),
('[EVENT_ID]', 'Texas Tech', 4),
('[EVENT_ID]', 'Oregon', 5),
('[EVENT_ID]', 'Ole Miss', 6),
('[EVENT_ID]', 'Texas A&M', 7),
('[EVENT_ID]', 'Oklahoma', 8),
('[EVENT_ID]', 'Alabama', 9),
('[EVENT_ID]', 'Miami', 10),
('[EVENT_ID]', 'Tulane', 11),
('[EVENT_ID]', 'James Madison', 12);

-- 3. Create rounds
INSERT INTO rounds (event_id, name, round_order, points) VALUES
('[EVENT_ID]', 'First Round', 1, 5),
('[EVENT_ID]', 'Quarterfinals', 2, 8),
('[EVENT_ID]', 'Semifinals', 3, 13),
('[EVENT_ID]', 'Championship', 4, 21);

-- 4. Create matchups (need to substitute actual UUIDs)
-- First Round
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT 
  '[EVENT_ID]',
  r.id,
  m.pos,
  ta.id,
  tb.id
FROM rounds r,
LATERAL (VALUES 
  (1, 'Oklahoma', 'Alabama'),
  (2, 'Oregon', 'James Madison'),
  (3, 'Texas A&M', 'Miami'),
  (4, 'Ole Miss', 'Tulane')
) AS m(pos, team_a, team_b)
JOIN teams ta ON ta.name = m.team_a AND ta.event_id = '[EVENT_ID]'
JOIN teams tb ON tb.name = m.team_b AND tb.event_id = '[EVENT_ID]'
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'First Round';

-- Quarterfinals (bye teams only)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT 
  '[EVENT_ID]',
  r.id,
  m.pos,
  t.id,
  NULL
FROM rounds r,
LATERAL (VALUES 
  (1, 'Indiana'),
  (2, 'Texas Tech'),
  (3, 'Ohio State'),
  (4, 'Georgia')
) AS m(pos, team_name)
JOIN teams t ON t.name = m.team_name AND t.event_id = '[EVENT_ID]'
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'Quarterfinals';

-- Semifinals & Championship (empty)
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT '[EVENT_ID]', r.id, m.pos, NULL, NULL
FROM rounds r,
LATERAL (VALUES (1), (2)) AS m(pos)
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'Semifinals';

INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
SELECT '[EVENT_ID]', r.id, 1, NULL, NULL
FROM rounds r
WHERE r.event_id = '[EVENT_ID]' AND r.name = 'Championship';
```

---

## Troubleshooting

### "Users can't pick later rounds"
- Ensure all matchups exist (even with NULL teams)
- Users pick by team, not by matchup teams

### "Scores not calculating"
- Check winner_team_id is set on completed matchups
- Verify round points are correct

### "Bye team showing as opponent"
- Bye teams go in team_a
- team_b should be NULL until First Round completes

### "Wrong team advancing"
- Check bracket_position mapping
- Verify team IDs are correct

---

## Summary

1. Create all teams (including bye teams)
2. Create all rounds with point values
3. Create First Round matchups (8 teams)
4. Create Quarterfinal matchups (bye team in team_a, NULL in team_b)
5. Create empty Semifinal and Championship matchups
6. Users pick all rounds at submission
7. Admin enters results and advances teams
8. Scoring happens automatically
