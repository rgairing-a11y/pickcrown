export const dynamic = 'force-dynamic'

import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { isEventLocked } from '../lib/utils'

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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 'var(--spacing-xxl)',
        padding: 'var(--spacing-xl)',
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h1 style={{ fontSize: 'var(--font-size-hero)', marginBottom: 'var(--spacing-sm)' }}>
          👑 PickCrown
        </h1>
        <p style={{ color: 'var(--color-text)', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-md)' }}>
          A simple, no-nonsense prediction pool for sharing picks with friends — no accounts, no clutter.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Built for playoffs, wrestling events, awards shows, and anything else worth arguing about.
        </p>
      </div>

      {/* 🔥 Featured / Upcoming Pools */}
      {upcomingPools.length > 0 && (
        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <div style={{
            padding: 'var(--spacing-lg)',
            background: '#fff3cd',
            borderBottom: '1px solid #ffc107'
          }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>🔥 Make Your Picks</h2>
            <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--font-size-sm)', color: '#856404' }}>
              These pools are open for entries
            </p>
          </div>

          <div>
            {upcomingPools.map((pool, idx) => (
              <div
                key={pool.id}
                style={{
                  padding: 'var(--spacing-lg)',
                  borderBottom: idx < upcomingPools.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-md)'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                    {pool.name}
                  </h3>
                  <p style={{
                    margin: 'var(--spacing-xs) 0 0',
                    color: 'var(--color-text-light)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {pool.event?.name} ({pool.event?.year})
                  </p>
                </div>

                <Link
                  href={`/pool/${pool.id}`}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'bold',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  Enter Picks →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🏆 Active Seasons */}
      {seasons && seasons.length > 0 && (
        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <div style={{
            padding: 'var(--spacing-lg)',
            background: '#d4edda',
            borderBottom: '1px solid #28a745'
          }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>🏆 Seasons</h2>
            <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--font-size-sm)', color: '#155724' }}>
              Compete across multiple events
            </p>
          </div>

          <div>
            {seasons.map((season, idx) => (
              <div
                key={season.id}
                style={{
                  padding: 'var(--spacing-lg)',
                  borderBottom: idx < seasons.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-md)'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                    {season.name}
                  </h3>
                  {season.description && (
                    <p style={{
                      margin: 'var(--spacing-xs) 0 0',
                      color: 'var(--color-text-light)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      {season.description}
                    </p>
                  )}
                </div>

                <Link
                  href={`/season/${season.id}/standings`}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    background: '#28a745',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 'bold',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  View Standings →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past/Locked Pools */}
      {pastPools.length > 0 && (
        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-background-dark)',
            borderBottom: '1px solid var(--color-border-light)'
          }}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>📋 Past Pools</h2>
          </div>

          <div>
            {pastPools.map((pool, idx) => (
              <div
                key={pool.id}
                style={{
                  padding: 'var(--spacing-lg)',
                  borderBottom: idx < pastPools.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-md)'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                    {pool.name}
                  </h3>
                  <p style={{
                    margin: 'var(--spacing-xs) 0 0',
                    color: 'var(--color-text-light)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {pool.event?.name} ({pool.event?.year})
                    <span style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-danger)' }}>
                      🔒 Locked
                    </span>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <Link
                    href={`/pool/${pool.id}`}
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-lg)',
                      background: 'var(--color-background-dark)',
                      color: 'var(--color-text-light)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 'bold',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    View
                  </Link>
                  <Link
                    href={`/pool/${pool.id}/standings`}
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-lg)',
                      background: 'var(--color-success-light)',
                      color: 'var(--color-success-dark)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 'bold',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Standings
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
npm run dev
      <div style={{ marginTop: 'var(--spacing-xxl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Have a pool link? Paste it in your browser to join.
        </p>
      </div>
    </div>
  )
}