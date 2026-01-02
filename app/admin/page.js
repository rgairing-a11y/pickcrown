import Link from 'next/link'

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>👑 What is PickCrown?</h1>
      
      <p style={{ fontSize: 18, color: '#555', marginBottom: 32, lineHeight: 1.6 }}>
        PickCrown is the easiest way to run a private prediction pool with people you already know.
        <br /><br />
        No accounts. No ads. No pressure.
      </p>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>How it works</h2>
        <ol style={{ fontSize: 16, color: '#444', lineHeight: 1.8, paddingLeft: 24 }}>
          <li>Someone creates a pool for an event and shares a private link</li>
          <li>You submit your picks before the event locks</li>
          <li>Results are entered once, standings update automatically</li>
        </ol>
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>What makes PickCrown different</h2>
        
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🔒 Private by default</h3>
          <p style={{ color: '#666', margin: 0 }}>
            Pools are invite-only. There's no public directory and no social pressure.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>😌 Low-stress by design</h3>
          <p style={{ color: '#666', margin: 0 }}>
            No live scoring. No trash talk. No push notifications. One reminder. One results email.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>🎯 Event-centric, not account-centric</h3>
          <p style={{ color: '#666', margin: 0 }}>
            You don't "join PickCrown." You're invited to an event, you make your picks, and you're done.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>♻️ Built for reuse</h3>
          <p style={{ color: '#666', margin: 0 }}>
            Run the same pool next year. Or across a season. Without starting from scratch.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>What PickCrown is NOT</h2>
        <ul style={{ fontSize: 16, color: '#666', lineHeight: 1.8, paddingLeft: 24 }}>
          <li>Not a gambling site</li>
          <li>Not a social network</li>
          <li>Not a live scoreboard</li>
          <li>Not a fantasy sports platform</li>
        </ul>
        <p style={{ marginTop: 16, color: '#666' }}>
          If you're looking for constant updates and competition, this probably isn't for you.
          <br />
          If you want something simple, calm, and fun — welcome.
        </p>
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>FAQ</h2>
        
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Do I need an account?</h4>
          <p style={{ color: '#666', margin: 0 }}>
            No. PickCrown uses email-only access. You'll get a link when you join a pool.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Can I change my picks?</h4>
          <p style={{ color: '#666', margin: 0 }}>
            You can edit picks until the event locks. After that, picks are final.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Who enters the results?</h4>
          <p style={{ color: '#666', margin: 0 }}>
            An admin enters results once per event. Those results apply to all pools tied to that event.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>What kinds of events does PickCrown support?</h4>
          <p style={{ color: '#666', margin: 0 }}>
            Brackets (playoffs, tournaments), pick-one categories (Oscars, reality TV), hybrid events (wrestling), and multi-phase events (group stage → knockout).
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Will I get spammed?</h4>
          <p style={{ color: '#666', margin: 0 }}>
            No. PickCrown sends one reminder before picks lock and one results email after the event. That's it.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 4px', fontWeight: 600 }}>Is PickCrown free?</h4>
          <p style={{ color: '#666', margin: 0 }}>
            Right now, yes. Any future monetization will never interfere with private pools or participation.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Link 
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Get Started →
        </Link>
      </div>
    </div>
  )
}
