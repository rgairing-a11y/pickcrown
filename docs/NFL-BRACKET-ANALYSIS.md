# NFL Bracket Model Analysis

## Current PickCrown Bracket Model

### Storage
```
bracket_picks:
  - pool_entry_id (who made the pick)
  - matchup_id (which matchup)
  - picked_team_id (who they picked to win)
```

### How It Works
1. Matchups are pre-defined with `team_a_id` and `team_b_id`
2. Users pick the winner of each matchup
3. Scoring: `pick.picked_team_id === matchup.winner_team_id`

### Current UI
- Shows bracket with all matchups
- Each matchup shows two teams
- User clicks team to pick winner

---

## NFL Playoff Requirements (From Spec)

### The Problem: Reseeding
- Wild Card: Matchups are fixed (known teams)
- Divisional: #1 seed plays LOWEST remaining seed (unknown until Wild Card ends)
- Conference/Super Bowl: Based on previous results

**At pick time, we DON'T KNOW:**
- Who #1 seed will play in Divisional
- The entire bracket structure beyond Wild Card

### What Users Should Pick
> "How far each team advances" — NOT specific matchups

### Survival Consistency Rule
> A team may only be selected in Round N if that team is still "alive" in the user's own picks from Round N-1

---

## Gap Analysis

| Aspect | Current Model | NFL Requirement |
|--------|---------------|-----------------|
| Pick target | Matchup winner | Team advancement |
| Storage key | matchup_id | team_id + round |
| UI shows | Opponent pairings | Teams alive per round |
| Later rounds | Need both teams | Need list of alive teams |
| Scoring | Match against matchup winner | Team advanced past round? |

**Verdict: Current model CANNOT handle NFL reseeding as-is.**

---

## Proposed Solution

### Option A: New Table (Recommended)

Create `advancement_picks` for reseeding events:

```sql
CREATE TABLE advancement_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_entry_id UUID NOT NULL REFERENCES pool_entries(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  round_id UUID NOT NULL REFERENCES rounds(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pool_entry_id, team_id, round_id)
);

CREATE INDEX idx_advancement_picks_entry ON advancement_picks(pool_entry_id);
CREATE INDEX idx_advancement_picks_team ON advancement_picks(team_id);
```

**Meaning:** "I pick [team] to advance past [round]"

### Option B: Extend bracket_picks

```sql
ALTER TABLE bracket_picks 
  ADD COLUMN round_id UUID REFERENCES rounds(id),
  ALTER COLUMN matchup_id DROP NOT NULL;
```

For reseeding events: use `round_id` instead of `matchup_id`

**Meaning:** Same as Option A, but reuses existing table

---

## Event Configuration

Add to `events` table:

```sql
ALTER TABLE events ADD COLUMN uses_reseeding BOOLEAN DEFAULT FALSE;
```

Or infer from event type:
- `nfl_playoff` → reseeding
- `bracket` → fixed bracket (current behavior)

---

## UI Changes Required

### For Reseeding Events (NFL)

**Pick Screen:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ NFL playoffs reseed after each round.               │
│ You're picking how far each team advances —            │
│ not specific matchups.                                  │
└─────────────────────────────────────────────────────────┘

WILD CARD (Pick 4 winners)
┌──────────────────┐  ┌──────────────────┐
│ AFC              │  │ NFC              │
│ #2 Bills vs #7   │  │ #2 Eagles vs #7  │
│ #3 Ravens vs #6  │  │ #3 Lions vs #6   │
│ #4 Texans vs #5  │  │ #4 Bucs vs #5    │
└──────────────────┘  └──────────────────┘

DIVISIONAL (Pick 4 teams to advance)
Opponents determined after Wild Card
┌──────────────────┐  ┌──────────────────┐
│ AFC              │  │ NFC              │
│ Pick 2 teams:    │  │ Pick 2 teams:    │
│ [ ] Chiefs (#1)  │  │ [ ] 49ers (#1)   │
│ [ ] Bills (if ✓) │  │ [ ] Eagles (if ✓)│
│ [ ] Ravens (if ✓)│  │ [ ] Lions (if ✓) │
│ [ ] Texans (if ✓)│  │ [ ] Bucs (if ✓)  │
│ [ ] #5 (if ✓)    │  │ [ ] #5 (if ✓)    │
└──────────────────┘  └──────────────────┘

... and so on for Conference/Super Bowl
```

**Key UI Rules:**
1. Wild Card: Show real matchups (fixed)
2. Divisional+: Show "pick X teams to advance" by conference
3. Gray out / disable teams eliminated in user's own prior picks
4. Show "(if ✓)" or "Eliminated" based on survival status

---

## Scoring Logic

### For Reseeding Events

```javascript
function scoreAdvancementPick(pick, actualResults) {
  // pick = { team_id, round_id }
  // actualResults = map of team_id -> furthest_round_reached
  
  const teamActualRound = actualResults[pick.team_id]
  const pickedRound = getRoundOrder(pick.round_id)
  
  // Team advanced past this round if they reached a LATER round
  return teamActualRound >= pickedRound
}
```

### Tracking Actual Results

Option 1: Use matchup results
- After Divisional, check which teams have winner_team_id set in their favor
- Derive "team X advanced past Divisional" from matchup outcomes

Option 2: Add advancement tracking
```sql
CREATE TABLE team_advancement (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  team_id UUID REFERENCES teams(id),
  eliminated_in_round_id UUID REFERENCES rounds(id), -- NULL if still alive
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Phases

### Phase 1: Schema (1 hour)
- [ ] Create `advancement_picks` table
- [ ] Add `uses_reseeding` to events
- [ ] Create `team_advancement` table (or derive from matchups)

### Phase 2: Pick Form for NFL (4 hours)
- [ ] New component: `AdvancementPickForm`
- [ ] Survival consistency validation
- [ ] By-conference team selection UI
- [ ] Proper messaging/disclaimers

### Phase 3: Scoring (2 hours)
- [ ] New scoring function for advancement picks
- [ ] Update `calculate_standings` or create new RPC
- [ ] Test with sample data

### Phase 4: Results Entry (2 hours)
- [ ] Admin can enter round results
- [ ] System derives advancement from matchup winners
- [ ] Reseeding: populate next round matchups automatically

### Phase 5: Integration (2 hours)
- [ ] Standings page shows advancement picks
- [ ] My Picks shows advancement picks
- [ ] Path to Victory works with advancement

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `components/BracketPickForm.js` | Add conditional for reseeding events |
| `components/AdvancementPickForm.js` | NEW - advancement-based picking |
| `app/pool/[poolId]/standings/page.js` | Support advancement scoring |
| `app/api/matchups/route.js` | Reseeding logic for populating teams |
| `lib/constants.js` | Add NFL_PLAYOFF event type |

---

## Decision Required

**Before implementing, confirm:**

1. Use Option A (new table) or Option B (extend bracket_picks)?
   - Recommendation: **Option A** - cleaner separation

2. Store results in matchups table or separate advancement table?
   - Recommendation: **Use matchups** - derive advancement from winners

3. Create new event type `nfl_playoff` or add flag to existing `bracket`?
   - Recommendation: **Add `uses_reseeding` flag** - more flexible

---

## Summary

The current matchup-based model cannot handle NFL reseeding because:
1. Future matchups are unknown at pick time
2. Users need to pick "team advancement" not "matchup winners"
3. UI must NOT imply matchup pairings that don't exist yet

**Required changes:**
- New storage model (advancement_picks)
- New pick UI component
- Modified scoring logic
- Event flag for reseeding

**Estimated effort:** ~12 hours total
