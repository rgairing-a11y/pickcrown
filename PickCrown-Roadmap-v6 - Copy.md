# PickCrown Master Product Document

Last Updated: December 30, 2024 (Late Night)

---

## 1. Foundation Locked — v1.5b Guardrails

This section is authoritative. All roadmap items, features, and future extensions must conform to the rules below. If a conflict exists, this section supersedes other language.

### 1.1 Overall Event Podium (Top 3)

PickCrown may compute and display an overall Gold / Silver / Bronze podium for a completed event across all pools.

**Rules:**
- Displayed only after the event is completed.
- Read-only recognition; no interaction.
- Shown in:
  - Event results email
  - Event results page
- No leaderboard beyond Top 3.
- This does not constitute a PickCrown-wide or global pool.

**Purpose:**
- Celebration, not competition.
- Recognition without ranking pressure.

### 1.2 Results Email Rules

For completed events, PickCrown sends a single results email.

**The results email must include:**
- Event winner summary.
- Overall Top 3 (Gold / Silver / Bronze) recognition.
- Link to full standings.

**The results email must not include:**
- Full embedded standings tables.
- Round-by-round breakdowns.
- Promotional or marketing content.

**Rationale:**
- Provides closure without noise.
- Celebrates winners without overwhelming recipients.

### 1.3 Season Enrollment Rules

Season participation is explicit and opt-in.

**Rules:**
- Joining an event or pool does not automatically enroll a user into an associated season.
- Users only see season standings if they have explicitly joined that season.
- Users who do not join a season are never exposed to season context or standings.

**Rationale:**
- Prevents unwanted comparison.
- Preserves relevance and clarity.

### 1.4 Pool Visibility and Privacy Rules

Pools are private by default.

**Non-participants may view:**
- Event name.
- Event date.
- Event status (Upcoming / Locked / Completed).

**Non-participants may not view:**
- Bracket structure.
- Picks.
- Standings.
- Scores.

**Messaging Rules:**
- Approved copy: “This pool is private.”
- Disallowed copy: Any instruction to contact or ask the commissioner.

**Rationale:**
- Eliminates commissioner overhead.
- Preserves social safety.

### 1.5 Bracket Model v1 Constraint

In v1.x, bracket events operate as classic locked brackets only.

**Rules:**
- Full bracket is submitted once.
- Picks never reopen.
- No loyalty mechanics, ladders, multipliers, or checkpoint-based bonuses are permitted.

Any loyalty-based or evolving-pick mechanics are explicitly deferred to future season-based products.

### 1.6 Entry Completion Indicator

**Description:**  
A lightweight indicator showing how many invited participants have submitted entries (for example, “18 of 22 submitted”).

**Purpose:**
- Reduce commissioner anxiety.
- Encourage completion without reminders or pressure.

**Constraints:**
- Aggregate counts only.
- No visibility into individual submission status.

### 1.7 Standings Visible in Zero-State

**Description:**  
Standings remain visible even before results are entered, displaying zero scores for all entries.

**Purpose:**
- Confirm successful submission.
- Reinforce that the pool is active and real.

**Constraints:**
- Calm, factual presentation.
- No placeholder copy implying progress or ranking.

### 1.8 Soft Lock Countdown (Text Only)

**Description:**  
Textual indicator showing time remaining before picks lock (for example, “Picks close in 1 day, 3 hours”).

**Purpose:**
- Reduce missed submissions.
- Provide awareness without urgency.

**Constraints:**
- Text only.
- No timers, animations, or color emphasis.

### 1.9 Mobile Horizontal Scroll Hint

**Description:**  
A subtle visual hint indicating horizontal scrolling is available when viewing wide brackets on mobile devices.

**Purpose:**
- Prevent confusion.
- Improve mobile usability without redesign.

**Constraints:**
- Minimal visual treatment.
- No tutorials or overlays.

### 1.10 Pool Summary Orientation Page

**Description:**  
A simple, read-only summary view providing:
- Event name.
- Pool name.
- Pick deadline.
- Number of entries.
- Link to standings (if available).

**Purpose:**
- Orient latecomers and link-clickers.
- Reduce “what is this?” confusion.

**Constraints:**
- No interaction.
- No marketing or promotional content.
- No exposure of picks or standings.

### 1.11 Out-of-Scope Clarification (Future Product)

Anonymous or secret-ballot voting systems (for example, elections or confidential votes) are out of scope for PickCrown.

Such systems represent a separate future product with different trust, privacy, and UX requirements and will not be implemented within PickCrown v1–v2.

1.12 Event Archetypes (LOCKED)

PickCrown supports a small set of canonical event archetypes.
All events must map cleanly to one (or a defined combination) of the following.

Event Archetypes (LOCKED):

Bracket — Single-elimination, round-based, cascading results

Pick-One — Category-based selections with no rounds

Hybrid — Combination of bracket + pick-one (e.g., WrestleMania)

Multi-Phase — Sequential phases (e.g., nominations → winners)

Rules:

Every event must declare its archetype at creation.

Archetypes determine allowed UI, scoring, and lifecycle behavior.

New archetypes require a version bump.

Purpose:
Prevents conceptual drift and one-off logic.

1.13 Pool Archetypes (LOCKED)

Pools describe who is playing together, not what is being played.

Pool Archetypes (LOCKED):

Private Pool — Default; invite-only, link-based

Season Pool — Opt-in cumulative participation across events

Global Pool — Explicitly out of scope for v1–v2

Rules:

All pools are private by default.

Season participation is always explicit and opt-in.

Global pools require a separate product decision.

Purpose:
Prevents confusion between pools, events, and seasons.

1.14 Event Lifecycle (LOCKED)

Events progress through a defined lifecycle.

Event Lifecycle States:

Draft → Open → Locked → In Progress → Completed → Archived

Rules:

Lifecycle state controls visibility and interaction.

Pools inherit state behavior from their parent event.

Archived events remain read-only.

Purpose:
Supports clarity across homepage, admin, and future automation.

1.15 Identity & Recovery Rules (LOCKED)

PickCrown uses email-only identity.

Rules:

Email address is the sole identity key.

No passwords.

Recovery is link-based only.

Users may request a “Your Pools” email at any time.

Recovery links expire after 24 hours.

Purpose:
Frictionless access without account pressure.
---

## 2. Core Product Principles

- Private-first.
- Invite-driven.
- Low-pressure.
- Commissioner burden minimized.
- Celebration over optimization.
- Event-centric, not account-centric.
- One canonical results source per event.
- Append-only picks for a built-in audit trail.
- Ties are acceptable and often preferable to over-optimized fairness.

2.4 Authority Boundaries (GUIDING)

PickCrown draws hard lines around authority.

Guiding Rules:

Commissioners facilitate; they do not control outcomes.

Admins may enter or correct results.

User picks are append-only and immutable after lock.

Fairness is enforced structurally, not socially.

Purpose:
Protects trust and reduces social tension.

---

## 3. Vibe Protection and Participation Rules

### 3.1 Vibe Protection Principle

PickCrown optimizes for shared fun, not personal validation. Any feature that amplifies ego, conflict, or adversarial behavior is disallowed by default.

**Survey signals:**
- “People taking it too seriously” → Keep it light.
- “Bad feelings” → Friendship over competition.
- “Too competitive” → Bragging rights only.
- “Notification anxiety” → Minimal contact.
- “Strangers would ruin it” → Private by default.

**Concrete rules:**
- No public/global leaderboards by default.
- No trash talk, comments, reactions, or chat.
- No political categories in official events.
- No forced comparisons (“you lost to X”).
- Neutral standings copy (e.g., “Rank” instead of “Crushed”).
- Private-by-default pools.

### 3.2 Spirit of the Game

PickCrown assumes good faith participation. The platform provides outcomes, not judgments.

**Implications:**
- No moderation tools or reporting systems.
- Trust-based, not policed.
- Tone nudges and copy do the work, not enforcement.

### 3.3 Participation Asymmetry

PickCrown assumes one initiator and many passive participants. The product must work even if most users never create a pool.

**Implications:**
- Advocate-friendly sharing is critical.
- No accounts required to participate.
- “Find My Picks” (or equivalent entry recovery) is important.
- Link-first UX.
- Do not over-invest in creator dashboards too early.

3.4 Visual Language (GUIDING)

PickCrown maintains a calm, inclusive visual tone.

Visual Language Guidelines:

Friendly, rounded shapes

Soft, neutral color palette

No red/green correctness signals

No confetti except for completed events

Calm, readable typography (not “sportsy”)

Purpose:
Reinforces low-pressure participation.

3.5 Specification Semantics (LOCKED)

Terms in this document carry specific meaning.

Legend:

LOCKED — Cannot change without a version bump

GUIDING — Strong recommendation; flexible

FUTURE — Explicitly out of scope for v1–v2

If ambiguity exists, LOCKED sections supersede all others.

3.6 Risks & Anti-Goals (GUIDING)

Known risks PickCrown actively avoids:

Feature creep

Commissioner overreach

Social pressure or embarrassment

Real-time expectation traps

Identity confusion

Competitive escalation

Rule:
If a feature meaningfully increases any of the above, it does not belong in v1–v2.

---

## 4. Privacy Defaults and Notification Minimalism

### 4.1 Privacy Default Rule

Pools are private, link-only, and invisible to non-invited users unless explicitly opted into a global pool (which is out of scope for v1–v2).

This supports:
- No public directory.
- Hesitant users who will play if invited but won’t browse.
- Non-initiators who never create pools.
- Future-proofing against “growth hack” discovery feeds.

### 4.2 Notification Minimalism

Emails are sent only when they are useful.

**Allowed:**
- Pick reminders (once per event).
- Results (once per event).

**Not allowed:**
- Newsletters.
- Marketing emails.
- Push notifications.
- “Someone joined your pool” alerts.
- Unrequested weekly digests.

Philosophy: Be helpful, not clingy.

---

## 5. Never Build (Unified List)

These features violate vibe protection, privacy, or simplicity, and are explicitly out of scope.

- Live scoring / play-by-play.
- In-app chat / trash talk.
- Public pool directories.
- Push notifications.
- Odds, spreads, or gambling hooks.
- Achievements, streaks, or badges.
- Social feeds, likes, or comments.
- AI predictions or tips.
- Required accounts for participation.
- Competitive copy (“crushed”, “destroyed”, “dominated”).
- Cash prizes as a core mechanic.
- Reactions/emojis on picks.
- Public profiles.
- “Trending topics” lists.
- Admin or system ability to edit user picks.
- Political categories in official events.

Before adding any feature, ask:

- Does this create winners and losers beyond the game?
- Could this embarrass someone publicly?
- Does this enable trolling or negativity?
- Does this add notification anxiety?
- Does this require moderation?
- Does this feel like a casino or social network?
- Would this make someone hesitant to invite family?

If any answer is “yes,” do not build it.

---

## 6. Data Model

### 6.1 Core Tables (Current)

- `events` — Competitions (Oscars, wrestling events, etc.).
- `seasons` — Multi-event groupings (e.g., Road to WrestleMania).
- `phases` — Multi-phase events (e.g., Oscars nominations vs winners).
- `rounds` — Bracket rounds with point values.
- `teams` — Selectable teams/options.
- `matchups` — Bracket matchups with winners.
- `categories` — Pick-one questions.
- `category_options` — Answer choices.
- `pools` — Private pool containers.
- `pool_entries` — Participants with email and entry name.
- `bracket_picks` — User bracket selections.
- `category_picks` — User category selections.
- `email_log` — Track sent emails.

### 6.2 Phases Table (Implemented)

Phases support multi-phase events like Oscars or World Cup.

Key invariants:
- Phases lock independently.
- Phase N+1 cannot open until Phase N is completed.
- Standings sum points across all phases.
- Single-phase events remain valid without phases (backward compatible).
- `phase_order` starts at 1 and is unique per event.

### 6.3 Seasons Table (Implemented)

Seasons group multiple events into a single standings context.

Key invariants:
- Season standings = sum of points per email across all season events.
- Email is the identity key (case-insensitive).
- Events can exist without a season.
- One event belongs to at most one season.

### 6.4 Future Tables

- `commissioners` — Email, name, created_at; used when commissioner signup is introduced.
- Event `open_date` column — Controls when events appear on the homepage vs when they lock.

---

## 7. Behavioral Rules

### 7.1 Multi-Phase Events

Use cases: Oscars (nominations → winners), World Cup (groups → knockout).

**Rules:**
- Phase transitions are explicit; admin sets status to `completed`.
- Each phase has its own lock time.
- Phase 2 (and beyond) only unlocks after the previous phase is completed.
- Late entries can join in later phases but receive zero points for earlier phases.
- Standings sum points across all phases.

### 7.2 Seasons

**Rules:**
- Identity key is email address.
- Points accumulate across all events in the season.
- Events entered is the count of distinct events where the user has an entry.
- Ranking is by total points descending, then entry name ascending.
- Ties are allowed and share the same rank.

### 7.3 Pool States

- Open — Event not locked; users can submit or edit picks (within allowed window).
- In Progress — Event locked, results incomplete; users can view standings.
- Completed — Results entered; users can view final standings.

### 7.4 Email Safety Guard

In non-production environments, emails are restricted to an allowlist to prevent accidental sends. In production, all emails are allowed.

---

## 8. UI Surfaces

### 8.1 Season Standings Page

Route: `/season/[seasonId]/standings`

Key elements:
- Season header (name, description).
- Stats (event count, participant count).
- Events list with status (upcoming, locked, completed).
- Standings table (rank, name, events entered, total points).

### 8.2 Pool → Season Link

When an event is part of a season, the pool standings page includes a link to the season standings.

### 8.3 Phase-Aware Pick Forms

Pick submission forms:
- Group categories by phase.
- Show locked phases as disabled with explanatory text.
- Only allow submission for open/unlocked phases.
- Calculate completion based on submittable categories only.

### 8.4 Commissioner Manage Page (v1.5+)

A commissioner dashboard for each pool may include:
- Pool and event summary.
- Shareable pool link.
- Entry list with completion status.
- Quick actions (view standings, send reminders, delete pool, etc.).

---

## 9. Roadmap Summary (v1.0–v2.0)

| Version | Focus              | Effort  | Status          |
|---------|--------------------|---------|-----------------|
| v1.0    | Launch             | —       | Complete        |
| v1.1    | Dev/Prod separation| ~1 hr   | Next            |
| v1.5a   | Quality of Life    | ~8 hrs  | Mostly complete |
| v1.5b   | Commissioner Power | ~12 hrs | Before next event |
| v1.5c   | Scale Up           | ~14 hrs | When others create pools |
| v1.5d   | Nice to Have       | ~12 hrs | When time permits |
| v2.0    | Theatre & Polish   | ~25 hrs | When core is solid |

Key insight: v1.5a + v1.5b (~20 hours) delivers most of the near-term value.

---

## 10. Completed Work (Highlights)

### 10.1 v1.0 Launch

- Production deployment live.
- Mobile flows tested.
- Email infrastructure configured with safety guard.
- Initial events and pools created (Oscars, SNME, Road to WrestleMania season).

### 10.2 Multi-Phase Events

- `phases` table created.
- Phase-aware lock logic implemented.
- Oscars 2025 event created with two phases (nominations and winners).
- Tests added for phase logic.

### 10.3 Seasons

- `seasons` table created.
- Season standings function implemented.
- Road to WrestleMania 42 season created with multiple events and pools.

### 10.4 v1.5a Quality of Life (Mostly Complete)

- New homepage with email gate and personalized sections.
- “Your Entries” and “Pools You Manage” sections.
- “View All Picks” matrix after lock.
- Commissioner manage page.
- Entry completion tracking.
- Feedback page and API.
- Send results API.
- Email pre-fill from localStorage.

---

## 11. Upcoming Versions

### 11.1 v1.1 — Dev/Prod Separation

- Separate Supabase projects for dev and prod.
- `dev` Git branch mapped to dev deployment.
- Branch-specific environment variables in Vercel.
- Apply email safety guard to results route.

### 11.2 v1.5a — Remaining Items

- Pool delete button on manage page.
- “Mark Event Complete” admin action.

### 11.3 v1.5b — Commissioner Power

- Commissioner dashboard.
- Pool reuse / reinvite.
- Popular picks indicator (post-lock).
- Bulk results entry.
- Entry editing window (up to a defined cutoff).
- Clone event from previous year.

### 11.4 v1.5c — Scale Up (Conditional)

- Commissioner signup flow.
- `commissioners` table.
- Create pool for event from homepage.
- “What’s New” events section.
- Personalized homepage.
- Admin pool/event setup UI (optional; Supabase dashboard works for now).

### 11.5 v1.5d — Nice to Have

- Server-saved drafts (beyond localStorage).
- CSV export.
- Pool status (Active/Archived).
- Admin audit log.
- Improved match/question layout.
- Bulk category/option entry (CSV import).

### 11.6 v2.0 — Theatre and Polish

- Scenario simulator.
- Path to victory.
- Standings moments.
- “Live” or “Updated” badge on standings.
- Champion status (alive/eliminated).
- Printable party sheets.
- Horizontal timeline brackets.
- Ticket/ballot aesthetic.
- Optional accounts and user icons (only if needed).
- Logged-in homepage dashboard.


v2.x — Post-Theatre Refinement (Non-Expansive)

The v2.x series represents incremental refinements to the PickCrown experience.
These versions do not introduce new product pillars.

v2.1 — Visual Refinement

Focus:
Make existing screens calmer, clearer, and more legible.

Examples (non-binding):

Spacing and typography tuning

Better empty states

Clearer hierarchy on standings pages

Improved mobile readability

Rule:
No new interaction patterns.

v2.2 — Narrative & Memory

Focus:
Strengthen PickCrown’s role as a shared moment, not a live game.

Examples (non-binding):

Pool Story summaries

Event Memory pages

Podium visual polish

Printable artifacts

Rule:
Read-only, celebratory, optional.

v2.3 — Reuse & Longevity

Focus:
Make reuse easier without increasing pressure.

Examples (non-binding):

Pool reuse / reinvite improvements

Archived event browsing

Clearer season transitions

Rule:
No social feeds. No discovery. No rankings beyond existing rules.

Guardrail for All v2.x Versions

No real-time features

No social comparison amplification

No account pressure

No competitive escalation

If a feature violates any of the above, it belongs outside PickCrown, not in v2.x.
---

## 12. Future Refinements and Parked Ideas

- Homepage refinements and entry gate UX tweaks.
- “Were you invited? Yes/No” fork.
- Mobile responsiveness improvements.
- Event `open_date` to control homepage visibility.
- Hiding far-future events (e.g., WrestleMania) until closer to open date.
- Global pools and public discovery remain parked due to vibe and complexity concerns.

---

## 13. Competitive Analysis

### 13.1 Competitive Positioning

PickCrown is the least stressful way to run something people care about.

It wins by being:
- Cleaner (no account-first bloat).
- Event-centric.
- Architecturally strong (canonical results, append-only picks).
- Private-first and low-pressure.

### 13.2 Competitive Tiers

- Tier 1: ESPN, Yahoo, CBS — account-first, ad-heavy, wrong philosophy.
- Tier 2: RunYourPool, OfficeFootballPool, PoolTracker — closer but dated, spreadsheet energy.
- Tier 3: Challonge, Battlefy, Smash.gg — event-centric but cold and organizer-only.

### 13.3 Where PickCrown Already Wins

- One canonical results source.
- Append-only picks.
- No live scoring chaos.
- Ties allowed.
- Hybrid events (e.g., wrestling plus yes/no props).

---

## 14. Operational Rules (Dev/Prod Separation)

- `main` branch → production deployment.
- `dev` branch → dev deployment.
- Separate Supabase projects and environment variables.
- Email safety guard blocks non-allowed emails in dev.

---

## 15. Database Tables and Schema (Summary)

See Section 6 for core tables and invariants. Future additions include:

- `commissioners` table.
- `open_date` on events for visibility control.

---

## 16. IDs, URLs, and Live Data (Examples)

- Oscars 2025 event and pool IDs.
- Road to WrestleMania 42 season and event IDs.
- Production URLs for key pools and season standings.

(Keep this section updated as a reference appendix, not as core spec.)

---

## 17. Appendix — Implementation Notes

- Phase logic helpers and tests.
- Email safety guard implementation.
- Bug fixes (fetch syntax, Supabase admin usage).
- File-level changes for homepage, manage pages, and APIs.

---

End of PickCrown Master Product Document.