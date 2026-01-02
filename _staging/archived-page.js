'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ArchivedPoolsPage() {
  const [email, setEmail] = useState('')
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('pickcrown_email')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setSearched(true)

    const normalizedEmail = email.toLowerCase().trim()
    localStorage.setItem('pickcrown_email', normalizedEmail)

    // Get archived entries
    const { data: entries } = await supabase
      .from('pool_entries')
      .select(`
        id,
        entry_name,
        pool:pools!inner(
          id,
          name,
          status,
          event:events(id, name, year, start_time)
        )
      `)
      .ilike('email', normalizedEmail)
      .eq('pool.status', 'archived')

    // Get archived pools user manages
    const { data: managedPools } = await supabase
      .from('pools')
      .select(`
        id,
        name,
        status,
        event:events(id, name, year, start_time)
      `)
      .ilike('owner_email', normalizedEmail)
      .eq('status', 'archived')

    // Combine and dedupe
    const allPools = []
    const seenIds = new Set()

    entries?.forEach(entry => {
      if (entry.pool && !seenIds.has(entry.pool.id)) {
        seenIds.add(entry.pool.id)
        allPools.push({
          ...entry.pool,
          entryName: entry.entry_name,
          isManager: false
        })
      }
    })

    managedPools?.forEach(pool => {
      if (!seenIds.has(pool.id)) {
        seenIds.add(pool.id)
        allPools.push({
          ...pool,
          isManager: true
        })
      } else {
        // Mark as manager if already in list
        const existing = allPools.find(p => p.id === pool.id)
        if (existing) existing.isManager = true
      }
    })

    // Sort by event date descending
    allPools.sort((a, b) => 
      new Date(b.event?.start_time || 0) - new Date(a.event?.start_time || 0)
    )

    setPools(allPools)
    setLoading(false)
  }

  async function handleUnarchive(poolId) {
    if (!confirm('Unarchive this pool? It will appear in your active pools again.')) return

    try {
      const res = await fetch(`/api/pools/${poolId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      })

      if (!res.ok) throw new Error('Failed to unarchive')

      // Remove from list
      setPools(prev => prev.filter(p => p.id !== poolId))
      alert('Pool unarchived!')
    } catch (err) {
      alert('Error unarchiving pool')
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <Link href="/" style={{ color: '#3b82f6', fontSize: 14 }}>← Back to Home</Link>
      
      <h1 style={{ marginTop: 16, marginBottom: 8 }}>📦 Archived Pools</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        View pools you've archived. You can unarchive them at any time.
      </p>

      {/* Email Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              flex: 1,
              padding: 12,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 8
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Find Archived'}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <>
          {pools.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 48,
              background: '#f9fafb',
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ fontSize: 18, color: '#666', margin: 0 }}>
                No archived pools found for this email.
              </p>
              <p style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
                Pools you archive from the manage page will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: '#666', fontSize: 14 }}>
                Found {pools.length} archived pool{pools.length !== 1 ? 's' : ''}
              </p>
              
              {pools.map(pool => (
                <div
                  key={pool.id}
                  style={{
                    padding: 16,
                    background: '#f9fafb',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{pool.name}</h3>
                      <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
                        {pool.event?.name} {pool.event?.year}
                      </p>
                      {pool.entryName && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999' }}>
                          Entry: {pool.entryName}
                        </p>
                      )}
                      {pool.isManager && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: 8,
                          padding: '2px 8px',
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          borderRadius: 4,
                          fontSize: 11
                        }}>
                          Commissioner
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/pool/${pool.id}/standings`}
                        style={{
                          padding: '8px 12px',
                          background: '#e5e7eb',
                          color: '#374151',
                          borderRadius: 6,
                          textDecoration: 'none',
                          fontSize: 13
                        }}
                      >
                        Standings
                      </Link>
                      {pool.isManager && (
                        <button
                          onClick={() => handleUnarchive(pool.id)}
                          style={{
                            padding: '8px 12px',
                            background: '#dcfce7',
                            color: '#166534',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 13
                          }}
                        >
                          Unarchive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Help Text */}
      <div style={{
        marginTop: 48,
        padding: 16,
        background: '#fffbeb',
        borderRadius: 8,
        border: '1px solid #fde68a'
      }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>💡 How to archive a pool</h4>
        <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
          Go to your pool's Manage page and scroll down to the "Danger Zone" section. 
          Click "Archive Pool" to move it here. Archived pools are hidden from your 
          main dashboard but can be unarchived anytime.
        </p>
      </div>
    </div>
  )
}
