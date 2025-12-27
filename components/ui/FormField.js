export default function FormField({
  label,
  required = false,
  hint,
  error,
  children
}) {
  return (
    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: 'var(--spacing-sm)', 
          fontWeight: 'bold' 
        }}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
        </label>
      )}
      
      {children}
      
      {hint && !error && (
        <small style={{ 
          display: 'block',
          marginTop: 'var(--spacing-xs)',
          color: 'var(--color-text-muted)' 
        }}>
          {hint}
        </small>
      )}
      
      {error && (
        <small style={{ 
          display: 'block',
          marginTop: 'var(--spacing-xs)',
          color: 'var(--color-danger)' 
        }}>
          {error}
        </small>
      )}
    </div>
  )
}