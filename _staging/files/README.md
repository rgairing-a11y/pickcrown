# PickCrown UX & Safety Package

This package contains improvements for entry editing fairness, better error handling, input validation, and clarity-amplifying UI components.

## Contents

```
ux-safety-package/
├── lib/
│   ├── entry-editing.js      # Deadline enforcement utilities
│   └── validation.js         # Input validation with helpful errors
├── components/
│   ├── ConfirmationModal.js  # Confirmation dialogs
│   ├── ErrorMessage.js       # Error display with recovery suggestions
│   ├── PoolRulesPanel.js     # Pool rules/about panel
│   ├── SavedConfirmation.js  # Pick save confirmation states
│   └── PoolStatusIndicators.js # Entry count, results status
└── api/
    └── entries/[entryId]/edit/route.js  # Edit API with enforcement
```

---

## 1. Entry Editing (Fairness & Correctness)

### Deadline Enforcement

Edits are blocked within a configurable window before lock time (default: 2 hours).

**Usage:**
```javascript
import { getEditStatus, EDIT_CONFIG } from '@/lib/entry-editing';

// Check if editing is allowed
const status = getEditStatus(event.lock_time, entry.created_at, entry.edit_count);

if (status.canEdit) {
  // Show edit button
  console.log(status.message); // "Edit window open. 5h 30m until editing closes."
} else {
  // Hide edit button, show reason
  console.log(status.message); // "Editing disabled 2 hours before lock."
}
```

**Configuration (in lib/entry-editing.js):**
```javascript
export const EDIT_CONFIG = {
  CUTOFF_HOURS: 2,        // Block edits 2 hours before lock
  MIN_WAIT_MINUTES: 5,    // Wait 5 min after submission before editing
  MAX_EDITS: 0,           // 0 = unlimited edits
};
```

### Confirmation Modal

```jsx
import { EditConfirmationModal } from '@/components/ConfirmationModal';

function PickForm() {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleSave = () => {
    setShowConfirm(true);
  };
  
  const confirmSave = async () => {
    await saveChanges();
    setShowConfirm(false);
  };

  return (
    <>
      <button onClick={handleSave}>Save Changes</button>
      
      <EditConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSave}
        entryName="John's Picks"
        changesCount={3}
        loading={isSaving}
      />
    </>
  );
}
```

---

## 2. Core UX & Safety

### Better Error Messages

```jsx
import ErrorMessage, { FieldError } from '@/components/ErrorMessage';

// Full error with recovery suggestions
<ErrorMessage
  error={apiError}
  onRetry={() => refetch()}
/>

// Compact inline error
<ErrorMessage
  error={error}
  compact
/>

// Field-level validation error
<input type="email" />
<FieldError message={errors.email} />
```

**Error Types (auto-detected from HTTP status):**
- `NETWORK` - Connection issues
- `NOT_FOUND` - 404 errors
- `PERMISSION` - 401/403 errors
- `VALIDATION` - 400/422 errors
- `LOCKED` - 423 (picks locked)
- `SERVER` - 500+ errors
- `TIMEOUT` - 408/504 errors
- `DUPLICATE` - 409 conflicts

### Input Validation

```javascript
import { validateEmail, validateEntryName, validateForm } from '@/lib/validation';

// Single field
const emailResult = validateEmail('test@gmial.com');
// { valid: false, error: 'Did you mean test@gmail.com?', suggestion: '...' }

// Entry name with duplicate check
const nameResult = validateEntryName('John', { 
  existingNames: ['John', 'Jane'] 
});
// { valid: false, error: 'This name is already taken...', suggestion: '...' }

// Full form validation
const formResult = validateForm(formData, {
  email: { 
    required: true, 
    validator: validateEmail 
  },
  name: { 
    required: true, 
    minLength: 2, 
    maxLength: 50 
  },
});
// { valid: false, errors: { email: '...', name: '...' } }
```

---

## 3. Clarity Amplifiers

### Pool Rules Panel

```jsx
import PoolRulesPanel from '@/components/PoolRulesPanel';

<PoolRulesPanel
  pool={pool}
  event={event}
  defaultExpanded={false}
/>
```

Shows:
- Commissioner notes
- Scoring breakdown by round
- Category point values
- General rules

### Saved Confirmation

```jsx
import { SavedToast, SavedBanner, SavedStatus } from '@/components/SavedConfirmation';

// Toast notification (auto-dismisses)
<SavedToast
  show={justSaved}
  onDismiss={() => setJustSaved(false)}
  message="Your picks have been saved!"
/>

// Persistent banner
<SavedBanner
  savedAt={entry.updated_at}
  entryName={entry.name}
  isComplete={allPicksMade}
  editStatus={editStatus}
  onEdit={() => setEditing(true)}
/>

// Inline status
<SavedStatus status="saved" savedAt={lastSaved} />
<SavedStatus status="saving" />
<SavedStatus status="unsaved" message="You have unsaved changes" />
```

### Entry Count & Results Status

```jsx
import { 
  EntryCount, 
  ResultsStatus, 
  LockCountdown,
  EventComplete 
} from '@/components/PoolStatusIndicators';

// Entry count (aggregate only per roadmap)
<EntryCount count={18} invited={22} isLocked={false} />
// Shows: "18 of 22 submitted"

// Lock countdown
<LockCountdown lockTime={event.lock_time} />
// Shows: "Picks close in 2h 30m" (with urgency colors)

// Results status
<ResultsStatus
  status="complete"  // 'pending' | 'partial' | 'complete'
  entered={15}
  total={15}
  completedAt={event.completed_at}
/>
// Shows: "✓ All Results Final"

// Event completion celebration
<EventComplete
  eventName="Super Bowl LVIII"
  winners={[
    { name: 'John', score: 142 },
    { name: 'Jane', score: 138 },
    { name: 'Bob', score: 135 },
  ]}
  totalEntries={22}
/>
```

---

## 4. API Route

### PUT /api/entries/[entryId]/edit

Update entry picks with deadline enforcement.

**Request:**
```json
{
  "email": "user@example.com",
  "picks": {
    "categories": { "cat-1": "option-a", "cat-2": "option-b" },
    "bracket": { "match-1": "team-x" }
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "entry": { ... },
  "changesCount": 3,
  "editStatus": { "canEdit": true, "message": "Edit window open..." },
  "message": "3 picks updated successfully"
}
```

**Locked Response (423):**
```json
{
  "error": "Editing disabled 2 hours before lock. 1h 30m until picks lock.",
  "reason": "cutoff",
  "lockTime": "2026-01-10T12:00:00Z"
}
```

### GET /api/entries/[entryId]/edit

Check edit status without making changes.

**Response:**
```json
{
  "entryId": "abc-123",
  "editStatus": { "canEdit": true, "reason": "allowed", "message": "..." },
  "editCount": 2,
  "lastUpdated": "2026-01-09T10:30:00Z"
}
```

---

## Installation

1. **Copy files to your project:**
```bash
cp -r ux-safety-package/lib/* src/lib/
cp -r ux-safety-package/components/* src/components/
cp -r ux-safety-package/api/* src/app/api/
```

2. **Add CSS variables (if not already present):**
```css
:root {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-success: #22c55e;
  --color-success-light: #dcfce7;
  --color-success-text: #166534;
  --color-warning: #f59e0b;
  --color-warning-light: #fef3c7;
  --color-warning-text: #92400e;
  --color-danger: #ef4444;
  --color-danger-light: #fef2f2;
  --color-danger-text: #991b1b;
  --color-info: #3b82f6;
  --color-info-light: #dbeafe;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-bg: white;
  --color-bg-secondary: #f9fafb;
  --color-border: #e5e7eb;
}
```

3. **Database migration (optional - for edit tracking):**
```sql
-- Add columns to pool_entries if not present
ALTER TABLE pool_entries 
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_edit_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

---

## Roadmap Compliance

These components follow PickCrown's guiding principles:

| Principle | Implementation |
|-----------|---------------|
| Entry completion indicator | `EntryCount` - aggregate only, no individual status |
| Pool visibility rules | `PoolRulesPanel` - read-only, no interaction |
| Soft lock countdown | `LockCountdown` - text only, no animations |
| Vibe protection | Calm colors, friendly icons, no pressure language |
| Commissioner burden | Automatic enforcement, no manual intervention |

---

## Usage Examples

### Complete Pool Page Integration

```jsx
import { PoolStatusHeader, PoolRulesPanel } from '@/components';
import { getEditStatus } from '@/lib/entry-editing';

export default function PoolPage({ pool, event, entries, userEntry }) {
  const editStatus = userEntry 
    ? getEditStatus(event.lock_time, userEntry.created_at, userEntry.edit_count)
    : null;

  return (
    <div>
      <h1>{pool.name}</h1>
      
      <PoolStatusHeader
        pool={pool}
        event={event}
        entryCount={entries.length}
        resultsStatus={event.status === 'completed' ? 'complete' : 'pending'}
        isLocked={new Date() >= new Date(event.lock_time)}
      />
      
      <PoolRulesPanel pool={pool} event={event} />
      
      {userEntry && (
        <SavedBanner
          savedAt={userEntry.updated_at}
          entryName={userEntry.name}
          isComplete={isComplete(userEntry)}
          editStatus={editStatus}
        />
      )}
      
      {/* Rest of pool content */}
    </div>
  );
}
```
