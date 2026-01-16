'use client'

/**
 * Card - Base card component with consistent styling
 */
export function Card({
  children,
  padding = 'default',
  variant = 'default',
  hover = false,
  onClick,
  className = '',
  style = {}
}) {
  const paddingStyles = {
    none: '0',
    compact: 'var(--spacing-4)',
    default: 'var(--spacing-6)',
    spacious: 'var(--spacing-8)'
  }

  const variantStyles = {
    default: {
      background: 'var(--color-white)',
      border: '1px solid var(--color-border-light)',
      boxShadow: 'var(--shadow-xs)'
    },
    elevated: {
      background: 'var(--color-white)',
      border: 'none',
      boxShadow: 'var(--shadow-md)'
    },
    outlined: {
      background: 'transparent',
      border: '1px solid var(--color-border)',
      boxShadow: 'none'
    },
    filled: {
      background: 'var(--color-background)',
      border: 'none',
      boxShadow: 'none'
    },
    success: {
      background: 'var(--color-success-light)',
      border: '1px solid var(--color-success)',
      boxShadow: 'none'
    },
    warning: {
      background: 'var(--color-warning-light)',
      border: '1px solid var(--color-warning)',
      boxShadow: 'none'
    },
    danger: {
      background: 'var(--color-danger-light)',
      border: '1px solid var(--color-danger)',
      boxShadow: 'none'
    },
    info: {
      background: 'var(--color-primary-light)',
      border: '1px solid var(--color-primary)',
      boxShadow: 'none'
    }
  }

  const vStyle = variantStyles[variant] || variantStyles.default

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        padding: paddingStyles[padding],
        borderRadius: 'var(--radius-xl)',
        transition: 'all var(--transition-fast)',
        cursor: onClick ? 'pointer' : 'default',
        ...vStyle,
        ...(hover && {
          ':hover': {
            boxShadow: 'var(--shadow-md)',
            transform: 'translateY(-2px)'
          }
        }),
        ...style
      }}
    >
      {children}
    </div>
  )
}

/**
 * InfoCard - Card for displaying key-value information
 */
export function InfoCard({
  icon,
  label,
  value,
  subtext,
  trend,
  variant = 'default'
}) {
  const trendColors = {
    up: 'var(--color-success)',
    down: 'var(--color-danger)',
    neutral: 'var(--color-text-muted)'
  }

  return (
    <Card variant={variant} padding="default">
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-3)'
      }}>
        {icon && (
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0
          }}>
            {icon}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--spacing-1)'
          }}>
            {label}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'var(--spacing-2)'
          }}>
            <span style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--color-text)',
              lineHeight: 1
            }}>
              {value}
            </span>

            {trend && (
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: trendColors[trend.direction] || trendColors.neutral,
                fontWeight: 'var(--font-medium)'
              }}>
                {trend.direction === 'up' && '↑'}
                {trend.direction === 'down' && '↓'}
                {trend.value}
              </span>
            )}
          </div>

          {subtext && (
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              marginTop: 'var(--spacing-1)'
            }}>
              {subtext}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * CardGrid - Responsive grid for cards
 */
export function CardGrid({
  children,
  columns = 3,
  gap = 'default'
}) {
  const gapStyles = {
    compact: 'var(--spacing-3)',
    default: 'var(--spacing-4)',
    spacious: 'var(--spacing-6)'
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${Math.floor(100 / columns) * 2.5}0px, 1fr))`,
      gap: gapStyles[gap] || gapStyles.default
    }}>
      {children}
    </div>
  )
}

/**
 * AlertCard - For important messages
 */
export function AlertCard({
  variant = 'info',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss
}) {
  const variantStyles = {
    info: {
      bg: 'var(--color-primary-light)',
      border: 'var(--color-primary)',
      icon: 'ℹ️'
    },
    success: {
      bg: 'var(--color-success-light)',
      border: 'var(--color-success)',
      icon: '✓'
    },
    warning: {
      bg: 'var(--color-warning-light)',
      border: 'var(--color-warning)',
      icon: '⚠️'
    },
    danger: {
      bg: 'var(--color-danger-light)',
      border: 'var(--color-danger)',
      icon: '✕'
    }
  }

  const style = variantStyles[variant] || variantStyles.info

  return (
    <div style={{
      padding: 'var(--spacing-4)',
      background: style.bg,
      borderLeft: `4px solid ${style.border}`,
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      gap: 'var(--spacing-3)',
      alignItems: 'flex-start'
    }}>
      <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>
        {icon || style.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--spacing-1)'
          }}>
            {title}
          </div>
        )}
        <div style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)'
        }}>
          {children}
        </div>
      </div>

      {dismissible && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--spacing-1)',
            cursor: 'pointer',
            opacity: 0.5,
            fontSize: '1rem'
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default Card
