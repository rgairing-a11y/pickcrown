import { supabase } from '../lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch all pools with their events
  const { data: pools } = await supabase
    .from('pools')
    .select(`
      *,
      event:events (*)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{
        textAlign: 'center',
        padding: '48px 0'
      }}>
        <h1 style={{ fontSize: 48, marginBottom: 16 }}>👑 PickCrown</h1>
        <p style={{ fontSize: 20, color: '#666' }}>
          Prediction pools for sports and entertainment
        </p>
      </div>

      <h2 style={{ marginBottom: 16 }}>Active Pools</h2>
      
      {pools && pools.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pools.map(pool => {
            const isLocked = new Date(pool.event?.start_time) < new Date()
            return (
              <div 
                key={pool.id}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ marginBottom: 8 }}>{pool.name}</h3>
                <p style={{ color: '#666', marginBottom: 16 }}>
                  {pool.event?.name}
                  {isLocked && (
                    <span style={{ 
                      marginLeft: 8, 
                      background: '#fff3cd', 
                      padding: '2px 8px', 
                      borderRadius: 4,
                      fontSize: 14 
                    }}>
                      Locked
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <Link 
                    href={`/pool/${pool.id}`}
                    style={{
                      background: isLocked ? '#6c757d' : '#28a745',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontWeight: 'bold'
                    }}
                  >
                    {isLocked ? 'View Pool' : 'Make Picks'}
                  </Link>
                  <Link 
                    href={`/pool/${pool.id}/standings`}
                    style={{
                      background: '#0070f3',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontWeight: 'bold'
                    }}
                  >
                    Standings
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p style={{ color: '#666' }}>No pools yet.</p>
      )}
    </div>
  )
}