'use client'

/**
 * EventPodium Component
 * 
 * Displays the Top 3 entries across ALL pools for an event.
 * Per product foundation:
 * - Read-only
 * - Post-event only (only shown when event is completed)
 * - Celebratory element, not a competitive leaderboard
 * - No full rankings beyond top 3
 */
export default function EventPodium({ podium = [], eventName }) {
  if (!podium || podium.length === 0) return null

  return (
    <div style={{
      marginTop: 32,
      padding: 24,
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderRadius: 16,
      border: '2px solid #f59e0b'
    }}>
      <h3 style={{ 
        margin: '0 0 8px', 
        textAlign: 'center',
        color: '#92400e',
        fontSize: 20
      }}>
        🏆 PickCrown Event Podium
      </h3>
      
      <p style={{ 
        textAlign: 'center', 
        color: '#a16207', 
        fontSize: 14,
        margin: '0 0 24px'
      }}>
        Top 3 across all pools for {eventName || 'this event'}
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 16,
        marginBottom: 16
      }}>
        {/* Second Place */}
        {podium[1] && (
          <div style={{
            textAlign: 'center',
            order: 1
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              padding: '16px 20px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              minWidth: 100
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🥈</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>
                {podium[1].entry_name}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {podium[1].total_points} pts
              </div>
            </div>
          </div>
        )}

        {/* First Place (tallest) */}
        {podium[0] && (
          <div style={{
            textAlign: 'center',
            order: 2
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              padding: '24px 24px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              minWidth: 120,
              transform: 'translateY(-16px)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🥇</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1f2937' }}>
                {podium[0].entry_name}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                {podium[0].total_points} pts
              </div>
            </div>
          </div>
        )}

        {/* Third Place */}
        {podium[2] && (
          <div style={{
            textAlign: 'center',
            order: 3
          }}>
            <div style={{
              background: 'white',
              borderRadius: 12,
              padding: '12px 16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              minWidth: 90
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🥉</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>
                {podium[2].entry_name}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {podium[2].total_points} pts
              </div>
            </div>
          </div>
        )}
      </div>

      <p style={{ 
        textAlign: 'center', 
        fontSize: 12, 
        color: '#a16207',
        margin: 0
      }}>
        Congratulations to our champions! 🎉
      </p>
    </div>
  )
}
