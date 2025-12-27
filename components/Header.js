import Link from 'next/link'

export default function Header() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: '16px 24px',
      marginBottom: 32
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
            gap: 8
          }}
        >
          <span style={{ fontSize: 28 }}>👑</span>
          <span style={{ 
            fontSize: 24, 
            fontWeight: 'bold',
            letterSpacing: '-0.5px'
          }}>
            PickCrown
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link 
            href="/"
            style={{ 
              color: 'rgba(255,255,255,0.8)', 
              textDecoration: 'none',
              fontSize: 14,
              padding: '8px 12px',
              borderRadius: 6
            }}
          >
            Pools
          </Link>
          <Link 
            href="/admin"
            style={{ 
              color: 'rgba(255,255,255,0.6)', 
              textDecoration: 'none',
              fontSize: 14,
              padding: '8px 12px',
              borderRadius: 6,
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