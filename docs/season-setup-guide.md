# Season Setup Guide

How to create and manage seasons that span multiple events.

---

## What Is a Season?

A season groups multiple events together with cumulative standings.

**Examples:**
- Road to WrestleMania (SNME → Royal Rumble → Elimination Chamber → WrestleMania)
- Awards Season (Golden Globes → SAG → Oscars)
- NFL Playoffs (Wild Card → Divisional → Conference → Super Bowl)

---

## Creating a Season

### Via Supabase Dashboard

1. Go to Supabase → Table Editor → `seasons`
2. Click "Insert row"
3. Fill in:

| Field | Value | Example |
|-------|-------|---------|
| `name` | Season display name | "Road to WrestleMania 42" |
| `description` | Optional description | "Track your picks from SNME through WrestleMania" |
| `year` | Season year | 2025 |
| `status` | Current status | "active" |

### Via SQL

```sql
INSERT INTO seasons (name, description, year, status)
VALUES (
  'Road to WrestleMania 42',
  'Track your picks from Saturday Night''s Main Event through WrestleMania',
  2025,
  'active'
);
```

---

## Adding Events to a Season

### Via Supabase Dashboard

1. Go to Table Editor → `events`
2. Find your event
3. Edit the `season_id` field
4. Set it to your season's UUID

### Via SQL

```sql
-- Get your season ID
SELECT id, name FROM seasons WHERE name LIKE '%WrestleMania%';

-- Update events to belong to season
UPDATE events 
SET season_id = 'your-season-uuid'
WHERE id IN ('event-1-uuid', 'event-2-uuid', 'event-3-uuid');
```

---

## Season Event Order

Events in a season are ordered by their `start_time`. Earlier events appear first in the season standings.

To control order explicitly, ensure start times are in chronological order:

```sql
-- Check event order
SELECT name, start_time 
FROM events 
WHERE season_id = 'your-season-uuid'
ORDER BY start_time;
```

---

## Season Standings Calculation

Season standings are calculated by summing points across all events:

```
Season Score = Event 1 Points + Event 2 Points + ... + Event N Points
```

### Key Rules

1. **Email is the identity key** — Same email across events = same person
2. **Case insensitive** — "John@email.com" = "john@email.com"
3. **Missing events = 0 points** — If someone skips an event, they get nothing for it
4. **Ties allowed** — Multiple people can share a rank

---

## Season Standings Page

### URL Format
```
/season/[seasonId]/standings
```

### What It Shows
- Season name and description
- List of events with status (upcoming/locked/completed)
- Standings table with:
  - Rank
  - Entry name
  - Events entered (count)
  - Total points

### Linking from Pools

Pools automatically show a season link if their event belongs to a season:

> 🏆 View Road to WrestleMania 42 Standings

---

## Managing Season Status

| Status | Meaning |
|--------|---------|
| `active` | Season is ongoing |
| `completed` | Season has ended |
| `archived` | Hidden from view |

```sql
-- Mark season as completed
UPDATE seasons 
SET status = 'completed' 
WHERE id = 'your-season-uuid';
```

---

## Example: Road to WrestleMania 42

### Step 1: Create the Season

```sql
INSERT INTO seasons (name, description, year, status)
VALUES (
  'Road to WrestleMania 42',
  'The journey from Saturday Night''s Main Event to WrestleMania 42',
  2025,
  'active'
)
RETURNING id;
-- Returns: abc123-season-uuid
```

### Step 2: Create Events

```sql
-- Saturday Night's Main Event
INSERT INTO events (name, year, event_type, start_time, status, season_id)
VALUES (
  'Saturday Night''s Main Event',
  2025,
  'hybrid',
  '2025-01-25 20:00:00-05',
  'open',
  'abc123-season-uuid'
);

-- Royal Rumble
INSERT INTO events (name, year, event_type, start_time, status, season_id)
VALUES (
  'Royal Rumble',
  2025,
  'hybrid',
  '2025-02-01 19:00:00-05',
  'draft',
  'abc123-season-uuid'
);

-- WrestleMania 42
INSERT INTO events (name, year, event_type, start_time, status, season_id)
VALUES (
  'WrestleMania 42',
  2025,
  'hybrid',
  '2025-04-19 19:00:00-04',
  'draft',
  'abc123-season-uuid'
);
```

### Step 3: Create Pools

Create pools as normal. The season link will appear automatically because the events have `season_id` set.

---

## Season Enrollment (Opt-In)

Per the PickCrown product rules, season participation is **explicit and opt-in**:

> Users only see season standings if they have explicitly joined that season.

Currently, joining any pool for a season event implicitly includes you in season standings. Future versions may add explicit season join UI.

---

## Multi-Pool Seasons

If multiple pools exist for the same event:

- Users in different pools still accumulate season points
- Season standings aggregate across all pools
- Email address is the unifying key

**Example:**
- Pool A: Family picks for Royal Rumble
- Pool B: Work picks for Royal Rumble
- Both contribute to Road to WrestleMania season standings

---

## Troubleshooting

### "Season standings not showing"
- Check event has `season_id` set
- Check season status is "active" or "completed"
- Verify the season ID matches

### "User appears twice in standings"
- Different email addresses used
- Email is the identity key — must be exact match

### "Points not adding up"
- Check each event has standings calculated
- Verify event status is "completed" for finished events
- Run standings recalculation if needed

### "Event not appearing in season"
- Check `season_id` is set on the event
- Check event status is not "draft"

---

## Best Practices

1. **Create season before events** — Easier to assign season_id at event creation
2. **Use consistent naming** — "Road to WrestleMania 42" not "RtWM42"
3. **Set description** — Helps users understand what's included
4. **Plan event schedule** — Know all events before creating season
5. **Test with one event first** — Verify standings work before adding more

---

## SQL Cheat Sheet

```sql
-- List all seasons
SELECT * FROM seasons ORDER BY year DESC;

-- List events in a season
SELECT e.name, e.start_time, e.status 
FROM events e
WHERE e.season_id = 'season-uuid'
ORDER BY e.start_time;

-- Check season standings (raw)
SELECT 
  pe.email,
  pe.entry_name,
  SUM(/* points calculation */) as total_points
FROM pool_entries pe
JOIN pools p ON pe.pool_id = p.id
JOIN events e ON p.event_id = e.id
WHERE e.season_id = 'season-uuid'
GROUP BY pe.email, pe.entry_name
ORDER BY total_points DESC;

-- Remove event from season
UPDATE events SET season_id = NULL WHERE id = 'event-uuid';

-- Delete a season (orphans events)
DELETE FROM seasons WHERE id = 'season-uuid';
```

---

## Summary

1. Create season in `seasons` table
2. Set `season_id` on events
3. Season standings auto-calculate
4. Link appears on pool pages automatically
5. Email is the identity key across events
