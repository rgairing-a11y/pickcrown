import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { isEventLocked } from '../lib/utils'
import RecentPools from '../components/RecentPools'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Get all pools with event info
  const { data: pools } = await supabase
    .from('pools')
    .select(`
      *,
      event:events (id, name, year, start_time, season_id)
    `)
    .order('created_at', { ascending: false })

  // Get active seasons
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false })

  // Split pools into upcoming and past
  const upcomingPools = pools?.filter(p => !isEventLocked(p.event?.start_time)) || []
  const pastPools = pools?.filter(p => isEventLocked(p.event?.start_time)) || []

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      
      {/* Hero Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 32,
        padding: 32,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16,
        color: 'white'
      }}>
        <h1 style={{ fontSize: 48, marginBottom: 8 }}>👑 PickCrown</h1>
        <p style={{ fontSize: 18, opacity: 0.95, marginBottom: 8 }}>
          Prediction pools for friends — no accounts, no clutter.
        </p>
        <p style={{ fontSize: 14, opacity: 0.8 }}>
          Playoffs • Wrestling • Awards Shows • Anything worth arguing about
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        marginBottom: 32
      }}>
        <Link
          href="/find-my-picks"
          style={{
            padding: 20,
            background: '#f0f9ff',
            border: '2px solid #0ea5e9',
            borderRadius: 12,
            textDecoration: 'none',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontWeight: 600, color: '#0369a1', fontSize: 16 }}>Find My Picks</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Enter your email to find your pools
          </div>
        </Link>

        <Link
          href="/feedback"
          style={{
            padding: 20,
            background: '#fefce8',
            border: '2px solid #eab308',
            borderRadius: 12,
            textDecoration: 'none',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>💡</div>
          <div style={{ fontWeight: 600, color: '#a16207', fontSize: 16 }}>Feedback & Ideas</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Help us make PickCrown better
          </div>
        </Link>
      </div>

      {/* Recent Pools (localStorage) */}
      <RecentPools />

      {/* Active Seasons */}
      {seasons && seasons.length > 0 && (
        <div style={{
          marginBottom: 32,
          padding: 24,
          background: '#faf5ff',
          borderRadius: 12,
          border: '1px solid #e9d5ff'
        }}>
          <h2 style={{ fontSize: 20, marginBottom: 16, color: '#7c3aed' }}>
            🏆 Active Seasons
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {seasons.map(season => (
              <div
                key={season.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: 'white',
                  borderRadius: 8,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{season.name}</h3>
                  {season.description && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                      {season.description}
                    </p>
                  )}
                </div>
                <Link
                  href={`/season/${season.id}/standings`}
                  style={{
                    padding: '8px 16px',
                    background: '#7c3aed',
                    color: 'white',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Standings
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Pools */}
      {upcomingPools.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>
            🎯 Open Pools
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingPools.map(pool => (
              <div
                key={pool.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: '#f0fdf4',
                  borderRadius: 8,
                  border: '1px solid #bbf7d0'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{pool.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                    {pool.event?.name} ({pool.event?.year})
                    <span style={{ marginLeft: 8, color: '#16a34a' }}>🟢 Open</span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/pool/${pool.id}`}
                    style={{
                      padding: '8px 16px',
                      background: '#16a34a',
                      color: 'white',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    Enter Picks
                  </Link>
                  <Link
                    href={`/pool/${pool.id}/manage`}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      color: '#16a34a',
                      border: '1px solid #16a34a',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Pools */}
      {pastPools.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16, color: '#64748b' }}>
            📊 Past Pools
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pastPools.map(pool => (
              <div
                key={pool.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{pool.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                    {pool.event?.name} ({pool.event?.year})
                    <span style={{ marginLeft: 8, color: '#dc2626' }}>🔒 Locked</span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/pool/${pool.id}/standings`}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    Standings
                  </Link>
                  <Link
                    href={`/pool/${pool.id}/picks`}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      color: '#3b82f6',
                      border: '1px solid #3b82f6',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    All Picks
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
          Have a pool link? Just paste it in your browser to join.
        </p>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: 14 }}>
          <Link href="/find-my-picks" style={{ color: '#3b82f6' }}>
            Find My Picks
          </Link>
          <Link href="/feedback" style={{ color: '#3b82f6' }}>
            Feedback
          </Link>
          <Link href="/admin" style={{ color: '#64748b' }}>
            Admin
          </Link>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: '#94a3b8' }}>
          © 2025 PickCrown • Built for fun, not profit
        </p>
      </div>
    </div>
  )
}