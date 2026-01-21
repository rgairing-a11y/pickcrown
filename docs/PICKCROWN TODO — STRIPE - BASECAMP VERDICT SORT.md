Absolutely. Below is the **same complete list**, unchanged in substance, but **re-sorted into clear verdict groups** and with **KEEP (Later)** items **explicitly scoped into named releases** so future-you doesn’t renegotiate with past-you.

This is meant to be **final, readable, and enforceable**.

---

# 🧪 PICKCROWN TODO — STRIPE / BASECAMP VERDICT SORT

From Envt separation:
Perfect instinct. This is exactly the kind of thing that **belongs on a durable TODO**, not rattling around in your head.

Here’s a clean, copy-ready **new TODO entry** you can drop straight into your master list / roadmap. It’s structured so Future-You knows **what**, **why**, and **how safe** it is.

---


---

If you want, next we can:

* Add this into your **v2.3 Stability bucket**
* Convert it into a **reusable fetch helper**
* Or do a quick sweep to flag other similar assumptions now that DEV is live
---
🧱 TODO — Refactor Admin Event Creation to Remove Service Role Dependency

Category: Architecture / Security Hardening
Priority: Medium (post-DEV stabilization)
Status: Deferred by design (intentional)

Problem

Admin event creation currently relies on the Supabase service role key inside API routes.
This works, but increases:

environment complexity

secret surface area

risk during local/DEV development

It also caused DEV failures when the service role key was intentionally omitted.

Goal

Allow standard admin actions (e.g., creating events) to run using the anon Supabase client, with permissions enforced via Row Level Security (RLS) instead of privileged keys.

Service role usage should be reserved only for:

background jobs

system maintenance

migrations

truly non-user-initiated operations

Planned Changes
1️⃣ Replace service-role usage in admin routes

Remove supabaseAdmin from:

/api/events

/api/admin/* routes that represent normal admin UI actions

Use the standard Supabase client (anon key) instead

2️⃣ Enforce permissions via RLS

Define clear RLS policies such as:

“Only admins can insert into events”

Avoid bypassing RLS with service role for UI-driven actions

3️⃣ Reduce environment secret requirements

Remove SUPABASE_SERVICE_ROLE_KEY dependency for:

local development

DEV environment

Keep service role keys isolated to:

PROD-only

server-only contexts where truly required

Why This Is Deferred

Current priority is DEV usability and momentum

Temporary service-role usage is acceptable while:

EMAIL is disabled in DEV

environments are fully separated

Refactor will be simpler and safer once admin flows are stable

Completion Criteria

 Admin event creation works without service role key

 RLS policies correctly gate admin actions

 DEV can run with zero privileged Supabase keys

 Service role usage documented and minimized

Notes

This is an architecture cleanup, not a bug fix.
Deferring this work is intentional and aligned with development pacing.
---
Design a safe, repeatable process for selectively copying non-user prod tables into DEV (events, categories, rounds), without full DB cloning.
---

---

---

---

---

---

---

---
















---

## 🟢 KEEP — **REQUIRED FOR v1.0 (DONE LINE)**

These **must ship** to call PickCrown v1.0 complete.
They either **reduce friction** (Stripe) or **reduce anxiety** (Basecamp).
No further justification required.


* Loading skeleton states
* Mobile bracket pinch-to-zoom
* Focus management




### Commissioner UX (Orientation & Trust)

* Add commissioner badge to pool pages
* Show commissioner avatar on pool header

---


---

### CSV Import (Finish What Exists)

* Add CategoryImportUI to admin event page
* Import validation preview improvements

---

### Pool Reuse (Retention Without Pressure)

* Clone pool for new event (same participants)

---




---

## 🛑 **v1.0 = DONE** WHEN ALL ABOVE ARE COMPLETE

Anything below this line is **explicitly optional**.

---

# 🟡 KEEP — **v1.1 / v1.2 (POLISH & COMPLETENESS)**

These improve calmness, confidence, and finish — but **nothing breaks without them**.







### v1.1 — *Confidence & Transparency*

* Visual indicator when entry has been edited
* Edit history / audit trail for entries
* Undo confirmation on destructive actions

---

### v1.2 — *Admin Comfort (Low Risk)*

* Commissioner profile edit page
* “Edit Profile” link on homepage when logged in
* Error recovery (partial CSV imports)

---

# 🟡 KEEP — **v1.3 / v1.4 (REUSE & LONGEVITY)**

These support repeat use without introducing pressure.

### v1.3 — *Reuse Expansion*

* Pool templates (save common settings)
* Event-level “Reuse This Setup” (admin only)

---

### v1.4 — *Lightweight Guidance*

* Gentle incomplete picks reminder (in-product only, neutral copy)
* Results summary snapshot (read-only, non-social)

---

# 🟡 KEEP — **v1.5+ (QUALITY OF LIFE / INFRA)**

Important eventually, but **do not justify delaying real usage**.

### UX & Accessibility
* Screen reader improvements
* Keyboard navigation for forms
* Color contrast audit
* ARIA labels audit

---

### Operational Hygiene

* Email delivery tracking
* Error logging improvements
* Performance monitoring
* Rate limiting on public APIs
* Account deletion / data export

---

### Output / Print

* Printable bracket sheets
* Printable standings PDF

---

# 🔴 CUT — **INDEFINITE (DO NOT SCHEDULE)**

These fail Stripe, Basecamp, or both **right now**.
They are not bad ideas — just **wrong timing or wrong incentives**.

### Admin / Power Features

* Bulk delete archived pools
* Pool transfer (change commissioner)
* Keyboard shortcuts for admin actions
* Clone event from admin UI
* Event templates in admin
* Bulk team import from admin
* Auto-advance teams in bracket after results

---

### Analytics / Metrics

* Admin metrics dashboard
* Pool engagement stats

---

### Visual / Aesthetic

* Dark mode support
* Ticket/ballot aesthetic for picks
* Animation improvements (page transitions)

---

### Platform / API

* API documentation (OpenAPI/Swagger)
* Database query optimization (pre-scale)
* Progressive Web App (PWA)
* Webhook integrations
* API rate limiting per user

---

### New Event Types

* Round robin tournaments
* Double elimination brackets
* Swiss-system tournaments
* Pick’em with spreads
* Survivor pool format

---

# ❌ CUT — **PERMANENT (PHILOSOPHY VIOLATION)**

These violate **vibe protection** and should not be reconsidered without a new product.

* Season leaderboard notifications
* “Your season rank” on pool pages
* Pool engagement stats
* Share results to social media

---

# ✅ FINAL SUMMARY (THIS IS THE CONTRACT)

* **v1.0** = clarity, trust, reuse, calm
* **v1.1–1.4** = polish and longevity
* **Everything else** = consciously unscheduled



NEW DONE:
### Entry Editing (Fairness & Correctness)

* Deadline enforcement (no edits X hours before lock)
* Confirmation modal before saving edits
### Core UX & Safety

* Better error messages with recovery suggestions
* Input validation improvements

---

### Missing but Critical (Clarity Amplifiers)

* Pool “About / Rules” read-only panel
* Pre-lock “Your picks are saved” confirmation state
* Entry count context on pool page (aggregate only)
* Soft results completion indicator (“All results are final”)
