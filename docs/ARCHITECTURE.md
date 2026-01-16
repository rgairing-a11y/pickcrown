# PickCrown Event Type Architecture

## Overview

This architecture allows adding new event types (round robin, double elimination, survivor pools, etc.) **without modifying the standings page**.

## Files

```
lib/
  eventTypes.js          # Central configuration for all event types

app/pool/[poolId]/
  standings/page.js      # Universal standings page (doesn't change per event type)
  picks/page.js          # Universal all-picks page

components/
  MyPicksButton.js       # Handles all event types
```

## How It Works

### 1. Event Type Registry (`lib/eventTypes.js`)

Each event type declares:
- **scoringFunction**: Which database function to call
- **pickTable**: Which table stores picks
- **features**: Which UI sections to show

```javascript
const EVENT_TYPES = {
  bracket: {
    scoringFunction: 'calculate_standings',
    pickTable: 'bracket_picks',
    features: {
      scenarioSimulator: true,
      pathToVictory: true,
      popularBracketPicks: true,
    }
  },
  advancement: {
    scoringFunction: 'calculate_advancement_standings',
    pickTable: 'advancement_picks',
    features: {
      popularAdvancementPicks: true,
    }
  }
}
```

### 2. Universal Standings Page

The standings page:
1. Loads pool and event data
2. Looks up event type config
3. Calls the right scoring function
4. Conditionally loads data for enabled features
5. Renders sections based on `hasFeature()` checks

```javascript
const eventConfig = getEventTypeConfig(pool.event)
const scoringFunction = getScoringFunction(pool.event)

const { data: standings } = await supabase.rpc(scoringFunction, { p_pool_id: poolId })

// Only load if feature is enabled
if (hasFeature(pool.event, 'popularBracketPicks')) {
  popularBracketPicks = await loadPopularBracketPicks(...)
}
```

## Adding a New Event Type

### Example: Adding Survivor Pool

1. **Add to `eventTypes.js`:**

```javascript
survivor: {
  name: 'Survivor Pool',
  scoringFunction: 'calculate_survivor_standings',
  pickTable: 'survivor_picks',
  hasMatchups: false,
  features: {
    survivorStatus: true,  // New feature
  }
}
```

2. **Create database table:**

```sql
CREATE TABLE survivor_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_entry_id UUID REFERENCES pool_entries(id),
  week INTEGER,
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. **Create scoring function:**

```sql
CREATE FUNCTION calculate_survivor_standings(p_pool_id UUID)
RETURNS TABLE(rank, entry_id, entry_name, email, total_points, status)
AS $$
  -- Survivor-specific scoring logic
$$;
```

4. **Add data loader (if needed):**

```javascript
// In standings page
async function loadSurvivorStatus(eventId, poolId, supabase) {
  // Load survivor-specific data
}
```

5. **Add UI section (if needed):**

```javascript
function SurvivorStatusSection({ data }) {
  // Render survivor-specific UI
}
```

6. **That's it!** No changes to core standings page logic.

## Event Type Detection

The system detects event type in this order:

1. `uses_reseeding = true` → `advancement` type
2. `event_type` field → Use that type
3. Default → `bracket` type

## Database Schema Notes

### Required for all events:
- `events` table with `event_type` field
- `pools` table
- `pool_entries` table
- Scoring function returning standard format

### Standard standings format (all scoring functions must return):
```sql
RETURNS TABLE(
  rank BIGINT,
  entry_id UUID,
  entry_name TEXT,
  email TEXT,
  total_points INTEGER,
  -- Optional additional columns per event type
)
```

## Benefits

1. **No code duplication** - Common UI components shared
2. **Easy to add new types** - Just config + scoring function
3. **Won't break existing events** - Each type isolated
4. **Clear structure** - Easy to understand and maintain
