# PickCrown Documentation

**Last Updated:** January 9, 2025

---

## Quick Start

| I want to... | Go to... |
|--------------|----------|
| Run a pool for my group | [How to Run a Family Pool](./user-guides/how-to-run-a-family-pool.md) |
| Understand seasons | [How Seasons Work](./user-guides/how-seasons-work.md) |
| Set up a bracket with byes | [Bracket with Byes Guide](./admin-guides/bracket-with-byes-guide.md) |
| Import categories via CSV | [CSV Import Guide](./admin-guides/csv-import-guide.md) |
| Become a commissioner | [Commissioner Signup](/commissioner/signup) |

---

## User Guides

Guides for pool participants and commissioners.

| Guide | Description |
|-------|-------------|
| [How to Run a Family Pool](./user-guides/how-to-run-a-family-pool.md) | Getting started with your first pool |
| [How Seasons Work](./user-guides/how-seasons-work.md) | Multi-event competitions explained |
| [What PickCrown Is Not](./user-guides/what-pickcrown-is-not.md) | Our philosophy and principles |

---

## Admin Guides

Technical guides for setting up and managing events.

| Guide | Description |
|-------|-------------|
| [Archive Workflow](./admin-guides/archive-workflow.md) | Managing pool lifecycle |
| [CSV Import Guide](./admin-guides/csv-import-guide.md) | Bulk importing categories and teams |
| [Season Setup Guide](./admin-guides/season-setup-guide.md) | Creating multi-event seasons |
| [Bracket with Byes Guide](./admin-guides/bracket-with-byes-guide.md) | CFB Playoff style brackets |
| [Event Templates](./admin-guides/event-templates.md) | Reference templates for all event types |
| [NFL Advancement Guide](./admin-guides/nfl-advancement-guide.md) | NFL playoff reseeding brackets |

---

## Technical Documentation

| Document | Description |
|----------|-------------|
| [Data Model & Code Map](./PICKCROWN-DATA-MODEL-AND-CODE-MAP.md) | Database schema, API routes, components |
| [TODO List](./TODO.md) | Current roadmap and pending work |
| [NFL Bracket Analysis](./NFL-BRACKET-ANALYSIS.md) | Technical spec for advancement picks |

---

## Quick Links

### URLs
- **Homepage:** `https://pickcrown.vercel.app`
- **Pool URL:** `https://pickcrown.vercel.app/pool/[poolId]`
- **Season standings:** `https://pickcrown.vercel.app/season/[seasonId]/standings`
- **Admin dashboard:** `https://pickcrown.vercel.app/admin`
- **Commissioner signup:** `https://pickcrown.vercel.app/commissioner/signup`
- **Commissioner dashboard:** `https://pickcrown.vercel.app/commissioner/dashboard`

### Event Types
| Type | Description | Example |
|------|-------------|---------|
| `pick_one` | Category-based predictions | Oscars, Emmy Awards |
| `bracket` | Tournament brackets | March Madness |
| `hybrid` | Categories + Bracket | WrestleMania, Super Bowl |
| `nfl_playoff` | Reseeding advancement | NFL Playoffs |

### Pool Status
| Status | Meaning |
|--------|---------|
| `active` | Pool is open or in progress |
| `archived` | Pool is completed and hidden |

### Event Lifecycle
```
Draft → Open → Locked → In Progress → Completed → Archived
```

---

## New Features (January 2025)

### Commissioner Accounts
- Register as a commissioner at `/commissioner/signup`
- Choose an emoji avatar with custom color
- Manage all your pools from `/commissioner/dashboard`
- See pool count and stats

### User Avatars
- 16 emoji avatar options with colors
- Shown on pools you commission
- Optional - not required to participate

### CSV Category Import
- Bulk import categories and options
- Drag & drop or paste CSV
- Preview before importing
- Two formats supported:
  - One option per row: `Category,Option`
  - All options in row: `Category,Opt1,Opt2,Opt3`

### Path to Victory → Final Results
- Shows during event as "Path to Victory"
- Shows after event as "Final Results"
- Winner highlighted with trophy
- Clear visual of final standings

### Improved Picks Page
- Sorted by round order (not random)
- Grouped by round with headers
- Shows points per round
- Cleaner visual hierarchy

### NFL Advancement Picks
- Support for reseeding brackets (NFL Playoffs)
- Pick teams to advance past each round
- Survival rule enforcement
- Automatic scoring based on eliminations

---

## Getting Help

1. **Check the relevant guide above**
2. **Look at similar past events** in the database
3. **Test in dev environment first**
4. **Use feedback form** at `/feedback`

---

## Deployment

### Deploy Documentation
```powershell
# Create docs folder structure
New-Item -ItemType Directory -Force -Path "docs"
New-Item -ItemType Directory -Force -Path "docs\user-guides"
New-Item -ItemType Directory -Force -Path "docs\admin-guides"

# Copy all docs
Copy-Item docs\*.md -Destination "docs\"
Copy-Item docs\user-guides\*.md -Destination "docs\user-guides\"
Copy-Item docs\admin-guides\*.md -Destination "docs\admin-guides\"

# Commit
git add docs
git commit -m "docs: update documentation"
git push
```

### Deploy Commissioner Features
```powershell
# 1. Run SQL migration in Supabase first!

# 2. API Routes
New-Item -ItemType Directory -Force -Path "app\api\commissioners"
New-Item -ItemType Directory -Force -Path "app\api\profiles"
Copy-Item commissioner-features\api-commissioners-route.js -Destination "app\api\commissioners\route.js"
Copy-Item commissioner-features\api-profiles-route.js -Destination "app\api\profiles\route.js"

# 3. Pages
New-Item -ItemType Directory -Force -Path "app\commissioner\signup"
New-Item -ItemType Directory -Force -Path "app\commissioner\dashboard"
Copy-Item commissioner-features\commissioner-signup-page.js -Destination "app\commissioner\signup\page.js"
Copy-Item commissioner-features\commissioner-dashboard-page.js -Destination "app\commissioner\dashboard\page.js"

# 4. Components
Copy-Item commissioner-features\UserAvatar.js -Destination "components\"
Copy-Item commissioner-features\CategoryImportUI.js -Destination "components\"

# 5. Commit
git add .
git commit -m "feat: commissioner signup and avatars"
git push
```

---

## Contributing

PickCrown follows these principles:

1. **Private by default** - No public pools or discovery
2. **Low pressure** - Fun over competition
3. **Minimal notifications** - Respect attention
4. **No gambling** - Bragging rights only
5. **Email identity** - No accounts required

Before adding a feature, ask:
- Does this add notification anxiety?
- Does this create winners and losers outside the game?
- Does this require moderation?
- Would this make someone hesitant to invite family?

If yes to any, don't build it.

---

**© 2025 PickCrown** • Built for fun, not profit
