'use client'

/**
 * PrivatePoolMessage Component
 * 
 * Shown to users who are not participants in a pool.
 * Per product foundation: calm copy, no "ask the commissioner" language,
 * no implied action required.
 */
export default function PrivatePoolMessage({ eventName, eventDate }) {
  return (
    <div style={{
      maxWidth: 500,
      margin: '80px auto',
      padding: 32,
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>🔒</div>
      
      <h1 style={{ 
        fontSize: 24, 
        fontWeight: 600, 
        marginBottom: 12,
        color: '#1f2937'
      }}>
        This pool is private
      </h1>
      
      <p style={{ 
        color: '#6b7280', 
        fontSize: 16, 
        lineHeight: 1.6,
        marginBottom: 24
      }}>
        Only invited participants can view picks, standings, and results.
      </p>

      {eventName && (
        <div style={{
          background: '#f9fafb',
          padding: 20,
          borderRadius: 12,
          marginTop: 24
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: 14, 
            color: '#9ca3af',
            marginBottom: 4
          }}>
            Event
          </p>
          <p style={{ 
            margin: 0, 
            fontSize: 18, 
            fontWeight: 600,
            color: '#374151'
          }}>
            {eventName}
          </p>
          {eventDate && (
            <p style={{ 
              margin: '8px 0 0', 
              fontSize: 14, 
              color: '#6b7280'
            }}>
              {new Date(eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <a 
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#7c3aed',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14
          }}
        >
          Go to PickCrown Home
        </a>
      </div>

      <p style={{ 
        marginTop: 32, 
        fontSize: 13, 
        color: '#9ca3af'
      }}>
        PickCrown — Bragging rights only 😄
      </p>
    </div>
  )
}
