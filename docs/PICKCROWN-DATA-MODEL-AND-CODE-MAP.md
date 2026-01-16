# PickCrown Data Model & Code Map
**Updated:** January 9, 2025

---

## 📊 Database Schema (Supabase/PostgreSQL)

### Core Tables

```
┌─────────────────────────────────────────────────────────────────────┐
│                           SEASONS                                    │
├─────────────────────────────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY                                       │
│ name          TEXT NOT NULL                                          │
│ description   TEXT                                                   │
│ year          INTEGER                                                │
│ status        TEXT DEFAULT 'active'  (active, completed, archived)   │
│ created_at    TIMESTAMPTZ DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           EVENTS                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY                                       │
│ name          TEXT NOT NULL                                          │
│ year          INTEGER                                                │
│ event_type    TEXT NOT NULL (pick_one, bracket, hybrid, nfl_playoff) │
│ start_time    TIMESTAMPTZ NOT NULL (lock time)                       │
│ status        TEXT DEFAULT 'draft' (draft, open, locked, completed)  │
│ season_id     UUID REFERENCES seasons(id)                            │
│ open_date     TIMESTAMPTZ (when visible on homepage)                 │
│ archive_date  TIMESTAMPTZ (when auto-archived)                       │
│ uses_reseeding BOOLEAN DEFAULT FALSE (NFL-style reseeding)           │
│ created_at    TIMESTAMPTZ DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │ 1:N               │ 1:N               │ 1:N
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     PHASES       │  │   CATEGORIES     │  │     ROUNDS       │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ id         UUID  │  │ id         UUID  │  │ id         UUID  │
│ event_id   UUID  │  │ event_id   UUID  │  │ event_id   UUID  │
│ name       TEXT  │  │ name       TEXT  │  │ name       TEXT  │
│ phase_order INT  │  │ order_index INT  │  │ round_order INT  │
│ lock_time  TIME  │  │ points     INT   │  │ points     INT   │
│ status     TEXT  │  │ phase_id   UUID  │  │ created_at TIME  │
│ created_at TIME  │  │ type       TEXT  │  └──────────────────┘
└──────────────────┘  │ correct_option   │           │
                      │ created_at TIME  │           │ 1:N
                      └──────────────────┘           ▼
                               │           ┌──────────────────┐
                               │ 1:N       │    MATCHUPS      │
                               ▼           ├──────────────────┤
                      ┌──────────────────┐ │ id         UUID  │
                      │ CATEGORY_OPTIONS │ │ event_id   UUID  │
                      ├──────────────────┤ │ round_id   UUID  │
                      │ id         UUID  │ │ bracket_position │
                      │ category_id UUID │ │ team_a_id  UUID  │
                      │ name       TEXT  │ │ team_b_id  UUID  │
                      │ order_index INT  │ │ winner_team_id   │
                      │ is_correct BOOL  │ │ created_at TIME  │
                      │ created_at TIME  │ └──────────────────┘
                      └──────────────────┘          │
                                                    │ N:1
┌─────────────────────────────────────────────────────────────────────┐
│                           TEAMS                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY                                       │
│ event_id      UUID REFERENCES events(id)                             │
│ name          TEXT NOT NULL                                          │
│ seed          INTEGER                                                │
│ conference    TEXT (AFC, NFC, etc.)                                  │
│ region        TEXT (East, West, etc.)                                │
│ created_at    TIMESTAMPTZ DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           POOLS                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY                                       │
│ name          TEXT NOT NULL                                          │
│ event_id      UUID REFERENCES events(id)                             │
│ owner_email   TEXT                                                   │
│ owner_name    TEXT                                                   │
│ commissioner_id UUID REFERENCES commissioners(id)                    │
│ status        TEXT DEFAULT 'active' (active, archived)               │
│ notes         TEXT (commissioner notes shown to participants)        │
│ open_date     TIMESTAMPTZ                                            │
│ archive_date  TIMESTAMPTZ                                            │
│ created_at    TIMESTAMPTZ DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        POOL_ENTRIES                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ pool_id         UUID REFERENCES pools(id)                            │
│ email           TEXT NOT NULL                                        │
│ entry_name      TEXT NOT NULL                                        │
│ display_name    TEXT                                                 │
│ tie_breaker_value TEXT                                               │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
│ updated_at      TIMESTAMPTZ                                          │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │ 1:N               │ 1:N               │ 1:N
          ▼                    ▼                    ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  CATEGORY_PICKS     │ │  BRACKET_PICKS      │ │ ADVANCEMENT_PICKS   │
├─────────────────────┤ ├─────────────────────┤ ├─────────────────────┤
│ id          UUID    │ │ id            UUID  │ │ id            UUID  │
│ pool_entry_id UUID  │ │ pool_entry_id UUID  │ │ pool_entry_id UUID  │
│ category_id UUID    │ │ matchup_id    UUID  │ │ team_id       UUID  │
│ option_id   UUID    │ │ picked_team_id UUID │ │ round_id      UUID  │
│ created_at  TIME    │ │ entry_name    TEXT  │ │ created_at    TIME  │
└─────────────────────┘ │ created_at    TIME  │ └─────────────────────┘
                        └─────────────────────┘
```

### User & Commissioner Tables

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMMISSIONERS                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ email           TEXT UNIQUE NOT NULL                                 │
│ name            TEXT NOT NULL                                        │
│ avatar_url      TEXT                                                 │
│ bio             TEXT                                                 │
│ pools_created   INTEGER DEFAULT 0                                    │
│ is_verified     BOOLEAN DEFAULT FALSE                                │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
│ updated_at      TIMESTAMPTZ DEFAULT NOW()                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        PROFILES                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ email           TEXT UNIQUE NOT NULL                                 │
│ display_name    TEXT                                                 │
│ avatar_emoji    TEXT DEFAULT '👤'                                    │
│ avatar_color    TEXT DEFAULT '#3b82f6'                               │
│ notification_preferences JSONB                                       │
│ is_commissioner BOOLEAN DEFAULT FALSE                                │
│ commissioner_id UUID REFERENCES commissioners(id)                    │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
│ updated_at      TIMESTAMPTZ DEFAULT NOW()                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      AVATAR_PRESETS                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ emoji           TEXT NOT NULL                                        │
│ label           TEXT NOT NULL                                        │
│ color           TEXT NOT NULL                                        │
│ category        TEXT DEFAULT 'general'                               │
└─────────────────────────────────────────────────────────────────────┘
```

### NFL Reseeding Tables

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ADVANCEMENT_PICKS                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ pool_entry_id   UUID NOT NULL REFERENCES pool_entries(id)            │
│ team_id         UUID NOT NULL REFERENCES teams(id)                   │
│ round_id        UUID NOT NULL REFERENCES rounds(id)                  │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
│ UNIQUE(pool_entry_id, team_id, round_id)                             │
└─────────────────────────────────────────────────────────────────────┘
Meaning: "I pick [team] to advance past [round]"

┌─────────────────────────────────────────────────────────────────────┐
│                    TEAM_ELIMINATIONS                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ event_id        UUID NOT NULL REFERENCES events(id)                  │
│ team_id         UUID NOT NULL REFERENCES teams(id)                   │
│ eliminated_in_round_id UUID REFERENCES rounds(id)                    │
│ elimination_date TIMESTAMPTZ DEFAULT NOW()                           │
│ UNIQUE(event_id, team_id)                                            │
└─────────────────────────────────────────────────────────────────────┘
Tracks: Which teams are eliminated in which round
```

### System Tables

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EMAIL_LOG                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ pool_id         UUID REFERENCES pools(id)                            │
│ email_type      TEXT (invite, reminder, results, incomplete)         │
│ recipient_email TEXT                                                 │
│ status          TEXT (sent, failed)                                  │
│ metadata        JSONB                                                │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        FEEDBACK                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ email           TEXT                                                 │
│ type            TEXT (bug, feature, general)                         │
│ message         TEXT NOT NULL                                        │
│ page_url        TEXT                                                 │
│ user_agent      TEXT                                                 │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        AUDIT_LOG                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ action          TEXT (create, update, delete)                        │
│ entity_type     TEXT (event, pool, matchup, etc.)                    │
│ entity_id       UUID                                                 │
│ user_email      TEXT                                                 │
│ details         JSONB                                                │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Functions (RPC)

### calculate_standings(p_pool_id UUID)
Returns standings for a pool with rank, points, entry info.

### calculate_season_standings(p_season_id UUID)  
Returns cumulative standings across all events in a season.

### calculate_advancement_standings(p_pool_id UUID)
Returns standings for NFL-style advancement pick pools.

---

## 📁 Code Structure

```
pickcrown/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Homepage with email gate
│   ├── globals.css               # Global styles + CSS variables
│   ├── not-found.js              # 404 page
│   ├── error.js                  # Error boundary
│   │
│   ├── pool/
│   │   └── [poolId]/
│   │       ├── page.js           # Pool entry/pick form
│   │       ├── standings/page.js # Standings + Path to Victory + Final Results
│   │       ├── picks/page.js     # View all picks (post-lock, sorted by round)
│   │       ├── manage/page.js    # Commissioner manage page + notes
│   │       └── preview/page.js   # Pool preview (non-participants)
│   │
│   ├── season/
│   │   └── [seasonId]/
│   │       └── standings/page.js # Season standings
│   │
│   ├── commissioner/
│   │   ├── signup/page.js        # Commissioner registration
│   │   └── dashboard/page.js     # Commissioner pool management
│   │
│   ├── admin/
│   │   ├── page.js               # Admin dashboard
│   │   ├── layout.js             # Admin layout
│   │   ├── audit-log/page.js     # Audit log viewer
│   │   ├── events/
│   │   │   ├── new/page.js       # Create event
│   │   │   └── [eventId]/
│   │   │       ├── page.js       # Event details
│   │   │       ├── results/page.js
│   │   │       ├── bracket-setup/page.js
│   │   │       └── nfl-results/page.js  # NFL advancement results
│   │   ├── pools/page.js         # Pool list
│   │   └── seasons/page.js       # Season management
│   │
│   ├── archived/page.js          # Archived pools viewer
│   ├── feedback/page.js          # Feedback form
│   ├── find-my-pools/page.js     # Pool lookup by email
│   ├── about/page.js             # About page
│   │
│   └── api/
│       ├── events/               # Event CRUD
│       ├── pools/                # Pool CRUD + archive + export
│       ├── picks/                # Pick submission
│       ├── results/              # Results entry
│       ├── standings/            # Standings calculation
│       ├── seasons/              # Season management
│       ├── commissioners/        # Commissioner CRUD
│       ├── profiles/             # Profile CRUD
│       ├── categories/
│       │   └── import/route.js   # CSV import for categories
│       ├── email/
│       │   ├── send-invites/
│       │   ├── send-reminders/
│       │   ├── send-reminder-incomplete/
│       │   ├── send-results/
│       │   └── find-my-pools/
│       ├── feedback/             # Feedback submission
│       ├── advancement-picks/    # NFL advancement picks
│       └── eliminations/         # Team elimination tracking
│
├── components/
│   ├── PickSubmissionForm.js     # Category picks UI
│   ├── BracketPickForm.js        # Traditional bracket picks
│   ├── AdvancementPickForm.js    # NFL-style advancement picks
│   ├── MyPicksButton.js          # View my picks modal
│   ├── NFLMyPicksButton.js       # NFL advancement picks modal
│   ├── ScenarioSimulator.js      # What-if simulator
│   ├── EventPodium.js            # Gold/Silver/Bronze display
│   ├── EntriesList.js            # Entry list display
│   ├── PoolHeader.js             # Pool header with info
│   ├── PoolStatusBadge.js        # Status indicator
│   ├── ReinvitePoolButton.js     # Reinvite button
│   ├── SendResultsSection.js     # Results email UI
│   ├── UserAvatar.js             # Avatar display component
│   ├── CategoryImportUI.js       # CSV import modal
│   ├── NFLPathToVictory.js       # NFL advancement path display
│   ├── NFLBracketVisualization.js
│   ├── admin/
│   │   └── BulkResultsEntry.js   # Bulk results form
│   └── v2.4/                     # v2.4 visual refinement components
│       ├── Card.js
│       ├── EmptyState.js
│       ├── PageHeader.js
│       ├── StandingsTable.js
│       └── BracketScrollContainer.js
│
├── lib/
│   ├── supabase.js               # Client-side Supabase
│   ├── supabase-admin.js         # Admin Supabase (service key)
│   ├── supabase/server.js        # Server-side Supabase
│   ├── constants.js              # Event types, avatar presets
│   ├── utils.js                  # isEventLocked, formatDate, etc.
│   ├── phases.js                 # Phase helpers
│   ├── pool-helpers.js           # Pool utilities
│   └── email-templates.js        # Email HTML templates
│
├── styles/
│   ├── globals.css               # CSS variables, base styles
│   └── mobile-responsive.css     # Mobile-specific styles
│
├── docs/                         # Documentation
│   ├── README.md
│   ├── user-guides/
│   │   ├── how-to-run-a-family-pool.md
│   │   ├── how-seasons-work.md
│   │   └── what-pickcrown-is-not.md
│   └── admin-guides/
│       ├── archive-workflow.md
│       ├── csv-import-guide.md
│       ├── season-setup-guide.md
│       ├── bracket-with-byes-guide.md
│       ├── event-templates.md
│       └── nfl-advancement-guide.md
│
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── next.config.js                # Next.js config
└── package.json                  # Dependencies
```

---

## 🔗 Key Relationships

### Event Types
| Type | Uses Categories | Uses Bracket | Uses Advancement | Example |
|------|-----------------|--------------|------------------|---------|
| `pick_one` | ✅ | ❌ | ❌ | Oscars |
| `bracket` | ❌ | ✅ | ❌ | March Madness |
| `hybrid` | ✅ | ✅ | ❌ | WrestleMania |
| `nfl_playoff` | ❌ | ❌ | ✅ | NFL Playoffs |

### Entity Hierarchy
```
Season (optional)
  └── Event
        ├── Phases (for multi-phase events)
        ├── Categories → Category Options
        ├── Rounds → Matchups → Teams
        ├── Teams (with conference for NFL)
        └── Pools
              └── Pool Entries
                    ├── Category Picks
                    ├── Bracket Picks
                    └── Advancement Picks (NFL)
```

### Identity System
- **Email** is the identity key throughout
- Case-insensitive matching
- Same email across events = same person in season standings
- **Profiles** are optional enhancements (avatar, preferences)
- **Commissioners** are verified pool creators

---

## 🔌 API Summary

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events |
| POST | `/api/events` | Create event |
| GET | `/api/events/[id]` | Get event |
| PATCH | `/api/events/[id]` | Update event |
| POST | `/api/events/clone` | Clone event |
| POST | `/api/events/[id]/complete` | Mark complete |

### Pools
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pools` | List pools |
| POST | `/api/pools` | Create pool |
| GET | `/api/pools/[id]` | Get pool |
| PATCH | `/api/pools/[id]` | Update pool (incl. notes) |
| PATCH | `/api/pools/[id]/archive` | Archive pool |
| GET | `/api/pools/[id]/export` | Export CSV |
| POST | `/api/pools/[id]/reinvite` | Reinvite participants |

### Commissioners & Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commissioners?email=` | Get commissioner |
| POST | `/api/commissioners` | Register commissioner |
| PUT | `/api/commissioners` | Update commissioner |
| GET | `/api/profiles?email=` | Get profile |
| POST | `/api/profiles` | Create/update profile |
| PUT | `/api/profiles` | Update profile |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/send-invites` | Send pool invites |
| POST | `/api/email/send-reminders` | Send reminder to all |
| POST | `/api/email/send-reminder-incomplete` | Send to incomplete |
| POST | `/api/email/send-results` | Send results email |
| POST | `/api/email/find-my-pools` | Lookup by email |

### Results & Picks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/results` | Enter single result |
| POST | `/api/results/bulk` | Bulk results entry |
| POST | `/api/picks` | Submit picks |
| PUT | `/api/picks` | Update picks (before lock) |
| POST | `/api/categories/import` | CSV import categories |

### NFL Advancement
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/advancement-picks` | Submit advancement picks |
| GET | `/api/advancement-picks?entry_id=` | Get entry's picks |
| POST | `/api/eliminations` | Record team elimination |
| GET | `/api/eliminations?event_id=` | Get eliminations |

---

## 🎨 Key Components

### User-Facing
| Component | Purpose |
|-----------|---------|
| `PickSubmissionForm` | Category picks UI |
| `BracketPickForm` | Traditional bracket picks UI |
| `AdvancementPickForm` | NFL-style advancement picks |
| `MyPicksButton` | View my picks modal |
| `NFLMyPicksButton` | NFL advancement picks modal |
| `ScenarioSimulator` | What-if standings |
| `EventPodium` | Gold/Silver/Bronze display |
| `UserAvatar` | Avatar with emoji/color |
| `CategoryImportUI` | CSV import modal |

### Admin
| Component | Purpose |
|-----------|---------|
| `BulkResultsEntry` | Enter multiple results |
| `SendResultsSection` | Send results emails |

### v2.4 Visual Components
| Component | Purpose |
|-----------|---------|
| `Card` | Card, InfoCard, AlertCard |
| `EmptyState` | 8 illustrated variants |
| `PageHeader` | Header with breadcrumbs |
| `StandingsTable` | Desktop table + mobile cards |
| `BracketScrollContainer` | Horizontal scroll with hints |

---

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# SendGrid
SENDGRID_API_KEY=xxx
EMAIL_FROM=hello@pickcrown.app

# App
NEXT_PUBLIC_BASE_URL=https://pickcrown.vercel.app
NODE_ENV=production
```

---

## 📊 Scoring Logic

### Category Picks
- Each category has `points` (default 1)
- Correct pick = category points
- Total = sum of correct category points

### Bracket Picks
- Each round has `points` value
- Correct pick = round points
- Total = sum of correct picks × round points

### NFL Advancement Picks
- Each round has `points` value
- Points awarded if team advances PAST that round
- Team must not be eliminated in that round or earlier
- Survival rule: Can only pick team in round N if picked in round N-1

### Standings Calculation
1. Sum all correct picks × points
2. Rank by total points DESC
3. Ties allowed (same rank)
4. Tiebreaker field available but optional

---

## 🔄 Event Lifecycle

```
Draft → Open → Locked → In Progress → Completed → Archived
  │       │        │          │            │
  │       │        │          │            └── Results emails sent
  │       │        │          │                Path to Victory → Final Results
  │       │        │          └── Results being entered
  │       │        └── Picks locked, event started
  │       └── Accepting picks
  └── Setup phase, not visible
```

---

## 🎯 CSS Variables (v2.4)

```css
/* Colors */
--color-primary: #3b82f6;
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-danger: #ef4444;

/* Spacing (4px scale) */
--spacing-1 through --spacing-16

/* Typography */
--font-size-xs through --font-size-4xl
--font-normal, --font-medium, --font-semibold, --font-bold

/* Radius */
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-full

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl

/* Transitions */
--transition-fast: 150ms ease
--transition-normal: 200ms ease
```

---

## 📝 Notes

- All times stored in UTC
- Picks are append-only (immutable after lock)
- No user accounts required to participate
- Email is the sole identity mechanism
- Pools are private by default
- No public leaderboards or discovery
- Path to Victory shows during AND after events
- All picks pages sorted by round order
