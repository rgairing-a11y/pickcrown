export default function Card({ 
  children, 
  padding = 'var(--spacing-xl)',
  className = '',
  style = {}
}) {
  return (
    <div 
      className={className}
      style={{
        background: 'var(--color-white)',
        padding,
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        ...style
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, style = {} }) {
  return (
    <div style={{
      padding: 'var(--spacing-lg)',
      background: 'var(--color-background-dark)',
      borderBottom: '1px solid var(--color-border-light)',
      margin: 'calc(-1 * var(--spacing-xl))',
      marginBottom: 'var(--spacing-lg)',
      borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
      ...style
    }}>
      {children}
    </div>
  )
}