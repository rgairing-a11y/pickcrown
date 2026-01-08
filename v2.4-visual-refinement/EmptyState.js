'use client'

import Link from 'next/link'

/**
 * EmptyState - A friendly, illustrated empty state component
 * 
 * @param {string} variant - 'no-entries' | 'no-picks' | 'no-results' | 'not-found' | 'locked' | 'error' | 'coming-soon'
 * @param {string} title - Main message
 * @param {string} description - Secondary message
 * @param {string} actionLabel - Button text
 * @param {string} actionHref - Button link
 * @param {function} onAction - Button click handler (alternative to href)
 * @param {string} secondaryActionLabel - Secondary button text
 * @param {string} secondaryActionHref - Secondary button link
 */
export default function EmptyState({
  variant = 'default',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  compact = false
}) {
  const illustrations = {
    'no-entries': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#F3F4F6"/>
        <rect x="35" y="30" width="50" height="60" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="2"/>
        <line x1="45" y1="45" x2="75" y2="45" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round"/>
        <line x1="45" y1="55" x2="70" y2="55" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round"/>
        <line x1="45" y1="65" x2="65" y2="65" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="85" cy="80" r="18" fill="#3B82F6" fillOpacity="0.1"/>
        <path d="M80 80L85 85L92 75" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'no-picks': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#F3F4F6"/>
        <circle cx="60" cy="50" r="25" fill="white" stroke="#E5E7EB" strokeWidth="2"/>
        <path d="M50 50L55 55L70 40" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="40" y="80" width="40" height="8" rx="4" fill="#E5E7EB"/>
        <rect x="45" y="80" width="20" height="8" rx="4" fill="#3B82F6"/>
      </svg>
    ),
    'no-results': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#F3F4F6"/>
        <circle cx="55" cy="55" r="20" stroke="#E5E7EB" strokeWidth="3" fill="white"/>
        <line x1="70" y1="70" x2="85" y2="85" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round"/>
        <path d="M48 55H62" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'not-found': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#F3F4F6"/>
        <circle cx="60" cy="55" r="30" fill="white" stroke="#E5E7EB" strokeWidth="2"/>
        <circle cx="50" cy="50" r="4" fill="#9CA3AF"/>
        <circle cx="70" cy="50" r="4" fill="#9CA3AF"/>
        <path d="M50 68C50 68 55 62 60 62C65 62 70 68 70 68" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    'locked': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#FEF3C7"/>
        <rect x="42" y="50" width="36" height="30" rx="4" fill="#F59E0B"/>
        <rect x="48" y="35" width="24" height="20" rx="10" fill="none" stroke="#F59E0B" strokeWidth="4"/>
        <circle cx="60" cy="63" r="4" fill="white"/>
        <rect x="58" y="65" width="4" height="8" rx="2" fill="white"/>
      </svg>
    ),
    'error': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#FEF2F2"/>
        <circle cx="60" cy="60" r="30" fill="white" stroke="#EF4444" strokeWidth="2"/>
        <line x1="50" y1="50" x2="70" y2="70" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
        <line x1="70" y1="50" x2="50" y2="70" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
    'coming-soon': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#F3F4F6"/>
        <circle cx="60" cy="55" r="28" fill="white" stroke="#E5E7EB" strokeWidth="2"/>
        <path d="M60 35V55L72 62" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="60" cy="55" r="3" fill="#3B82F6"/>
      </svg>
    ),
    'trophy': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#FEF3C7"/>
        <path d="M45 35H75V55C75 65 68 75 60 75C52 75 45 65 45 55V35Z" fill="#F59E0B"/>
        <rect x="55" y="75" width="10" height="10" fill="#D97706"/>
        <rect x="45" y="85" width="30" height="5" rx="2" fill="#D97706"/>
        <path d="M35 35H45V45C45 50 40 52 35 50V35Z" fill="#FCD34D"/>
        <path d="M85 35H75V45C75 50 80 52 85 50V35Z" fill="#FCD34D"/>
      </svg>
    ),
    'default': (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="50" fill="#F3F4F6"/>
        <rect x="35" y="40" width="50" height="40" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="2"/>
        <circle cx="60" cy="60" r="10" fill="#E5E7EB"/>
      </svg>
    )
  }

  const defaults = {
    'no-entries': {
      title: 'No entries yet',
      description: 'Be the first to make your picks!'
    },
    'no-picks': {
      title: 'No picks made',
      description: 'Select your picks to get started'
    },
    'no-results': {
      title: 'No results found',
      description: 'Try adjusting your search or filters'
    },
    'not-found': {
      title: 'Page not found',
      description: "We couldn't find what you're looking for"
    },
    'locked': {
      title: 'Picks are locked',
      description: 'The event has started'
    },
    'error': {
      title: 'Something went wrong',
      description: 'Please try again later'
    },
    'coming-soon': {
      title: 'Coming soon',
      description: 'This feature is on its way'
    },
    'trophy': {
      title: 'No standings yet',
      description: 'Results will appear here once the event begins'
    }
  }

  const displayTitle = title || defaults[variant]?.title || 'Nothing here yet'
  const displayDescription = description || defaults[variant]?.description || ''

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: compact ? 'var(--spacing-6)' : 'var(--spacing-12) var(--spacing-6)',
      textAlign: 'center'
    }}>
      {/* Illustration */}
      <div style={{
        marginBottom: compact ? 'var(--spacing-4)' : 'var(--spacing-6)',
        opacity: 0.9,
        transform: compact ? 'scale(0.8)' : 'scale(1)'
      }}>
        {illustrations[variant] || illustrations.default}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: compact ? 'var(--font-size-lg)' : 'var(--font-size-xl)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--color-text)',
        marginBottom: 'var(--spacing-2)',
        lineHeight: 'var(--line-height-tight)'
      }}>
        {displayTitle}
      </h3>

      {/* Description */}
      {displayDescription && (
        <p style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-muted)',
          marginBottom: actionLabel ? 'var(--spacing-6)' : 0,
          maxWidth: 300,
          lineHeight: 'var(--line-height-relaxed)'
        }}>
          {displayDescription}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-3)',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {actionLabel && (
            actionHref ? (
              <Link
                href={actionHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) var(--spacing-5)',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-semibold)',
                  textDecoration: 'none',
                  transition: 'all 150ms ease'
                }}
              >
                {actionLabel}
              </Link>
            ) : (
              <button
                onClick={onAction}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-3) var(--spacing-5)',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                {actionLabel}
              </button>
            )
          )}

          {secondaryActionLabel && secondaryActionHref && (
            <Link
              href={secondaryActionHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--spacing-3) var(--spacing-5)',
                background: 'var(--color-white)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-medium)',
                textDecoration: 'none',
                transition: 'all 150ms ease'
              }}
            >
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
