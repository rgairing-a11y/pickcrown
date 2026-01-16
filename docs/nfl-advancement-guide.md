# NFL Advancement Picks Guide

How to set up and run NFL Playoff pools with reseeding brackets.

---

## Overview

The NFL Playoffs use **reseeding** after each round. This means:
- Wild Card matchups are known in advance
- Divisional matchups depend on Wild Card results (#1 plays lowest remaining seed)
- Conference Championship matchups depend on Divisional results
- Super Bowl matchup depends on Conference results

**Traditional bracket picks don't work** because users can't pick "who beats who" when the matchups aren't known.

Instead, PickCrown uses **advancement picks**: users pick which teams will advance past each round.

---

## How It Works

### What Users Pick

Instead of picking matchup winners, users pick:
- **Wild Card:** Which 4 teams advance (from 6 games)
- **Divisional:** Which 4 teams advance (must survive Wild Card first)
- **Conference:** Which 2 teams advance (must survive Divisional first)
- **Super Bowl:** Which 1 team wins (must survive Conference first)

### Survival Rule

A team can only be picked in Round N if they're picked to survive Round N-1.

**Example:**
- If you pick Bills to lose in Wild Card, you CANNOT pick Bills for Divisional
- The form automatically enforces this

### Scoring

Points are awarded when a team advances PAST a round:
- Wild Card: 5 points per correct advancement
- Divisional: 8 points per correct advancement
- Conference: 13 points per correct advancement
- Super Bowl: 21 points for picking the winner

**Max possible:** 4×5 + 4×8 + 2×13 + 1×21 = 99 points

---

## Setting Up an NFL Playoff Event

### Step 1: Create the Event

```sql
INSERT INTO events (name, year, event_type, start_time, status, uses_reseeding)
VALUES (
  'NFL Playoffs',
  2026,
  'nfl_playoff',
  '2026-01-10 16:30:00-05',  -- First Wild Card game
  'open',
  TRUE
);
```

### Step 2: Create Rounds

```sql
INSERT INTO rounds (event_id, name, round_order, points) VALUES
('event-uuid', 'Wild Card', 1, 5),
('event-uuid', 'Divisional', 2, 8),
('event-uuid', 'Conference Championship', 3, 13),
('event-uuid', 'Super Bowl', 4, 21);
```

### Step 3: Create Teams with Conference

```sql
INSERT INTO teams (event_id, name, seed, conference) VALUES
-- AFC
('event-uuid', 'Chiefs', 1, 'AFC'),
('event-uuid', 'Bills', 2, 'AFC'),
('event-uuid', 'Ravens', 3, 'AFC'),
('event-uuid', 'Texans', 4, 'AFC'),
('event-uuid', 'Chargers', 5, 'AFC'),
('event-uuid', 'Steelers', 6, 'AFC'),
('event-uuid', 'Broncos', 7, 'AFC'),
-- NFC
('event-uuid', 'Lions', 1, 'NFC'),
('event-uuid', 'Eagles', 2, 'NFC'),
('event-uuid', 'Buccaneers', 3, 'NFC'),
('event-uuid', 'Rams', 4, 'NFC'),
('event-uuid', 'Vikings', 5, 'NFC'),
('event-uuid', 'Commanders', 6, 'NFC'),
('event-uuid', 'Packers', 7, 'NFC');
```

### Step 4: Create Pool

Create pool as normal. The system detects `uses_reseeding` and shows the advancement pick form.

---

## The Pick Form

### What Users See

```
NFL Playoffs 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ NFL playoffs reseed after each round. 
   Pick how far each team advances.

WILD CARD ROUND (Pick 4 winners from 6 games)
────────────────────────────────────────────────
AFC:
  #2 Bills vs #7 Broncos     [ ] Bills  [ ] Broncos
  #3 Ravens vs #6 Steelers   [ ] Ravens [ ] Steelers
  #4 Texans vs #5 Chargers   [ ] Texans [ ] Chargers

NFC:
  #2 Eagles vs #7 Packers    [ ] Eagles [ ] Packers
  #3 Bucs vs #6 Commanders   [ ] Bucs   [ ] Commanders
  #4 Rams vs #5 Vikings      [ ] Rams   [ ] Vikings

DIVISIONAL ROUND (Pick 4 teams to advance)
────────────────────────────────────────────────
AFC (pick 2):
  [ ] Chiefs (#1 bye)
  [ ] Bills (if ✓ Wild Card)
  [ ] Ravens (if ✓ Wild Card)
  [ ] Texans (if ✓ Wild Card)
  [ ] Chargers (if ✓ Wild Card)
  [disabled] Steelers (eliminated in your Wild Card picks)
  [disabled] Broncos (eliminated in your Wild Card picks)

NFC (pick 2):
  ... similar ...

CONFERENCE CHAMPIONSHIP (Pick 2 teams)
────────────────────────────────────────────────
  ... only teams surviving your Divisional picks ...

SUPER BOWL (Pick 1 winner)
────────────────────────────────────────────────
  ... only teams surviving your Conference picks ...
```

### Survival Enforcement

- Teams you didn't pick in Wild Card are **disabled** in Divisional
- Teams you didn't pick in Divisional are **disabled** in Conference
- Teams you didn't pick in Conference are **disabled** in Super Bowl
- This prevents impossible picks

---

## Entering Results

### Recording Eliminations

After each round, record which teams were eliminated:

```sql
-- Example: Broncos lost in Wild Card
INSERT INTO team_eliminations (event_id, team_id, eliminated_in_round_id)
SELECT 
  'event-uuid',
  (SELECT id FROM teams WHERE event_id = 'event-uuid' AND name = 'Broncos'),
  (SELECT id FROM rounds WHERE event_id = 'event-uuid' AND name = 'Wild Card');
```

### Via Admin UI

1. Go to `/admin/events/[eventId]/nfl-results`
2. Select round
3. Check eliminated teams
4. Click "Save Eliminations"

### Scoring Happens Automatically

When you record eliminations:
- System checks each user's advancement picks
- Awards points for teams that advanced past each round
- Updates standings

---

## Viewing Results

### My Picks (Users)

Users see their picks with status:
- ✓ Green = Team advanced past this round
- ✗ Red = Team was eliminated in this round
- — Gray = Round not yet complete

### Standings

Standings show:
- Total points
- Points by round
- Rank

### Path to Victory

Shows:
- Current points
- Maximum possible points remaining
- Which of their picks are still alive

---

## Database Schema

### Tables Used

```sql
-- Teams with conference
teams (
  id, event_id, name, seed, conference
)

-- User picks: "Team X advances past Round Y"
advancement_picks (
  id, pool_entry_id, team_id, round_id
)

-- Results: "Team X was eliminated in Round Y"
team_eliminations (
  id, event_id, team_id, eliminated_in_round_id
)
```

### Scoring Query

```sql
-- Points for a user's advancement picks
SELECT 
  ap.pool_entry_id,
  SUM(r.points) as total_points
FROM advancement_picks ap
JOIN rounds r ON r.id = ap.round_id
JOIN teams t ON t.id = ap.team_id
LEFT JOIN team_eliminations te ON te.team_id = t.id AND te.event_id = t.event_id
WHERE 
  -- Team was not eliminated before this round
  (te.id IS NULL OR 
   (SELECT round_order FROM rounds WHERE id = te.eliminated_in_round_id) > r.round_order)
GROUP BY ap.pool_entry_id;
```

---

## Complete Setup Script

```sql
-- NFL Playoffs 2026 Setup

-- 1. Create event
INSERT INTO events (id, name, year, event_type, start_time, status, uses_reseeding)
VALUES (
  gen_random_uuid(),
  'NFL Playoffs',
  2026,
  'nfl_playoff',
  '2026-01-10 16:30:00-05',
  'open',
  TRUE
)
RETURNING id AS event_id;

-- Store the event_id, then:

-- 2. Create rounds
INSERT INTO rounds (event_id, name, round_order, points) VALUES
('[EVENT_ID]', 'Wild Card', 1, 5),
('[EVENT_ID]', 'Divisional', 2, 8),
('[EVENT_ID]', 'Conference Championship', 3, 13),
('[EVENT_ID]', 'Super Bowl', 4, 21);

-- 3. Create teams
INSERT INTO teams (event_id, name, seed, conference) VALUES
-- AFC
('[EVENT_ID]', 'Chiefs', 1, 'AFC'),
('[EVENT_ID]', 'Bills', 2, 'AFC'),
('[EVENT_ID]', 'Ravens', 3, 'AFC'),
('[EVENT_ID]', 'Texans', 4, 'AFC'),
('[EVENT_ID]', 'Chargers', 5, 'AFC'),
('[EVENT_ID]', 'Steelers', 6, 'AFC'),
('[EVENT_ID]', 'Broncos', 7, 'AFC'),
-- NFC
('[EVENT_ID]', 'Lions', 1, 'NFC'),
('[EVENT_ID]', 'Eagles', 2, 'NFC'),
('[EVENT_ID]', 'Buccaneers', 3, 'NFC'),
('[EVENT_ID]', 'Rams', 4, 'NFC'),
('[EVENT_ID]', 'Vikings', 5, 'NFC'),
('[EVENT_ID]', 'Commanders', 6, 'NFC'),
('[EVENT_ID]', 'Packers', 7, 'NFC');

-- 4. Create pool
INSERT INTO pools (event_id, name, owner_email, status)
VALUES ('[EVENT_ID]', 'Family NFL Pool', 'you@email.com', 'active');
```

---

## Troubleshooting

### "Can't pick team in later round"
- Check if you picked them in the previous round
- Survival rule requires picks to be consistent

### "Scores not calculating"
- Ensure eliminations are recorded
- Check team_eliminations table has correct round_id

### "Wrong teams showing as eliminated"
- Verify team_id matches
- Check eliminated_in_round_id is correct round

### "Form not showing advancement UI"
- Ensure event has `uses_reseeding = TRUE`
- Ensure event_type is `nfl_playoff`

---

## Summary

1. NFL uses advancement picks, not matchup picks
2. Survival rule enforces pick consistency
3. Record eliminations after each round
4. Scoring based on teams advancing past rounds
5. Maximum 99 points possible

Good luck! 🏈
