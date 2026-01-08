# v2.4 Visual Refinement Package

This package contains all the improvements for the PickCrown visual refinement update.

## What's Included

### 1. Enhanced CSS (`globals.css`)
- Refined color palette with better contrast
- Improved typography scale with better line heights
- More granular spacing tokens
- Softer, more modern shadows
- Better focus states for accessibility
- Dark mode preparation (CSS variables ready)
- Mobile-first responsive utilities

### 2. EmptyState Component (`EmptyState.js`)
- 8 illustrated variants: `no-entries`, `no-picks`, `no-results`, `not-found`, `locked`, `error`, `coming-soon`, `trophy`
- SVG illustrations (no external dependencies)
- Support for actions and secondary actions
- Compact mode for inline use

### 3. StandingsTable Component (`StandingsTable.js`)
- Desktop table view with proper column alignment
- Mobile card view with touch-friendly targets
- Medal badges for top 3 (🥇🥈🥉)
- User highlighting ("You" badge)
- Max possible points column (optional)
- Event status indicator

### 4. BracketScrollContainer (`BracketScrollContainer.js`)
- Horizontal scroll with fade indicators
- Touch-friendly swipe gestures
- "Swipe to see more" hint on mobile
- Scroll progress indicator
- Optional snap-to-round behavior
- Arrow buttons for desktop

### 5. PageHeader Component (`PageHeader.js`)
- Consistent page headers
- Breadcrumb support
- Status badges
- Action buttons area
- PageSection sub-component for consistent sections
- StatusBadge utility component

### 6. Card Components (`Card.js`)
- Base Card with multiple variants
- InfoCard for key-value display
- CardGrid for responsive layouts
- AlertCard for messages

### 7. Mobile Responsive CSS (`mobile-responsive.css`)
- Touch-friendly tap targets
- Stacked layouts on mobile
- Bracket-specific mobile styles
- Form layout helpers
- Animation utilities
- Accessibility improvements (reduced motion, high contrast)

### 8. Updated Standings Page (`standings-page.js`)
- Uses all new components
- Better visual hierarchy
- Improved mobile layout
- Popular picks grid layout

---

## Deployment Instructions

### Step 1: Update Global Styles
```bash
# Backup existing globals.css
cp app/globals.css app/globals.css.backup

# Copy new globals.css
cp v2.4-visual-refinement/globals.css app/globals.css
```

### Step 2: Add Mobile Responsive CSS
Append to globals.css or import separately:
```bash
cat v2.4-visual-refinement/mobile-responsive.css >> app/globals.css
```

### Step 3: Add New Components
```bash
# Copy components
cp v2.4-visual-refinement/EmptyState.js components/
cp v2.4-visual-refinement/StandingsTable.js components/
cp v2.4-visual-refinement/BracketScrollContainer.js components/
cp v2.4-visual-refinement/PageHeader.js components/
cp v2.4-visual-refinement/Card.js components/
```

### Step 4: Update Standings Page
```bash
cp v2.4-visual-refinement/standings-page.js app/pool/[poolId]/standings/page.js
```

### Step 5: Deploy
```bash
git add .
git commit -m "feat: v2.4 visual refinement - typography, spacing, mobile improvements"
git push
```

---

## Component Usage Examples

### EmptyState
```jsx
import EmptyState from '../components/EmptyState'

// Basic usage
<EmptyState 
  variant="no-entries"
  actionLabel="Make Your Picks"
  actionHref="/pool/xxx"
/>

// With custom text
<EmptyState 
  variant="trophy"
  title="Coming Soon"
  description="Standings will appear once the event starts"
/>
```

### StandingsTable
```jsx
import StandingsTable from '../components/StandingsTable'

<StandingsTable
  standings={standings}
  showPoints={true}
  showMaxPossible={true}
  highlightEmail="user@example.com"
  eventStatus="in_progress"
/>
```

### BracketScrollContainer
```jsx
import BracketScrollContainer, { BracketRound } from '../components/BracketScrollContainer'

<BracketScrollContainer minWidth={900} enableSnap>
  <div style={{ display: 'flex', gap: 24 }}>
    <BracketRound roundName="Round 1">
      {/* Matchups */}
    </BracketRound>
    <BracketRound roundName="Round 2">
      {/* Matchups */}
    </BracketRound>
  </div>
</BracketScrollContainer>
```

### PageHeader
```jsx
import PageHeader, { PageSection, StatusBadge } from '../components/PageHeader'

<PageHeader
  title="Pool Name"
  subtitle="Event Name (2024)"
  backLink="/pools"
  backLabel="All Pools"
  badge={<StatusBadge status="in_progress" />}
  actions={<button>Edit</button>}
/>

<PageSection title="Standings" description="Live results">
  <StandingsTable ... />
</PageSection>
```

### Card Components
```jsx
import { Card, InfoCard, CardGrid, AlertCard } from '../components/Card'

<CardGrid columns={3}>
  <InfoCard
    icon="👥"
    label="Entries"
    value="42"
    subtext="3 new today"
  />
  <InfoCard
    icon="🎯"
    label="Top Score"
    value="85"
    trend={{ direction: 'up', value: '+12' }}
  />
</CardGrid>

<AlertCard variant="warning" title="Picks Lock Soon">
  You have 2 hours left to submit your picks.
</AlertCard>
```

---

## CSS Variables Reference

### Spacing
```css
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px
--spacing-5: 20px
--spacing-6: 24px
--spacing-8: 32px
--spacing-10: 40px
--spacing-12: 48px
```

### Typography
```css
--font-size-xs: 0.75rem   /* 12px */
--font-size-sm: 0.8125rem /* 13px */
--font-size-base: 0.875rem /* 14px */
--font-size-lg: 1rem      /* 16px */
--font-size-xl: 1.125rem  /* 18px */
--font-size-2xl: 1.25rem  /* 20px */
--font-size-3xl: 1.5rem   /* 24px */
```

### Colors
```css
--color-primary: #3b82f6
--color-success: #22c55e
--color-warning: #f59e0b
--color-danger: #ef4444

--color-text: #111827
--color-text-secondary: #4b5563
--color-text-muted: #9ca3af

--color-border: #e5e7eb
--color-background: #f9fafb
```

---

## Migration Notes

1. **Existing styles**: The new globals.css is comprehensive but backward compatible. Legacy spacing variables (`--spacing-xs`, etc.) are aliased.

2. **Component imports**: Update any existing imports to use new components.

3. **Mobile breakpoint**: Changed from `768px` to `640px` for better mobile experience.

4. **Typography**: Slightly smaller base font size (14px) for better information density.

---

## Checklist

- [ ] Backup existing globals.css
- [ ] Copy new CSS files
- [ ] Copy new components
- [ ] Update standings page
- [ ] Test on mobile devices
- [ ] Test empty states
- [ ] Test bracket scrolling
- [ ] Verify accessibility (keyboard nav, screen readers)
- [ ] Deploy to staging first
- [ ] Deploy to production
