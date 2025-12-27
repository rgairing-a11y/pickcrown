import Link from 'next/link'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  style = {},
  ...props
}) {
  const variants = {
    primary: {
      background: 'var(--color-primary)',
      color: 'white'
    },
    success: {
      background: 'var(--color-success)',
      color: 'white'
    },
    danger: {
      background: 'var(--color-danger)',
      color: 'white'
    },
    warning: {
      background: 'var(--color-warning)',
      color: 'white'
    },
    secondary: {
      background: 'var(--color-background-dark)',
      color: 'var(--color-text)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-border)'
    },
    'danger-light': {
      background: 'var(--color-danger-light)',
      color: 'var(--color-danger)'
    },
    'success-light': {
      background: 'var(--color-success-light)',
      color: 'var(--color-success-dark)'
    },
    'primary-light': {
      background: 'var(--color-primary-light)',
      color: 'var(--color-primary)'
    },
    'warning-light': {
      background: 'var(--color-warning-light)',
      color: 'var(--color-warning)'
    }
  }

  const sizes = {
    sm: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      fontSize: 'var(--font-size-sm)'
    },
    md: {
      padding: 'var(--spacing-md) var(--spacing-lg)',
      fontSize: 'var(--font-size-md)'
    },
    lg: {
      padding: 'var(--spacing-lg) var(--spacing-xl)',
      fontSize: 'var(--font-size-lg)'
    }
  }

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: 'bold',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    textDecoration: 'none',
    transition: 'opacity 0.2s',
    ...variants[variant],
    ...sizes[size],
    ...style
  }

  if (href && !disabled) {
    return (
      <Link href={href} style={baseStyle} {...props}>
        {loading ? 'Loading...' : children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={baseStyle}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}