import Link from 'next/link'

export default function Header() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, var(--color-header-start) 0%, var(--color-header-end) 100%)',
      padding: 'var(--spacing-lg) var(--spacing-xl)',
      marginBottom: 'var(--spacing-xxl)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link 
          href="/" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}
        >
          <span style={{ fontSize: 'var(--font-size-hero)' }}>👑</span>
          <span style={{ 
            fontSize: 'var(--font-size-xxl)', 
            fontWeight: 'bold',
            letterSpacing: '-0.5px'
          }}>
            PickCrown
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
          <Link 
            href="/"
            style={{ 
              color: 'rgba(255,255,255,0.8)', 
              textDecoration: 'none',
              fontSize: 'var(--font-size-md)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            Pools
          </Link>
          <Link 
            href="/admin"
            style={{ 
              color: 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              fontSize: 'var(--font-size-md)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            ⚙️ Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}