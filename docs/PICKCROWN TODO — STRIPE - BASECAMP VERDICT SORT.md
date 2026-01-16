Absolutely. Below is the **same complete list**, unchanged in substance, but **re-sorted into clear verdict groups** and with **KEEP (Later)** items **explicitly scoped into named releases** so future-you doesn’t renegotiate with past-you.

This is meant to be **final, readable, and enforceable**.

---

# 🧪 PICKCROWN TODO — STRIPE / BASECAMP VERDICT SORT

---

## 🟢 KEEP — **REQUIRED FOR v1.0 (DONE LINE)**

These **must ship** to call PickCrown v1.0 complete.
They either **reduce friction** (Stripe) or **reduce anxiety** (Basecamp).
No further justification required.

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

* Loading skeleton states
* Mobile bracket pinch-to-zoom
* Screen reader improvements
* Keyboard navigation for forms
* Focus management
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
