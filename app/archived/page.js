'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ArchivedPage() {
  const [email, setEmail] = useState('')
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('pickcrown_email')
    if (savedEmail) {
      setEmail(savedEmail)
      loadArchivedPools(savedEmail)
    }
  }, [])

  // Check if pool is archived (either by status OR by archive_date)
  function isArchived(pool) {
    if (pool.status === 'archived') return true
    if (pool.archive_date && new Date(pool.archive_date) < new Date()) return true
    return false
  }

  // Get archive reason for display
  function getArchiveReason(pool) {
    if (pool.status === 'archived') return 'Manually archived'
    if (pool.archive_date && new Date(pool.archive_date) < new Date()) {
      return `Auto-archived on ${new Date(pool.archive_date).toLocaleDateString()}`
    }
    return null
  }

  async function loadArchivedPools(userEmail) {
    if (!userEmail) return
    setLoading(true)
    setHasSearched(true)

    const normalizedEmail = userEmail.toLowerCase().trim()
    localStorage.setItem('pickcrown_email', normalizedEmail)

    // Get pools where user has entries
    const { data: entriesData } = await supabase
      .from('pool_entries')
      .select(`
        id,
        entry_name,
        display_name,
        pool:pools(
          id,
          name,
          status,
          open_date,
          archive_date,
          owner_email,
          event:events(id, name, year, status)
        )
      `)
      .ilike('email', normalizedEmail)

    // Get pools user manages
    const { data: managedData } = await supabase
      .from('pools')
      .select(`
        id,
        name,
        status,
        open_date,
        archive_date,
        owner_email,
        event:events(id, name, year, status)
      `)
      .ilike('owner_email', normalizedEmail)

    // Combine and deduplicate
    const allPools = new Map()
    
    // Add pools from entries
    entriesData?.forEach(entry => {
      if (entry.pool && isArchived(entry.pool)) {
        allPools.set(entry.pool.id, {
          ...entry.pool,
          userEntry: entry,
          isManager: entry.pool.owner_email?.toLowerCase() === normalizedEmail
        })
      }
    })

    // Add managed pools
    managedData?.forEach(pool => {
      if (isArchived(pool)) {
        if (allPools.has(pool.id)) {
          allPools.get(pool.id).isManager = true
        } else {
          allPools.set(pool.id, {
            ...pool,
            userEntry: null,
            isManager: true
          })
        }
      }
    })

    // Sort by event date descending (most recent first)
    const sortedPools = Array.from(allPools.values())
      .sort((a, b) => new Date(b.event?.start_time || 0) - new Date(a.event?.start_time || 0))

    setPools(sortedPools)
    setLoading(false)
  }

  async function handleUnarchive(poolId) {
    if (!confirm('Restore this pool to active status?')) return

    // Set status to active and clear archive_date
    const { error } = await supabase
      .from('pools')
      .update({ 
        status: 'active',
        archive_date: null 
      })
      .eq('id', poolId)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Pool restored!')
      loadArchivedPools(email)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (email.trim()) {
      loadArchivedPools(email.trim())
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <Link href="/" style={{ color: '#3b82f6', fontSize: 14 }}>
        ← Back to Home
      </Link>

      <h1 style={{ marginTop: 16, marginBottom: 8 }}>📦 Archived Pools</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        View pools that have been archived or hidden from your dashboard.
      </p>

      {/* Email Search */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
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
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      {hasSearched && !loading && (
        <>
          {pools.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 48,
              background: '#f9fafb',
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ fontSize: 16, color: '#666', margin: 0 }}>
                No archived pools found for this email.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                Found {pools.length} archived pool{pools.length !== 1 ? 's' : ''}
              </p>

              {pools.map(pool => (
                <div
                  key={pool.id}
                  style={{
                    padding: 16,
                    background: '#f9fafb',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    marginBottom: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>
                        {pool.name}
                      </h3>
                      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#666' }}>
                        {pool.event?.name} {pool.event?.year}
                      </p>
                      
                      {/* Archive reason */}
                      <p style={{ 
                        margin: '8px 0 0', 
                        fontSize: 12, 
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{ 
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: pool.status === 'archived' ? '#f59e0b' : '#94a3b8'
                        }}></span>
                        {getArchiveReason(pool)}
                      </p>

                      {pool.userEntry && (
                        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#666' }}>
                          Your entry: {pool.userEntry.display_name || pool.userEntry.entry_name}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/pool/${pool.id}/standings`}
                        style={{
                          padding: '8px 14px',
                          background: '#e5e7eb',
                          color: '#374151',
                          borderRadius: 6,
                          textDecoration: 'none',
                          fontSize: 13
                        }}
                      >
                        View
                      </Link>

                      {pool.isManager && (
                        <button
                          onClick={() => handleUnarchive(pool.id)}
                          style={{
                            padding: '8px 14px',
                            background: '#dcfce7',
                            color: '#166534',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 500
                          }}
                        >
                          Restore
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
        marginTop: 32,
        padding: 16,
        background: '#f0f9ff',
        borderRadius: 8,
        border: '1px solid #bae6fd'
      }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#0369a1' }}>
          Why are pools archived?
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#0369a1' }}>
          <li><strong>Manually archived:</strong> A commissioner archived the pool</li>
          <li><strong>Auto-archived:</strong> The pool's visibility window has ended</li>
        </ul>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: '#0369a1' }}>
          Commissioners can restore archived pools from this page.
        </p>
      </div>
    </div>
  )
}
