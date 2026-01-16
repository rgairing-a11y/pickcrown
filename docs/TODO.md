# PickCrown Todo List
**Updated:** January 9, 2025

---

## 🚀 Ready to Deploy (This Session)

### 1. Commissioner Features
```powershell
# Run SQL migration first (001-commissioners-profiles-migration.sql)

# API Routes
New-Item -ItemType Directory -Force -Path "app\api\commissioners"
New-Item -ItemType Directory -Force -Path "app\api\profiles"
Copy-Item commissioner-features\api-commissioners-route.js -Destination "app\api\commissioners\route.js"
Copy-Item commissioner-features\api-profiles-route.js -Destination "app\api\profiles\route.js"

# Pages
New-Item -ItemType Directory -Force -Path "app\commissioner\signup"
New-Item -ItemType Directory -Force -Path "app\commissioner\dashboard"
Copy-Item commissioner-features\commissioner-signup-page.js -Destination "app\commissioner\signup\page.js"
Copy-Item commissioner-features\commissioner-dashboard-page.js -Destination "app\commissioner\dashboard\page.js"

# Components
Copy-Item commissioner-features\UserAvatar.js -Destination "components\"
Copy-Item commissioner-features\CategoryImportUI.js -Destination "components\"
```

### 2. Bug Fixes
```powershell
# Standings page - Path to Victory shows on completed events
Copy-Item standings-page-fixed.js -Destination "app\pool\[poolId]\standings\page.js"

# Picks page - sorted by round order with round headers
Copy-Item picks-page-fixed.js -Destination "app\pool\[poolId]\picks\page.js"
```

### 3. v2.4 Visual Refinement Package
```powershell
# CSS Variables
Copy-Item v2.4-visual-refinement\globals.css -Destination "app\globals.css"
Copy-Item v2.4-visual-refinement\mobile-responsive.css -Destination "styles\mobile-responsive.css"

# New Components
Copy-Item v2.4-visual-refinement\*.js -Destination "components\v2.4\"
```

---

## ✅ Completed (Recent Sessions)

### January 9, 2025
- [x] Commissioner signup flow with avatar selection
- [x] Commissioners table schema
- [x] Profiles table with emoji avatars
- [x] CSV Import UI component (CategoryImportUI)
- [x] Path to Victory shows on completed events ("Final Results")
- [x] Picks page sorted by round_order (not UUID)
- [x] Picks page grouped by round with headers
- [x] React key error fix in picks page
- [x] v2.4 Visual refinement CSS variables
- [x] v2.4 Component library (Card, EmptyState, PageHeader, etc.)

### January 3-8, 2025
- [x] NFL advancement picks system (schema + components)
- [x] AdvancementPickForm with survival rule
- [x] NFLMyPicksButton component
- [x] NFLPathToVictory component
- [x] Team eliminations tracking
- [x] Entry editing feature (update picks before deadline)
- [x] Entry editing API route
- [x] Olympics categories RLS fix
- [x] CSV import column name fix
- [x] Season standings 404 fix

### Earlier Sessions
- [x] CFB Bracket emergency fix
- [x] Path to Victory redesign
- [x] Email copy polish
- [x] Pool notes for commissioners
- [x] 8 documentation guides
- [x] Feedback form with dev mode
- [x] Comprehensive data model backup
- [x] v2.0 Theatre & Polish features
- [x] Scenario simulator
- [x] Champion status (alive/eliminated)
- [x] Popular picks indicator
- [x] Multi-phase events (Oscars style)
- [x] Seasons and season standings
- [x] Homepage with email gate
- [x] Archived pools page
- [x] Pool visibility windows

---

## 📋 Pending Work

### High Priority (Should Do Soon)

#### Commissioner UX
- [ ] Add commissioner badge to pool pages
- [ ] Show commissioner avatar on pool header
- [ ] Commissioner profile edit page
- [ ] "Edit Profile" link on homepage when logged in

#### Entry Editing Improvements  
- [ ] Visual indicator when entry has been edited
- [ ] Edit history/audit trail for entries
- [ ] Deadline enforcement (no edits X hours before lock)
- [ ] Confirmation modal before saving edits

#### CSV Import Enhancement
- [ ] Add CategoryImportUI to admin event page
- [ ] Teams CSV import UI
- [ ] Matchups CSV import UI
- [ ] Import validation preview improvements
- [ ] Error recovery (partial imports)

### Medium Priority (v2.5)

#### Pool Management
- [ ] Clone pool for new event (same participants)
- [ ] Pool templates (save common settings)
- [ ] Bulk delete archived pools
- [ ] Pool transfer (change commissioner)

#### Event Management
- [ ] Clone event from admin UI (not just SQL)
- [ ] Event templates in admin
- [ ] Bulk team import from admin
- [ ] Auto-advance teams in bracket after results

#### User Experience
- [ ] Loading skeleton states
- [ ] Better error messages with recovery suggestions
- [ ] Undo confirmation on destructive actions
- [ ] Keyboard shortcuts for admin actions
- [ ] Mobile bracket pinch-to-zoom

#### Season Improvements
- [ ] Explicit season enrollment UI (opt-in button)
- [ ] Season leaderboard notifications
- [ ] Season completion celebration
- [ ] "Your season rank" on pool pages

### Lower Priority (v2.6+)

#### Visual Refinement
- [ ] Dark mode support
- [ ] Printable bracket sheets
- [ ] Printable standings PDF
- [ ] Ticket/ballot aesthetic for picks
- [ ] Animation improvements (page transitions)

#### Accessibility
- [ ] Screen reader improvements
- [ ] Keyboard navigation for all forms
- [ ] Focus management
- [ ] Color contrast audit
- [ ] ARIA labels audit

#### Analytics & Monitoring
- [ ] Admin metrics dashboard
- [ ] Pool engagement stats
- [ ] Email delivery tracking
- [ ] Error logging improvements
- [ ] Performance monitoring

#### Technical Debt
- [ ] Rate limiting on public APIs
- [ ] Input validation improvements
- [ ] Test coverage for critical paths
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database query optimization

### Future Considerations (v3.0+)

#### New Event Types
- [ ] Round robin tournaments
- [ ] Double elimination brackets
- [ ] Swiss-system tournaments
- [ ] Pick'em with spreads (no money)
- [ ] Survivor pool format

#### Social (Careful - Per Roadmap)
- [ ] Optional pool chat (commissioner opt-in)
- [ ] Reaction emojis on picks (post-lock only)
- [ ] Pool story/recap generation
- [ ] Share results to social media

#### Platform
- [ ] Progressive Web App (PWA)
- [ ] Email verification flow
- [ ] Account deletion/data export
- [ ] API rate limiting per user
- [ ] Webhook integrations

---

## 🚫 Never Build (Per Roadmap)

- Live scoring / play-by-play
- Public pool directories
- Push notifications
- Odds, spreads, or gambling mechanics
- Achievements, streaks, or badges
- AI predictions or tips
- Required accounts for participation
- Competitive copy ("crushed", "destroyed")
- Cash prizes as a core mechanic
- Public profiles or discovery
- Admin ability to edit user picks
- Political categories in official events
- In-app advertising

---

## 📊 Version Summary

| Version | Focus | Status |
|---------|-------|--------|
| v1.0 | Launch | ✅ Complete |
| v1.5a | Quality of Life | ✅ Complete |
| v1.5b | Commissioner Power | ✅ Complete |
| v2.0 | Theatre & Polish | ✅ Complete |
| v2.1 | Byes, Visibility, Fixes | ✅ Complete |
| v2.2 | Documentation | ✅ Complete |
| v2.3 | NFL Advancement | ✅ Complete |
| v2.4 | Visual Refinement | 🚀 Ready to Deploy |
| v2.5 | Commissioner UX | 🚀 Ready to Deploy |
| v2.6 | Pool Management | 📋 Next |
| v2.7 | Mobile & Accessibility | 📋 Future |

---

## 🎯 Immediate Next Actions

1. **Deploy Commissioner Features**
   - Run SQL migration
   - Copy API routes
   - Copy pages and components
   
2. **Deploy Bug Fixes**
   - standings-page-fixed.js (Path to Victory)
   - picks-page-fixed.js (round ordering)

3. **Test**
   - Commissioner signup flow
   - Avatar selection and display
   - CSV category import
   - Path to Victory on completed events
   - Picks page round sorting

4. **Document**
   - Update README with commissioner signup
   - Add CSV import instructions to admin guide

---

## 📁 Files Created This Session

```
/mnt/user-data/outputs/
├── commissioner-features/
│   ├── 001-commissioners-profiles-migration.sql
│   ├── commissioner-signup-page.js
│   ├── commissioner-dashboard-page.js
│   ├── api-commissioners-route.js
│   ├── api-profiles-route.js
│   ├── api-categories-import-route.js
│   ├── UserAvatar.js
│   ├── CategoryImportUI.js
│   └── README.md
├── standings-page-fixed.js
├── picks-page-fixed.js
├── v2.4-visual-refinement/
│   ├── globals.css
│   ├── mobile-responsive.css
│   ├── Card.js
│   ├── EmptyState.js
│   ├── PageHeader.js
│   ├── StandingsTable.js
│   ├── BracketScrollContainer.js
│   └── README.md
└── docs/
    ├── PICKCROWN-DATA-MODEL-AND-CODE-MAP.md
    ├── TODO.md
    └── README.md
```

---

## 💡 Ideas Parking Lot

Things to consider but not commit to:

- **Pool Challenges** - Side bets between participants (no money)
- **Bracket Art** - Custom bracket backgrounds/themes
- **Voice Picks** - Submit picks via voice assistant
- **Watch Party Mode** - Synchronized standings updates
- **Charity Pools** - Donate to winner's charity of choice
- **Corporate Tier** - White-label for company events
- **API Access** - Let developers build on PickCrown
- **Mobile App** - Native iOS/Android (probably not needed)

---

## 📝 Notes

- All times stored in UTC
- Picks are append-only (immutable after lock)
- No user accounts required to participate
- Email is the sole identity mechanism
- Pools are private by default
- Path to Victory now shows on completed events as "Final Results"
- Commissioner features ready but need deployment
- v2.4 CSS variables provide foundation for future refinement
