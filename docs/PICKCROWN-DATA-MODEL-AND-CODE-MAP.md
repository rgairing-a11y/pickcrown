# PickCrown Data Model & Code Map
**Generated:** January 4, 2025

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
│ event_type    TEXT NOT NULL (pick_one, bracket, hybrid)              │
│ start_time    TIMESTAMPTZ NOT NULL (lock time)                       │
│ status        TEXT DEFAULT 'draft' (draft, open, locked, completed)  │
│ season_id     UUID REFERENCES seasons(id)                            │
│ open_date     TIMESTAMPTZ (when visible on homepage)                 │
│ archive_date  TIMESTAMPTZ (when auto-archived)                       │
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
│ phase_order INT  │  │ display_order    │  │ round_order INT  │
│ lock_time  TIME  │  │ points     INT   │  │ points     INT   │
│ status     TEXT  │  │ phase_id   UUID  │  │ created_at TIME  │
│ created_at TIME  │  │ correct_option   │  └──────────────────┘
└──────────────────┘  │ created_at TIME  │           │
                      └──────────────────┘           │ 1:N
                               │                     ▼
                               │ 1:N       ┌──────────────────┐
                               ▼           │    MATCHUPS      │
                      ┌──────────────────┐ ├──────────────────┤
                      │ CATEGORY_OPTIONS │ │ id         UUID  │
                      ├──────────────────┤ │ event_id   UUID  │
                      │ id         UUID  │ │ round_id   UUID  │
                      │ category_id UUID │ │ bracket_position │
                      │ name       TEXT  │ │ team_a_id  UUID  │
                      │ display_order    │ │ team_b_id  UUID  │
                      │ is_correct BOOL  │ │ winner_team_id   │
                      │ created_at TIME  │ │ created_at TIME  │
                      └──────────────────┘ └──────────────────┘
                                                    │
                                                    │ N:1
┌─────────────────────────────────────────────────────────────────────┐
│                           TEAMS                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY                                       │
│ event_id      UUID REFERENCES events(id)                             │
│ name          TEXT NOT NULL                                          │
│ seed          INTEGER                                                │
│ created_at    TIMESTAMPTZ DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           POOLS                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id            UUID PRIMARY KEY                                       │
│ name          TEXT NOT NULL                                          │
│ event_id      UUID REFERENCES events(id)                             │
│ owner_email   TEXT                                                   │
│ status        TEXT DEFAULT 'active' (active, archived)               │
│ notes         TEXT (commissioner notes)                              │
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
└─────────────────────────────────────────────────────────────────────┘
          │                              │
          │ 1:N                          │ 1:N
          ▼                              ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    CATEGORY_PICKS        │  │    BRACKET_PICKS         │
├──────────────────────────┤  ├──────────────────────────┤
│ id            UUID       │  │ id              UUID     │
│ pool_entry_id UUID       │  │ pool_entry_id   UUID     │
│ category_id   UUID       │  │ matchup_id      UUID     │
│ option_id     UUID       │  │ picked_team_id  UUID     │
│ created_at    TIMESTAMPTZ│  │ entry_name      TEXT     │
└──────────────────────────┘  │ created_at      TIMESTAMPTZ│
                              └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        EMAIL_LOG                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ pool_id         UUID REFERENCES pools(id)                            │
│ email_type      TEXT (invite, reminder, results)                     │
│ recipient_email TEXT                                                 │
│ status          TEXT (sent, failed)                                  │
│ metadata        JSONB                                                │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        COMMISSIONERS                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ email           TEXT UNIQUE NOT NULL                                 │
│ name            TEXT                                                 │
│ created_at      TIMESTAMPTZ DEFAULT NOW()                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        AUDIT_LOG                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                                     │
│ action          TEXT                                                 │
│ entity_type     TEXT                                                 │
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

---

## 📁 Code Structure

```
pickcrown/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Homepage
│   ├── globals.css               # Global styles
│   ├── not-found.js              # 404 page
│   ├── error.js                  # Error boundary
│   │
│   ├── pool/
│   │   └── [poolId]/
│   │       ├── page.js           # Pool entry/pick form
│   │       ├── standings/page.js # Standings + Path to Victory
│   │       ├── picks/page.js     # View all picks (post-lock)
│   │       ├── manage/page.js    # Commissioner manage page
│   │       └── preview/page.js   # Pool preview
│   │
│   ├── season/
│   │   └── [seasonId]/
│   │       └── standings/page.js # Season standings
│   │
│   ├── admin/
│   │   ├── page.js               # Admin dashboard
│   │   ├── layout.js             # Admin layout
│   │   ├── audit-log/page.js     # Audit log viewer
│   │   ├── events/
│   │   │   ├── new/page.js       # Create event
│   │   │   └── [eventId]/
│   │   │       ├── page.js       # Event detail
│   │   │       ├── edit/page.js  # Edit event
│   │   │       ├── categories/   # Manage categories
│   │   │       ├── rounds/       # Manage rounds
│   │   │       ├── teams/        # Manage teams
│   │   │       ├── matchups/     # Manage matchups
│   │   │       ├── bracket-setup/# Bracket setup wizard
│   │   │       ├── results/      # Enter results
│   │   │       ├── import/       # CSV import
│   │   │       └── clone/        # Clone event
│   │   ├── pools/
│   │   │   ├── new/page.js       # Create pool
│   │   │   └── [poolId]/
│   │   │       ├── edit/         # Edit pool
│   │   │       └── entries/      # View entries
│   │   └── seasons/
│   │       ├── page.js           # Seasons list
│   │       ├── new/page.js       # Create season
│   │       └── [seasonId]/       # Season detail
│   │
│   ├── archived/page.js          # Archived pools
│   ├── feedback/page.js          # Feedback form
│   ├── find-my-pools/page.js     # Find pools by email
│   ├── find-my-picks/page.js     # Find picks by email
│   │
│   └── api/                      # API Routes
│       ├── events/
│       │   ├── route.js          # GET/POST events
│       │   ├── clone/route.js    # Clone event
│       │   └── [eventId]/
│       │       ├── route.js      # GET/PATCH/DELETE event
│       │       └── complete/     # Mark complete
│       ├── pools/
│       │   ├── route.js          # GET/POST pools
│       │   └── [poolId]/
│       │       ├── route.js      # GET/PATCH/DELETE pool
│       │       ├── archive/      # Archive pool
│       │       ├── export/       # Export CSV
│       │       └── reinvite/     # Reinvite to new pool
│       ├── seasons/
│       │   ├── route.js          # GET/POST seasons
│       │   └── events/route.js   # Add event to season
│       ├── categories/
│       │   ├── route.js          # CRUD categories
│       │   └── import/route.js   # CSV import
│       ├── category-options/route.js
│       ├── rounds/route.js
│       ├── teams/route.js
│       ├── matchups/route.js
│       ├── results/
│       │   ├── route.js          # Enter single result
│       │   └── bulk/route.js     # Bulk results
│       ├── email/
│       │   ├── send-invites/     # Send pool invites
│       │   ├── send-reminders/   # Send reminders
│       │   ├── send-reminder-incomplete/
│       │   ├── send-results/     # Send results email
│       │   └── find-my-pools/    # Email lookup
│       ├── admin/
│       │   ├── delete/route.js   # Delete entities
│       │   └── import/route.js   # Admin import
│       ├── commissioners/route.js
│       ├── feedback/route.js
│       └── audit-log/route.js
│
├── components/
│   ├── BracketPickForm.js        # Bracket pick UI
│   ├── BracketView.js            # Bracket display
│   ├── CopyLinkButton.js         # Copy to clipboard
│   ├── EntriesList.js            # Entries list
│   ├── EventPodium.js            # Gold/Silver/Bronze
│   ├── Header.js                 # Site header
│   ├── MyPicksButton.js          # My Picks modal
│   ├── PickSubmissionForm.js     # Category picks form
│   ├── PrivatePoolMessage.js     # Private pool notice
│   ├── RecentPools.js            # Recent pools list
│   ├── ReinvitePoolButton.js     # Reinvite button
│   ├── ScenarioSimulator.js      # What-if simulator
│   ├── SendResultsSection.js     # Results email UI
│   ├── admin/
│   │   └── BulkResultsEntry.js   # Bulk results form
│   └── ui/                       # Reusable UI components
│       ├── Alert.js
│       ├── Button.js
│       ├── Card.js
│       ├── EmptyState.js
│       ├── FormField.js
│       ├── LoadingState.js
│       ├── PageHeader.js
│       └── index.js
│
├── lib/
│   ├── supabase.js               # Client-side Supabase
│   ├── supabase-admin.js         # Admin Supabase (service key)
│   ├── supabase/server.js        # Server-side Supabase
│   ├── constants.js              # Event types, etc.
│   ├── utils.js                  # isEventLocked, etc.
│   ├── phases.js                 # Phase helpers
│   ├── pool-helpers.js           # Pool utilities
│   └── email-templates.js        # Email HTML templates
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
│       └── event-templates.md
│
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── next.config.js                # Next.js config
├── package.json                  # Dependencies
└── tailwind.config.js            # Tailwind (if used)
```

---

## 🔗 Key Relationships

### Event Types
| Type | Uses Categories | Uses Bracket | Example |
|------|-----------------|--------------|---------|
| `pick_one` | ✅ | ❌ | Oscars |
| `bracket` | ❌ | ✅ | March Madness |
| `hybrid` | ✅ | ✅ | WrestleMania |

### Entity Hierarchy
```
Season (optional)
  └── Event
        ├── Phases (for multi-phase events)
        ├── Categories → Category Options
        ├── Rounds → Matchups → Teams
        └── Pools
              └── Pool Entries
                    ├── Category Picks
                    └── Bracket Picks
```

### Identity
- **Email** is the identity key throughout
- Case-insensitive matching
- Same email across events = same person in season standings

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
| PATCH | `/api/pools/[id]` | Update pool |
| PATCH | `/api/pools/[id]/archive` | Archive pool |
| GET | `/api/pools/[id]/export` | Export CSV |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/send-invites` | Send pool invites |
| POST | `/api/email/send-reminders` | Send reminder to all |
| POST | `/api/email/send-reminder-incomplete` | Send to incomplete |
| POST | `/api/email/send-results` | Send results email |
| POST | `/api/email/find-my-pools` | Lookup by email |

### Results
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/results` | Enter single result |
| POST | `/api/results/bulk` | Bulk results entry |

---

## 🎨 Key Components

### User-Facing
| Component | Purpose |
|-----------|---------|
| `PickSubmissionForm` | Category picks UI |
| `BracketPickForm` | Bracket picks UI |
| `MyPicksButton` | View my picks modal |
| `ScenarioSimulator` | What-if standings |
| `EventPodium` | Gold/Silver/Bronze display |

### Admin
| Component | Purpose |
|-----------|---------|
| `BulkResultsEntry` | Enter multiple results |
| `SendResultsSection` | Send results emails |

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
  │       │        │          └── Results being entered
  │       │        └── Picks locked, event started
  │       └── Accepting picks
  └── Setup phase, not visible
```

---

## 📝 Notes

- All times stored in UTC
- Picks are append-only (immutable after lock)
- No user accounts required to participate
- Email is the sole identity mechanism
- Pools are private by default
- No public leaderboards or discovery
