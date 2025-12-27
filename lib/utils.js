/**
 * Format a date for display
 */
export function formatDate(date, options = {}) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  })
}

/**
 * Format a date and time for display
 */
export function formatDateTime(date) {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Convert date to datetime-local input format
 */
export function toDateTimeLocal(date) {
  const d = new Date(date)
  return d.toISOString().slice(0, 16)
}

/**
 * Check if an event is locked (started)
 */
export function isEventLocked(startTime) {
  return new Date(startTime) < new Date()
}

/**
 * Copy text to clipboard with optional callback
 */
export async function copyToClipboard(text, onSuccess) {
  try {
    await navigator.clipboard.writeText(text)
    if (onSuccess) onSuccess()
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

/**
 * Generate a pool URL
 */
export function getPoolUrl(poolId) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/pool/${poolId}`
  }
  return `/pool/${poolId}`
}

/**
 * Generate a bracket URL
 */
export function getBracketUrl(eventId) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/bracket/${eventId}`
  }
  return `/bracket/${eventId}`
}

/**
 * Sort categories by order_index
 */
export function sortByOrderIndex(items) {
  return [...items].sort((a, b) => a.order_index - b.order_index)
}

/**
 * Sort teams by seed
 */
export function sortBySeed(teams) {
  return [...teams].sort((a, b) => a.seed - b.seed)
}

/**
 * Create a map from an array using a key
 */
export function createMap(items, key = 'id') {
  const map = {}
  items.forEach(item => {
    map[item[key]] = item
  })
  return map
}

/**
 * Get unique values from an array
 */
export function unique(arr) {
  return [...new Set(arr)]
}

/**
 * Get unique conferences from teams
 */
export function getConferences(teams) {
  return unique(teams.map(t => t.conference).filter(Boolean))
}

/**
 * Check if Supabase error is a unique constraint violation
 */
export function isUniqueViolation(error) {
  return error?.code === '23505'
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error) {
  if (isUniqueViolation(error)) {
    return 'This entry already exists. Please use a different name or email.'
  }
  return error?.message || 'An unexpected error occurred'
}