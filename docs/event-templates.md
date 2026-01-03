# Event Templates Guide

Reference templates for common event types in PickCrown.

---

## Event Types Overview

| Type | Use Case | Example |
|------|----------|---------|
| `pick_one` | Category-based predictions | Oscars, Emmy Awards |
| `bracket` | Tournament brackets | March Madness, CFB Playoff |
| `hybrid` | Categories + Bracket | WrestleMania, Super Bowl |

---

## Template 1: Pick-One (Oscars Style)

### Overview
- Multiple categories
- Each category has several options
- User picks one option per category
- Points awarded for correct picks

### Event Setup

```sql
INSERT INTO events (name, year, event_type, start_time, status)
VALUES ('Academy Awards', 2025, 'pick_one', '2025-03-02 20:00:00-05', 'open');
```

### Categories Structure

```
Best Picture (8-10 options)
Best Director (5 options)
Best Actor (5 options)
Best Actress (5 options)
Best Supporting Actor (5 options)
Best Supporting Actress (5 options)
Best Original Screenplay (5 options)
Best Adapted Screenplay (5 options)
... etc
```

### CSV Import Format

```csv
Category,Option
Best Picture,Anora
Best Picture,The Brutalist
Best Picture,A Complete Unknown
Best Picture,Conclave
Best Picture,Emilia Pérez
Best Director,Sean Baker
Best Director,Brady Corbet
Best Director,James Mangold
Best Actor,Adrien Brody
Best Actor,Timothée Chalamet
```

### Scoring
- 1 point per correct category (default)
- Or weighted points per category

---

## Template 2: Multi-Phase Pick-One (Oscars with Nominations)

### Overview
- Phase 1: Nomination predictions
- Phase 2: Winner predictions
- Each phase locks independently

### Event Setup

```sql
-- Create event
INSERT INTO events (name, year, event_type, start_time, status)
VALUES ('Academy Awards', 2025, 'pick_one', '2025-03-02 20:00:00-05', 'open');

-- Create phases
INSERT INTO phases (event_id, name, phase_order, lock_time, status) VALUES
('event-uuid', 'Nominations', 1, '2025-01-23 08:30:00-05', 'open'),
('event-uuid', 'Winners', 2, '2025-03-02 20:00:00-05', 'draft');
```

### Categories by Phase

**Phase 1 (Nominations):**
- "Who will be nominated for Best Picture?" (pick 5-10)
- "Who will be nominated for Best Director?" (pick 5)
- etc.

**Phase 2 (Winners):**
- "Who will win Best Picture?" (pick 1)
- "Who will win Best Director?" (pick 1)
- etc.

### Phase Rules
- Phase 2 only opens after Phase 1 is completed
- Users can join in Phase 2 (get 0 for Phase 1)
- Points accumulate across phases

---

## Template 3: Classic Bracket (March Madness)

### Overview
- 64 teams
- 6 rounds
- Single elimination

### Event Setup

```sql
INSERT INTO events (name, year, event_type, start_time, status)
VALUES ('March Madness', 2025, 'bracket', '2025-03-20 12:00:00-04', 'open');
```

### Rounds Structure

```sql
INSERT INTO rounds (event_id, name, round_order, points) VALUES
('event-uuid', 'Round of 64', 1, 1),
('event-uuid', 'Round of 32', 2, 2),
('event-uuid', 'Sweet 16', 3, 4),
('event-uuid', 'Elite 8', 4, 8),
('event-uuid', 'Final Four', 5, 16),
('event-uuid', 'Championship', 6, 32);
```

### Teams (64 total)

Seeds 1-16 in each of 4 regions:
- East
- West
- South
- Midwest

### Matchup Structure

**Round of 64:** 32 matchups
```
1 vs 16, 8 vs 9, 5 vs 12, 4 vs 13
6 vs 11, 3 vs 14, 7 vs 10, 2 vs 15
(× 4 regions)
```

**Round of 32:** 16 matchups
**Sweet 16:** 8 matchups
**Elite 8:** 4 matchups (region finals)
**Final Four:** 2 matchups
**Championship:** 1 matchup

### Max Points

1×32 + 2×16 + 4×8 + 8×4 + 16×2 + 32×1 = 192 points

---

## Template 4: Bracket with Byes (CFB Playoff)

### Overview
- 12 teams
- Top 4 seeds get first-round byes
- 4 rounds total

### Event Setup

```sql
INSERT INTO events (name, year, event_type, start_time, status)
VALUES ('College Football Playoff', 2025, 'bracket', '2025-01-09 19:30:00-05', 'open');
```

### Rounds Structure

```sql
INSERT INTO rounds (event_id, name, round_order, points) VALUES
('event-uuid', 'First Round', 1, 5),
('event-uuid', 'Quarterfinals', 2, 8),
('event-uuid', 'Semifinals', 3, 13),
('event-uuid', 'Championship', 4, 21);
```

### Teams (12 total)

```
#1 Indiana (bye)
#2 Ohio State (bye)
#3 Georgia (bye)
#4 Texas Tech (bye)
#5 Oregon
#6 Ole Miss
#7 Texas A&M
#8 Oklahoma
#9 Alabama
#10 Miami
#11 Tulane
#12 James Madison
```

### Matchup Structure

**First Round:** 4 matchups (seeds 5-12)
- #8 vs #9
- #5 vs #12
- #7 vs #10
- #6 vs #11

**Quarterfinals:** 4 matchups (bye teams enter)
- #1 vs Winner(#8/#9)
- #4 vs Winner(#5/#12)
- #2 vs Winner(#7/#10)
- #3 vs Winner(#6/#11)

**Semifinals:** 2 matchups
**Championship:** 1 matchup

### Max Points

5×4 + 8×4 + 13×2 + 21×1 = 20 + 32 + 26 + 21 = 99 points

See: [Bracket with Byes Guide](./bracket-with-byes-guide.md) for detailed setup.

---

## Template 5: Hybrid (WrestleMania)

### Overview
- Bracket matches (Championship matches)
- Category picks (prop bets, predictions)
- Combined scoring

### Event Setup

```sql
INSERT INTO events (name, year, event_type, start_time, status)
VALUES ('WrestleMania 41', 2025, 'hybrid', '2025-04-19 19:00:00-04', 'open');
```

### Bracket Component (Matches)

```sql
-- Create a single round for match winners
INSERT INTO rounds (event_id, name, round_order, points)
VALUES ('event-uuid', 'Matches', 1, 5);

-- Create teams (wrestlers/tag teams)
INSERT INTO teams (event_id, name, seed) VALUES
('event-uuid', 'Cody Rhodes', 1),
('event-uuid', 'The Rock', 2),
('event-uuid', 'Roman Reigns', 3),
('event-uuid', 'Seth Rollins', 4);
-- ... etc

-- Create matchups
INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id) VALUES
('event-uuid', 'round-uuid', 1, 'cody-id', 'rock-id'),
('event-uuid', 'round-uuid', 2, 'roman-id', 'seth-id');
-- ... etc
```

### Category Component (Props)

```sql
INSERT INTO categories (event_id, name, display_order) VALUES
('event-uuid', 'Will anyone bleed?', 1),
('event-uuid', 'Will there be a title change?', 2),
('event-uuid', 'Will a legend appear?', 3),
('event-uuid', 'Main event ends how?', 4);

-- Options for each category
INSERT INTO category_options (category_id, name, display_order) VALUES
('will-bleed-id', 'Yes', 1),
('will-bleed-id', 'No', 2),
('main-event-id', 'Pinfall', 1),
('main-event-id', 'Submission', 2),
('main-event-id', 'DQ/Countout', 3),
('main-event-id', 'Other', 4);
```

### Scoring
- Match picks: 5 points each
- Category picks: 3 points each (or custom)

---

## Template 6: Super Bowl

### Overview
- Pick the winner (bracket-style)
- Prop bets (categories)
- Hybrid event

### Event Setup

```sql
INSERT INTO events (name, year, event_type, start_time, status)
VALUES ('Super Bowl LIX', 2025, 'hybrid', '2025-02-09 18:30:00-05', 'open');
```

### Main Pick (Winner)

```sql
INSERT INTO rounds (event_id, name, round_order, points)
VALUES ('event-uuid', 'Winner', 1, 10);

INSERT INTO teams (event_id, name, seed) VALUES
('event-uuid', 'Chiefs', 1),
('event-uuid', 'Eagles', 2);

INSERT INTO matchups (event_id, round_id, bracket_position, team_a_id, team_b_id)
VALUES ('event-uuid', 'round-uuid', 1, 'chiefs-id', 'eagles-id');
```

### Prop Bets (Categories)

```csv
Category,Option
First team to score,Chiefs
First team to score,Eagles
Total points (over/under 49.5),Over
Total points (over/under 49.5),Under
MVP Position,Quarterback
MVP Position,Running Back
MVP Position,Wide Receiver
MVP Position,Defensive Player
MVP Position,Other
Will there be a safety?,Yes
Will there be a safety?,No
Halftime show guest?,Yes
Halftime show guest?,No
Longest touchdown (over/under 39.5),Over
Longest touchdown (over/under 39.5),Under
```

### Scoring
- Winner: 10 points
- Props: 2-5 points each (based on difficulty)

---

## Template 7: Fantasy Draft Style

### Overview
- Users pick players/items from categories
- No "correct" answer until results
- Good for reality TV, award shows

### Example: Grammy Predictions

```csv
Category,Option
Album of the Year,Beyoncé - Renaissance
Album of the Year,Taylor Swift - Midnights
Album of the Year,Harry Styles - Harry's House
Record of the Year,Beyoncé - Break My Soul
Record of the Year,Harry Styles - As It Was
Best New Artist,GloRilla
Best New Artist,Latto
Best New Artist,Steve Lacy
```

---

## Cloning Events

To clone an event from a previous year:

### Step 1: Copy Event

```sql
INSERT INTO events (name, year, event_type, start_time, status, season_id)
SELECT name, 2026, event_type, 
       start_time + interval '1 year', 
       'draft', season_id
FROM events 
WHERE name = 'Academy Awards' AND year = 2025;
```

### Step 2: Copy Categories (Pick-One)

```sql
INSERT INTO categories (event_id, name, display_order, points, phase_id)
SELECT 'new-event-uuid', name, display_order, points, NULL
FROM categories 
WHERE event_id = 'old-event-uuid';
```

### Step 3: Copy Options

```sql
INSERT INTO category_options (category_id, name, display_order)
SELECT 
  (SELECT id FROM categories WHERE event_id = 'new-event-uuid' AND name = old_cat.name),
  old_opt.name,
  old_opt.display_order
FROM category_options old_opt
JOIN categories old_cat ON old_opt.category_id = old_cat.id
WHERE old_cat.event_id = 'old-event-uuid';
```

### Step 4: Update Options
- Update nominee names for new year
- Add new categories if needed
- Remove outdated categories

---

## Best Practices

1. **Use consistent naming** — "Best Picture" not "best picture" or "BEST PICTURE"
2. **Set point values thoughtfully** — Higher points for harder picks
3. **Test with a dummy pool** — Verify everything works before going live
4. **Document your scoring** — Tell users how points work
5. **Plan for ties** — PickCrown allows ties by default
6. **Keep categories reasonable** — 10-20 categories is plenty
7. **Mobile test** — Brackets need horizontal scroll on mobile

---

## Quick Reference

| Event Type | Rounds | Categories | Teams | Matchups |
|------------|--------|------------|-------|----------|
| pick_one | No | Yes | No | No |
| bracket | Yes | No | Yes | Yes |
| hybrid | Yes | Yes | Yes | Yes |

---

## Support

For help setting up complex events:
1. Check this guide
2. Review similar past events
3. Test in dev environment first
4. Ask in admin chat
