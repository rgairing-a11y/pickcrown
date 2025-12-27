import Link from 'next/link'

export default function PageHeader({ 
  title, 
  subtitle,
  backLink = '/admin',
  backText = 'Back to Admin',
  actions
}) {
  return (
    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
      {backLink && (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <Link href={backLink} style={{ color: 'var(--color-primary)' }}>
            {backText}
          </Link>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--spacing-md)'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>{title}</h1>
          {subtitle && (
            <p style={{ 
              color: 'var(--color-text-light)', 
              margin: 'var(--spacing-sm) 0 0' 
            }}>
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}