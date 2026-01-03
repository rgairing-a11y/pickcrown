# PickCrown Documentation

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

---

## Quick Links

- **Pool URL format:** `https://pickcrown.vercel.app/pool/[poolId]`
- **Season standings:** `https://pickcrown.vercel.app/season/[seasonId]/standings`
- **Admin dashboard:** `https://pickcrown.vercel.app/admin`

---

## Need Help?

1. Check the relevant guide above
2. Look at similar past events in the database
3. Test in dev environment first

---

## Deployment

To deploy these docs to your project:

```powershell
# Create docs folder
New-Item -ItemType Directory -Force -Path "docs"
New-Item -ItemType Directory -Force -Path "docs\user-guides"
New-Item -ItemType Directory -Force -Path "docs\admin-guides"

# Copy all docs
Copy-Item docs\README.md -Destination "docs\README.md"
Copy-Item docs\user-guides\* -Destination "docs\user-guides\"
Copy-Item docs\admin-guides\* -Destination "docs\admin-guides\"

# Commit
git add docs
git commit -m "docs: add user and admin guides"
git push
```
