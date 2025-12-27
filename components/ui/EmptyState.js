import Link from 'next/link'

export default function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description,
  actionLabel,
  actionHref,
  onAction
}) {
  return (
    <div style={{
      padding: 'var(--spacing-xxl)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 48, marginBottom: 'var(--spacing-lg)' }}>
        {icon}
      </div>
      
      <h3 style={{ 
        margin: '0 0 var(--spacing-sm)', 
        color: 'var(--color-text)' 
      }}>
        {title}
      </h3>
      
      {description && (
        <p style={{ 
          color: 'var(--color-text-muted)', 
          margin: '0 0 var(--spacing-lg)' 
        }}>
          {description}
        </p>
      )}
      
      {actionHref && (
        <Link 
          href={actionHref}
          style={{ 
            color: 'var(--color-primary)', 
            fontWeight: 'bold' 
          }}
        >
          {actionLabel} →
        </Link>
      )}
      
      {onAction && !actionHref && (
        <button
          onClick={onAction}
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}