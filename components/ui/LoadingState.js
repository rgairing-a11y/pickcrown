export default function LoadingState({ 
  message = 'Loading...',
  fullPage = false 
}) {
  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--spacing-md)',
      padding: 'var(--spacing-xxl)',
      color: 'var(--color-text-light)'
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span>{message}</span>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)'
      }}>
        {content}
      </div>
    )
  }

  return content
}