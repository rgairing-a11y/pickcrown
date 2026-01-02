# PickCrown v2 Fixes

## Core Principle
**"Locked beats open. Seasons beat events. Now beats later."**

The homepage and admin page now answer ONE question immediately:
**"What is happening right now for me?"**

---

## New Homepage Hierarchy

### 1️⃣ Happening Now (Hero Section)
- Events that are locked or in progress
- Always pinned to the top, no scrolling
- Yellow highlight, impossible to miss

### 2️⃣ Your Seasons
- Seasons with active events first
- Events inside each season sorted: Locked → Open → Completed
- Collapsible cards with "Season Standings" link

### 3️⃣ Standalone Events
- Non-season events
- Sorted: Locked → Open → Completed

### 4️⃣ Pools You Manage
- Commissioner view
- Same sorting logic

---

## New Admin Page Hierarchy

### Filter Tabs
- All | Active | Completed

### 1️⃣ Happening Now
- Orange highlight hero section
- Events currently locked/in progress
- Expanded by default

### 2️⃣ Open for Picks
- Green badge events
- Upcoming, still accepting picks

### 3️⃣ Completed
- Historical events
- Collapsed by default

---

## Files to Deploy

| File | Copy To |
|------|---------|
| `homepage-v2.js` | `app/page.js` |
| `admin-page-v2.js` | `app/admin/page.js` |
| `archived-page.js` | `app/archived/page.js` |
| `matchups-api.js` | `app/api/matchups/route.js` |
| `admin-delete-api.js` | `app/api/admin/delete/route.js` |
| `test-delete-page.js` | `app/test-delete/page.js` |

---

## Quick Deploy

```bash
# Create directories
mkdir -p app/archived
mkdir -p app/api/admin/delete
mkdir -p app/test-delete

# Copy files (note: rename the v2 files)
cp homepage-v2.js app/page.js
cp admin-page-v2.js app/admin/page.js
cp archived-page.js app/archived/page.js
cp matchups-api.js app/api/matchups/route.js
cp admin-delete-api.js app/api/admin/delete/route.js
cp test-delete-page.js app/test-delete/page.js

# Deploy
git add .
git commit -m "fix: homepage/admin hierarchy - locked beats open, now beats later"
git push
```

---

## ⚠️ IMPORTANT: Delete Requires Service Role Key

For delete to work, add `SUPABASE_SERVICE_ROLE_KEY` to Vercel:

1. Supabase → Settings → API → Copy **service_role** key
2. Vercel → Settings → Environment Variables → Add `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy

Test at: `/test-delete`

---

## Other Fixes Included

### Archived Pools Page
- `/archived` - View and unarchive pools
- Link in homepage footer

### Bracket Advancement Fix
- No longer creates duplicate matchups
- Only updates EXISTING next-round matchups
- Bracket structure must be pre-defined

### Footer Links
- 📦 Archived
- 🔍 Find My Pools
- About PickCrown

---

## Already Exists (No Changes Needed)

| Feature | Location |
|---------|----------|
| "What should we call you?" | Both pick forms (display_name) |
| CSV Import | `/admin/events/[eventId]/import` |
| Archive/Unarchive | Pool manage → Danger Zone |
| Find My Pools | `/find-my-pools` |

---

## What This Buys You

### For Players
- Zero confusion
- No scrolling anxiety  
- Immediate reassurance: "I'm not missing anything"

### For Admins
- Faster management
- Less dread
- No "where is that pool?" moments

### For PickCrown
- Locks the season-first worldview
- Makes reuse feel intentional
- Reduces future feature pressure

**Hierarchy does the work. Always.**

---

## How to Use

### Archive a Pool
1. Go to pool manage page (`/pool/[id]/manage`)
2. Scroll down to "Danger Zone"
3. Click "Archive Pool"
4. Pool is now hidden from main dashboard

### View Archived Pools
1. Go to `/archived` (or click "📦 Archived" in footer)
2. Enter your email
3. See all your archived pools
4. Click "Unarchive" to restore

### Import Categories (CSV)
1. Go to event → Categories
2. Click "📥 Import from CSV" link
3. Paste CSV in format: `Category Name, Option Name` (one per line)
4. Preview and Import

### Bracket Setup (Important!)
For brackets to work correctly:
1. Create all rounds first (with correct `round_order`)
2. Create ALL matchups for ALL rounds (including empty later rounds)
3. Set `bracket_position` on each matchup
4. THEN enter results - winners will fill into existing slots

Example for 8-team bracket:
- Round 1: Create 4 matchups (positions 1,2,3,4) with team_a and team_b set
- Round 2: Create 2 matchups (positions 1,2) with team_a=null, team_b=null
- Round 3: Create 1 matchup (position 1) with team_a=null, team_b=null

When you set Round 1 winners:
- Position 1 winner → Round 2 Position 1, Team A slot
- Position 2 winner → Round 2 Position 1, Team B slot
- Position 3 winner → Round 2 Position 2, Team A slot
- Position 4 winner → Round 2 Position 2, Team B slot

---

## Database: Required for Bracket Fix

Run in Supabase SQL Editor:

```sql
-- Add bracket_position if missing
ALTER TABLE matchups ADD COLUMN IF NOT EXISTS bracket_position integer;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_matchups_round_position ON matchups(round_id, bracket_position);
```

---

## Existing Features (No Changes Needed)

1. **"What should we call you?"** - Already in PickSubmissionForm and BracketPickForm as `display_name`

2. **CSV Import** - Already at `/admin/events/[eventId]/import`
   - Format: Each row is `CategoryName, OptionName`
   - Multiple rows with same category name add options to that category

3. **Archive/Unarchive** - Already in pool manage page

4. **Find My Pools** - Email-based pool recovery at `/find-my-pools`
