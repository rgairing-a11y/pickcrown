import Link from 'next/link'

export default function Header() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: '16px 24px',
      marginBottom: 24
    }}>
      <Link href="/" style={{
        color: 'white',
        textDecoration: 'none',
        fontSize: 24,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        👑 PickCrown
      </Link>
    </header>
  )
}