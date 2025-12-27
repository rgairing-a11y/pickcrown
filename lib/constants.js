// Event Types
export const EVENT_TYPES = {
  BRACKET: 'bracket',
  PICK_ONE: 'pick_one',
  HYBRID: 'hybrid'
}

export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.BRACKET]: 'Bracket (NFL Playoffs style)',
  [EVENT_TYPES.PICK_ONE]: 'Pick One (Oscars style)',
  [EVENT_TYPES.HYBRID]: 'Hybrid (WrestleMania style)'
}

// Event Status
export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  LOCKED: 'locked',
  COMPLETED: 'completed'
}

// Category Types
export const CATEGORY_TYPES = {
  SINGLE_SELECT: 'single_select',
  YES_NO: 'yes_no',
  MATCH_PREDICTION: 'match_prediction'
}

export const CATEGORY_TYPE_LABELS = {
  [CATEGORY_TYPES.SINGLE_SELECT]: 'Single Select',
  [CATEGORY_TYPES.YES_NO]: 'Yes / No',
  [CATEGORY_TYPES.MATCH_PREDICTION]: 'Match Prediction'
}

// Conference Colors (for brackets)
export const CONFERENCE_COLORS = {
  AFC: { primary: 'var(--color-afc)', light: 'var(--color-afc-light)' },
  NFC: { primary: 'var(--color-nfc)', light: 'var(--color-nfc-light)' },
  East: { primary: 'var(--color-east)', light: 'var(--color-east-light)' },
  West: { primary: 'var(--color-west)', light: 'var(--color-west-light)' },
  South: { primary: 'var(--color-south)', light: 'var(--color-south-light)' },
  Midwest: { primary: 'var(--color-midwest)', light: 'var(--color-midwest-light)' }
}

// Scoring
export const FIBONACCI_POINTS = [1, 2, 4, 8, 16, 32, 64]

// Routes
export const ROUTES = {
  HOME: '/',
  ADMIN: '/admin',
  ADMIN_NEW_EVENT: '/admin/events/new',
  ADMIN_NEW_POOL: '/admin/pools/new'
}