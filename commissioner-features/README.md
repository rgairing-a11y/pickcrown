# Commissioner Features Package

This package adds commissioner accounts, profiles with avatars, and bulk category import.

## What's Included

### 1. Database Migration (`001-commissioners-profiles-migration.sql`)
Run this in Supabase SQL Editor first. Creates:
- `commissioners` table - registered pool creators with avatars
- `profiles` table - optional user accounts with preferences
- `avatar_presets` table - fun emoji avatars to choose from
- RLS policies for security
- Triggers for pool count tracking

### 2. Commissioner Signup (`commissioner-signup-page.js`)
Multi-step signup flow:
1. Enter email & name
2. Choose avatar
3. Success + next steps

Location: `app/commissioner/signup/page.js`

### 3. Commissioner Dashboard (`commissioner-dashboard-page.js`)
Overview of all commissioner pools with:
- Pool stats
- Quick actions
- Pool management links

Location: `app/commissioner/dashboard/page.js`

### 4. API Routes
- `api-commissioners-route.js` → `app/api/commissioners/route.js`
- `api-profiles-route.js` → `app/api/profiles/route.js`
- `api-categories-import-route.js` → `app/api/categories/import/route.js`

### 5. Components
- `UserAvatar.js` - Avatar display with emoji/color
- `CategoryImportUI.js` - Bulk CSV import modal

---

## Deployment Instructions

### Step 1: Run Database Migration
```sql
-- Copy contents of 001-commissioners-profiles-migration.sql
-- Paste into Supabase SQL Editor and run
```

### Step 2: Copy Files to Project
```powershell
# API Routes
Copy-Item api-commissioners-route.js -Destination "app\api\commissioners\route.js"
Copy-Item api-profiles-route.js -Destination "app\api\profiles\route.js"
Copy-Item api-categories-import-route.js -Destination "app\api\categories\import\route.js"

# Pages
New-Item -ItemType Directory -Force -Path "app\commissioner\signup"
New-Item -ItemType Directory -Force -Path "app\commissioner\dashboard"
Copy-Item commissioner-signup-page.js -Destination "app\commissioner\signup\page.js"
Copy-Item commissioner-dashboard-page.js -Destination "app\commissioner\dashboard\page.js"

# Components
Copy-Item UserAvatar.js -Destination "components\"
Copy-Item CategoryImportUI.js -Destination "components\"
```

### Step 3: Deploy
```bash
git add .
git commit -m "feat: commissioner signup, profiles, and CSV import"
git push
```

---

## Usage Examples

### UserAvatar Component
```jsx
import UserAvatar, { AvatarGroup, AvatarSelector } from '../components/UserAvatar'

// Basic avatar from email
<UserAvatar email="user@example.com" size="md" />

// With direct emoji/color
<UserAvatar emoji="👑" color="#f59e0b" size="lg" showName name="John" />

// Commissioner badge
<UserAvatar email="admin@example.com" showBadge isCommissioner />

// Group of avatars
<AvatarGroup 
  users={[
    { email: 'a@example.com', avatar_emoji: '👑', avatar_color: '#f59e0b' },
    { email: 'b@example.com' },
    { email: 'c@example.com' }
  ]}
  max={5}
/>

// Avatar selector for editing
<AvatarSelector
  selected={selectedAvatar}
  onSelect={(avatar) => setSelectedAvatar(avatar)}
/>
```

### CategoryImportUI Component
```jsx
import CategoryImportUI from '../components/CategoryImportUI'

// In your page/component
const [showImport, setShowImport] = useState(false)

{showImport && (
  <CategoryImportUI
    eventId="your-event-uuid"
    onImportComplete={(result) => {
      console.log('Imported:', result)
      setShowImport(false)
    }}
    onClose={() => setShowImport(false)}
  />
)}
```

### CSV Format for Import
```csv
# Option A: One option per row
Best Picture,The Brutalist
Best Picture,Conclave
Best Picture,Emilia Pérez
Best Director,Brady Corbet
Best Director,Denis Villeneuve

# Option B: All options in one row
Best Picture,The Brutalist,Conclave,Emilia Pérez,Anora
Best Director,Brady Corbet,Denis Villeneuve,Sean Baker
```

---

## API Endpoints

### Commissioners
```
GET /api/commissioners?email=user@example.com
POST /api/commissioners
  { email, name, avatar_emoji, avatar_color, bio }
PUT /api/commissioners
  { id or email, ...updates }
```

### Profiles
```
GET /api/profiles?email=user@example.com
POST /api/profiles
  { email, display_name, avatar_emoji, avatar_color, is_commissioner, commissioner_id }
PUT /api/profiles
  { email, ...updates }
DELETE /api/profiles?email=user@example.com
```

### Categories Import
```
POST /api/categories/import
  { event_id, categories: [{ name, options: ['A', 'B', 'C'] }] }
GET /api/categories/import?event_id=xxx
  Returns existing categories for preview
```

---

## Avatar Options

Default avatars available:
| Emoji | Label | Color |
|-------|-------|-------|
| 👑 | Crown | #f59e0b |
| 🏆 | Trophy | #eab308 |
| ⚡ | Lightning | #8b5cf6 |
| 🎯 | Bullseye | #ef4444 |
| 🦁 | Lion | #f97316 |
| 🐻 | Bear | #78716c |
| 🦅 | Eagle | #0ea5e9 |
| 🐺 | Wolf | #6b7280 |
| 🚀 | Rocket | #3b82f6 |
| 💎 | Diamond | #06b6d4 |
| 🔥 | Fire | #f97316 |
| ⭐ | Star | #fbbf24 |
| 🏈 | Football | #854d0e |
| ⚽ | Soccer | #16a34a |
| 🏀 | Basketball | #ea580c |
| 🎬 | Movies | #1f2937 |

---

## Checklist

- [ ] Run SQL migration in Supabase
- [ ] Copy API routes
- [ ] Copy page components
- [ ] Copy UI components
- [ ] Test commissioner signup flow
- [ ] Test profile creation
- [ ] Test CSV import with sample data
- [ ] Verify avatars display correctly
- [ ] Deploy to staging
- [ ] Deploy to production
