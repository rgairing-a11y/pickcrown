# PickCrown Roadmap Update - January 2025

## Recently Completed (This Session)

### v2.1 Features (Complete)
- [x] Bye team support for brackets (CFB Playoff style)
- [x] Pool visibility windows (open_date/archive_date)
- [x] Homepage hierarchy improvements
- [x] Archived pools page
- [x] Bracket advancement fixes for byes
- [x] Path to Victory - simpler visual layout
- [x] My Picks - fixed "Unknown" for Championship picks
- [x] Email safety guard removed (can email anyone)
- [x] Email copy polish (warmer subjects, "what happens next")
- [x] Entry completion nudges on manage page
- [x] Pool Notes for commissioners

---

## Pending Work (From Conversation)

### Pool Notes (Ready to Deploy)
- [x] Add `notes` text field to pools table
- [x] Editable on manage page
- [x] Shown on pool summary (to participants)
- [x] Examples: "Loser buys pizza", "House rules"

**SQL:**
```sql
ALTER TABLE pools ADD COLUMN IF NOT EXISTS notes TEXT;
```

---

## New Roadmap Items

### v2.2 — Documentation & Guides

**User-Facing Docs** (~4 hours)
- [ ] "How to run a family pool" guide
- [ ] "How seasons work" explainer  
- [ ] "What PickCrown is not" (vibe doc)

**Commissioner/Admin Docs** (~6 hours)
- [ ] Archive workflow guide
- [ ] CSV import guide (categories & brackets)
- [ ] Season setup guide
- [ ] Bracket with byes guide (CFB Playoff)
- [ ] Complex event templates

**Location:** Create `/docs` folder in project or standalone notion/markdown docs

---

## Updated Roadmap Summary

| Version | Focus | Status |
|---------|-------|--------|
| v1.0 | Launch | ✅ Complete |
| v1.5a | Quality of Life | ✅ Complete |
| v1.5b | Commissioner Power | ✅ Complete |
| v2.0 | Theatre & Polish | ✅ Complete |
| v2.1 | Byes, Visibility, Fixes | ✅ Complete |
| v2.2 | Documentation | 🔜 Next |
| v2.3 | Reuse & Longevity | ⏳ Future |

---

## Files to Deploy

### Email Polish + Entry Completion
```powershell
Copy-Item email-templates.js -Destination "lib\email-templates.js"
Copy-Item api\send-reminders\route.js -Destination "app\api\email\send-reminders\route.js"
Copy-Item api\send-results\route.js -Destination "app\api\email\send-results\route.js"
Copy-Item api\send-invites\route.js -Destination "app\api\email\send-invites\route.js"
Copy-Item api\send-reminder-incomplete\route.js -Destination "app\api\email\send-reminder-incomplete\route.js"
```

### Pool Notes
```powershell
Copy-Item pool-notes/manage-page.js -Destination "app\pool\[poolId]\manage\page.js"
Copy-Item pool-notes/pool-page.js -Destination "app\pool\[poolId]\page.js"
```

### Path to Victory + My Picks Fix
```powershell
Copy-Item my-picks-fix/standings-page.js -Destination "app\pool\[poolId]\standings\page.js"
Copy-Item my-picks-fix/MyPicksButton.js -Destination "components\MyPicksButton.js"
```

---

## Documentation Outline (v2.2)

### User Guides (Public)

**1. How to Run a Family Pool**
- Choosing an event
- Creating your pool
- Sharing the link
- Setting expectations
- Results and celebration

**2. How Seasons Work**
- What is a season?
- Joining a season
- Season standings
- Road to WrestleMania example

**3. What PickCrown Is Not**
- Not a betting platform
- Not a social network
- Not a public leaderboard
- Not a notification machine
- "Bragging rights only"

### Commissioner Guides (Internal/Admin)

**1. Archive Workflow**
- When to archive
- How to archive
- Viewing archived pools

**2. CSV Import Guide**
- Categories format
- Bracket format
- Common errors

**3. Season Setup**
- Creating a season
- Adding events
- Managing standings

**4. Bracket with Byes (CFB Playoff)**
- Creating bye matchups
- Setting up rounds
- Handling advancement
- Testing picks

**5. Event Templates**
- Oscars (pick-one + phases)
- March Madness (64-team bracket)
- CFB Playoff (12-team with byes)
- WrestleMania (hybrid)
