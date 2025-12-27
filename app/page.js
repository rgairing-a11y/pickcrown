export const dynamic = 'force-dynamic'

import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const { data: pools } = await supabase
    .from('pools')
    .select(`
      *,
      event:events (name, year, start_time)
    `)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{
        textAlign: 'center',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-hero)', 
          marginBottom: 'var(--spacing-sm)' 
        }}>
          👑 PickCrown
        </h1>
        <p style={{ 
          color: 'var(--color-text-light)', 
          fontSize: 'var(--font-size-lg)' 
        }}>
          Prediction pools for sports and entertainment
        </p>
      </div>

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
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Active Pools</h2>
        </div>

        {pools?.length === 0 ? (
          <div style={{
            padding: 'var(--spacing-xxl)',
            textAlign: 'center',
            color: 'var(--color-text-muted)'
          }}>
            <p>No pools available yet.</p>
            <Link 
              href="/admin" 
              style={{ 
                color: 'var(--color-primary)', 
                fontWeight: 'bold' 
              }}
            >
              Create one in Admin →
            </Link>
          </div>
        ) : (
          <div>
            {pools?.map((pool, idx) => {
              const isLocked = new Date(pool.event?.start_time) < new Date()
              
              return (
                <div
                  key={pool.id}
                  style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: idx < pools.length - 1 ? '1px solid var(--color-border-light)' : 'none',
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
                      {isLocked && (
                        <span style={{ 
                          marginLeft: 'var(--spacing-sm)', 
                          color: 'var(--color-danger)' 
                        }}>
                          🔒 Locked
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link
                      href={`/pool/${pool.id}`}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                        background: isLocked ? 'var(--color-background-dark)' : 'var(--color-primary)',
                        color: isLocked ? 'var(--color-text-light)' : 'white',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 'bold',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      {isLocked ? 'View' : 'Enter Picks'}
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
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div style={{
        marginTop: 'var(--spacing-xxl)',
        textAlign: 'center'
      }}>
        <p style={{ 
          color: 'var(--color-text-muted)', 
          fontSize: 'var(--font-size-sm)' 
        }}>
          Have a pool link? Paste it in your browser to join.
        </p>
      </div>
    </div>
  )
}