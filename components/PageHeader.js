'use client'

import Link from 'next/link'

/**
 * PageHeader - Consistent page header with clear visual hierarchy
 * 
 * @param {string} title - Main page title
 * @param {string} subtitle - Secondary text (event name, etc.)
 * @param {string} backLink - URL for back navigation
 * @param {string} backLabel - Label for back link (default: "Back")
 * @param {ReactNode} badge - Status badge element
 * @param {ReactNode} actions - Right-aligned action buttons
 * @param {string} icon - Emoji or icon to display
 */
export default function PageHeader({
  title,
  subtitle,
  backLink,
  backLabel = 'Back',
  badge,
  actions,
  icon,
  breadcrumbs
}) {
  return (
    <header style={{
      marginBottom: 'var(--spacing-6)'
    }}>
      {/* Breadcrumbs / Back link */}
      {(backLink || breadcrumbs) && (
        <nav style={{
          marginBottom: 'var(--spacing-4)',
          fontSize: 'var(--font-size-sm)'
        }}>
          {breadcrumbs ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              color: 'var(--color-text-muted)',
              flexWrap: 'wrap'
            }}>
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  {idx > 0 && <span style={{ color: 'var(--color-border)' }}>/</span>}
                  {crumb.href ? (
                    <Link 
                      href={crumb.href}
                      style={{ 
                        color: 'var(--color-text-muted)',
                        textDecoration: 'none'
                      }}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--color-text-secondary)' }}>{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
          ) : backLink && (
            <Link 
              href={backLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-1)',
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)'
              }}
            >
              <span style={{ fontSize: '1.1em' }}>←</span>
              {backLabel}
            </Link>
          )}
        </nav>
      )}

      {/* Main header row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--spacing-4)',
        flexWrap: 'wrap'
      }}>
        {/* Title section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            flexWrap: 'wrap'
          }}>
            {icon && (
              <span style={{
                fontSize: '1.75rem',
                lineHeight: 1
              }}>
                {icon}
              </span>
            )}
            <h1 style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--color-text)',
              lineHeight: 'var(--line-height-tight)',
              margin: 0,
              letterSpacing: 'var(--tracking-tight)'
            }}>
              {title}
            </h1>
            {badge && (
              <span>{badge}</span>
            )}
          </div>
          
          {subtitle && (
            <p style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--spacing-2)',
              marginBottom: 0,
              lineHeight: 'var(--line-height-normal)'
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            flexShrink: 0
          }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

/**
 * PageSection - Section within a page with consistent spacing
 */
export function PageSection({ title, description, children, actions }) {
  return (
    <section style={{
      marginBottom: 'var(--spacing-8)'
    }}>
      {(title || actions) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-4)',
          gap: 'var(--spacing-4)'
        }}>
          <div>
            {title && (
              <h2 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--color-text)',
                margin: 0
              }}>
                {title}
              </h2>
            )}
            {description && (
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--spacing-1)',
                marginBottom: 0
              }}>
                {description}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * StatusBadge - Consistent status indicator
 */
export function StatusBadge({ status, size = 'md' }) {
  const statusStyles = {
    'upcoming': {
      background: 'var(--color-primary-light)',
      color: 'var(--color-primary-dark)',
      label: 'Upcoming'
    },
    'open': {
      background: 'var(--color-success-light)',
      color: 'var(--color-success-dark)',
      label: 'Open'
    },
    'locked': {
      background: 'var(--color-warning-light)',
      color: 'var(--color-warning-dark)',
      label: 'Locked'
    },
    'in_progress': {
      background: 'var(--color-warning-light)',
      color: 'var(--color-warning-dark)',
      label: 'In Progress'
    },
    'completed': {
      background: 'var(--color-background-alt)',
      color: 'var(--color-text-secondary)',
      label: 'Completed'
    },
    'draft': {
      background: 'var(--color-background-alt)',
      color: 'var(--color-text-muted)',
      label: 'Draft'
    }
  }

  const style = statusStyles[status] || statusStyles.draft
  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: 'var(--font-size-xs)' },
    md: { padding: '4px 12px', fontSize: 'var(--font-size-sm)' },
    lg: { padding: '6px 16px', fontSize: 'var(--font-size-base)' }
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--spacing-1)',
      background: style.background,
      color: style.color,
      borderRadius: 'var(--radius-full)',
      fontWeight: 'var(--font-medium)',
      whiteSpace: 'nowrap',
      ...sizeStyles[size]
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'currentColor',
        opacity: 0.7
      }} />
      {style.label}
    </span>
  )
}
