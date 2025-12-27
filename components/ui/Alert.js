export default function Alert({
  children,
  variant = 'info',
  style = {}
}) {
  const variants = {
    info: {
      background: 'var(--color-primary-light)',
      borderColor: 'var(--color-primary)',
      color: 'var(--color-primary-dark)'
    },
    success: {
      background: 'var(--color-success-light)',
      borderColor: 'var(--color-success)',
      color: 'var(--color-success-dark)'
    },
    warning: {
      background: 'var(--color-warning-light)',
      borderColor: 'var(--color-warning)',
      color: 'var(--color-warning)'
    },
    danger: {
      background: 'var(--color-danger-light)',
      borderColor: 'var(--color-danger)',
      color: 'var(--color-danger-dark)'
    }
  }

  const v = variants[variant]

  return (
    <div style={{
      padding: 'var(--spacing-md) var(--spacing-lg)',
      borderRadius: 'var(--radius-md)',
      borderLeft: `4px solid ${v.borderColor}`,
      background: v.background,
      color: v.color,
      ...style
    }}>
      {children}
    </div>
  )
}