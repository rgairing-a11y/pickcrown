# PickCrown Todo List
**Updated:** January 3, 2025

---

## 🚀 Ready to Deploy (This Session)

These files are created and ready to copy into your project:

### 1. Database Migration
```sql
ALTER TABLE pools ADD COLUMN IF NOT EXISTS notes TEXT;
```

### 2. Deploy Files

```powershell
# Path to Victory + My Picks fix
Copy-Item my-picks-fix/standings-page.js -Destination "app\pool\[poolId]\standings\page.js"
Copy-Item my-picks-fix/MyPicksButton.js -Destination "components\MyPicksButton.js"

# Email routes (safety guard removed + polished copy)
Copy-Item send-reminders-route.js -Destination "app\api\email\send-reminders\route.js"
Copy-Item email-polish/api/send-results/route.js -Destination "app\api\email\send-results\route.js"
Copy-Item email-polish/api/send-invites/route.js -Destination "app\api\email\send-invites\route.js"
Copy-Item email-polish/api/send-reminder-incomplete/route.js -Destination "app\api\email\send-reminder-incomplete\route.js"
Copy-Item email-polish/email-templates.js -Destination "lib\email-templates.js"

# Pool Notes + Entry Completion Nudges
Copy-Item pool-notes/manage-page.js -Destination "app\pool\[poolId]\manage\page.js"
Copy-Item pool-notes/pool-page.js -Destination "app\pool\[poolId]\page.js"

# Documentation
New-Item -ItemType Directory -Force -Path "docs\user-guides"
New-Item -ItemType Directory -Force -Path "docs\admin-guides"
Copy-Item docs\README.md -Destination "docs\README.md"
Copy-Item docs\user-guides\*.md -Destination "docs\user-guides\"
Copy-Item docs\admin-guides\*.md -Destination "docs\admin-guides\"

# Commit
git add .
git commit -m "feat: pool notes, email polish, path to victory fix, documentation"
git push
```

---

## ✅ Completed (This Session)

- [x] CFB Bracket picks emergency fix
- [x] Path to Victory - simpler visual layout
- [x] My Picks - fixed "Unknown" for Championship
- [x] Email safety guard removed (can email anyone)
- [x] Email copy polish (warmer subjects, "what happens next")
- [x] Entry completion nudges ("18 of 22 submitted")
- [x] Pool Notes for commissioners
- [x] Documentation - 3 user guides
- [x] Documentation - 5 admin guides

---

## ✅ Previously Completed

- [x] v1.0 Launch
- [x] v1.5a Quality of Life
- [x] v1.5b Commissioner Power
- [x] v2.0 Theatre & Polish
- [x] v2.1 Byes, Visibility, Bracket Fixes
- [x] Multi-phase events (Oscars style)
- [x] Seasons and season standings
- [x] Scenario simulator
- [x] Champion status (alive/eliminated)
- [x] Popular picks indicator
- [x] Homepage with email gate
- [x] Archived pools page
- [x] Pool visibility windows (open_date/archive_date)

---

## 📋 Remaining Work

### v2.3 — Reuse & Longevity (~8 hrs)
- [ ] Pool reuse / reinvite improvements
- [ ] Clone event from previous year (admin UI)
- [ ] Clearer season transitions
- [ ] Archived event browsing improvements

### v2.4 — Visual Refinement (~6 hrs)
- [ ] Spacing and typography tuning
- [ ] Better empty states
- [ ] Clearer hierarchy on standings pages
- [ ] Improved mobile readability
- [ ] Bracket horizontal scroll improvements

### Nice to Have (When Time Permits)
- [ ] Server-saved drafts (beyond localStorage)
- [ ] CSV export of standings
- [ ] Admin audit log viewer
- [ ] Bulk category/option entry (CSV import UI)
- [ ] Printable party sheets
- [ ] Ticket/ballot aesthetic

### Future Considerations (Not v2.x)
- [ ] Commissioner signup flow (when others create pools)
- [ ] `commissioners` table
- [ ] Create pool from homepage
- [ ] Optional accounts and user icons

---

## 🚫 Never Build (Per Roadmap)

- Live scoring / play-by-play
- In-app chat / trash talk
- Public pool directories
- Push notifications
- Odds, spreads, or gambling hooks
- Achievements, streaks, or badges
- Social feeds, likes, or comments
- AI predictions or tips
- Required accounts for participation
- Competitive copy ("crushed", "destroyed")
- Cash prizes as a core mechanic
- Public profiles
- Admin ability to edit user picks
- Political categories in official events

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
| v2.3 | Reuse & Longevity | 📋 Next |
| v2.4 | Visual Refinement | 📋 Future |

---

## 🎯 Immediate Next Actions

1. **Run SQL migration** for pool notes
2. **Deploy all files** using script above
3. **Test** pool notes, email sending, My Picks display
4. **Verify** CFB standings are correct after picks fix

---

## 📁 Files Created This Session

```
/mnt/user-data/outputs/
├── send-reminders-route.js
├── roadmap-update.md
├── my-picks-fix/
│   ├── standings-page.js
│   └── MyPicksButton.js
├── email-polish/
│   ├── README.md
│   ├── email-templates.js
│   ├── manage-page.js (older version)
│   └── api/
│       ├── send-reminders/route.js
│       ├── send-results/route.js
│       ├── send-invites/route.js
│       └── send-reminder-incomplete/route.js
├── pool-notes/
│   ├── README.md
│   ├── manage-page.js (latest with notes + nudges)
│   └── pool-page.js
├── cfb-fix-picks/
│   ├── README.md
│   ├── diagnostic.sql
│   └── ... (earlier CFB fix files)
└── docs/
    ├── README.md
    ├── user-guides/
    │   ├── how-to-run-a-family-pool.md
    │   ├── how-seasons-work.md
    │   └── what-pickcrown-is-not.md
    └── admin-guides/
        ├── archive-workflow.md
        ├── csv-import-guide.md
        ├── season-setup-guide.md
        ├── bracket-with-byes-guide.md
        └── event-templates.md
```
