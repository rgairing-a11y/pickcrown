'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// SORTING RULE: Locked beats open. Seasons beat events. Now beats later.

// Visibility helper: Is pool currently visible?
// Visible if: open_date <= now AND (archive_date is null OR archive_date > now) AND status != 'archived'
function isPoolVisible(pool) {
  if (!pool) return false
  if (pool.status === 'archived') return false

  const now = new Date()

  // Check open_date (if set and in future, not visible yet)
  if (pool.open_date && new Date(pool.open_date) > now) return false

  // Check archive_date (if set and in past, auto-archived)
  if (pool.archive_date && new Date(pool.archive_date) < now) return false

  return true
}

export default function HomePage() {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ), [])

  const [email, setEmail] = useState('')
  const [entries, setEntries] = useState([])
  const [managedPools, setManagedPools] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('pickcrown_email')
    if (savedEmail) {
      setEmail(savedEmail)
      loadUserData(savedEmail)
    }
  }, [])

  async function loadUserData(userEmail) {
    if (!userEmail) return
    setLoading(true)
    setHasSearched(true)

    const normalizedEmail = userEmail.toLowerCase().trim()
    localStorage.setItem('pickcrown_email', normalizedEmail)

    // Get user's entries with full context (including visibility columns)
    const { data: entriesData } = await supabase
      .from('pool_entries')
      .select(`
        id,
        entry_name,
        display_name,
        pool:pools!inner(
          id,
          name,
          status,
          open_date,
          archive_date,
          event:events(
            id, name, year, start_time, status,
            season:seasons(id, name)
          )
        )
      `)
      .ilike('email', normalizedEmail)

    // Get pools user manages (including visibility columns)
    const { data: managedData } = await supabase
      .from('pools')
      .select(`
        id,
        name,
        status,
        open_date,
        archive_date,
        event:events(id, name, year, start_time, status)
      `)
      .ilike('owner_email', normalizedEmail)

    // Filter entries to only visible pools (client-side for flexibility)
    const visibleEntries = (entriesData || []).filter(e => isPoolVisible(e.pool))
    const visibleManaged = (managedData || []).filter(p => isPoolVisible(p))

    setEntries(visibleEntries)
    setManagedPools(visibleManaged)
    setLoading(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (email.trim()) {
      loadUserData(email.trim())
    }
  }

  // Helper: Is event locked or in progress?
  const isHappeningNow = (event) => {
    if (!event) return false
    const now = new Date()
    const startTime = new Date(event.start_time)
    return startTime < now && event.status !== 'completed'
  }

  // Helper: Is event open for picks?
  const isOpen = (event) => {
    if (!event) return false
    return new Date(event.start_time) > new Date()
  }

  // Helper: Is event completed?
  const isCompleted = (event) => {
    return event?.status === 'completed'
  }

  // Process entries into sections
  const processEntries = () => {
    const happeningNow = []
    const seasonMap = new Map()
    const standalone = []

    entries.forEach(entry => {
      const event = entry.pool?.event
      const season = event?.season

      if (isHappeningNow(event)) {
        happeningNow.push(entry)
      }

      if (season) {
        if (!seasonMap.has(season.id)) {
          seasonMap.set(season.id, { season, entries: [] })
        }
        seasonMap.get(season.id).entries.push(entry)
      } else {
        standalone.push(entry)
      }
    })

    // Sort seasons: Active first, then by earliest event
    const seasons = Array.from(seasonMap.values()).sort((a, b) => {
      const aHasActive = a.entries.some(e => isHappeningNow(e.pool?.event) || isOpen(e.pool?.event))
      const bHasActive = b.entries.some(e => isHappeningNow(e.pool?.event) || isOpen(e.pool?.event))
      if (aHasActive && !bHasActive) return -1
      if (!aHasActive && bHasActive) return 1
      
      const aEarliest = Math.min(...a.entries.map(e => new Date(e.pool?.event?.start_time || 0)))
      const bEarliest = Math.min(...b.entries.map(e => new Date(e.pool?.event?.start_time || 0)))
      return aEarliest - bEarliest
    })

    // Sort entries within each season: Locked > Open > Completed
    seasons.forEach(s => {
      s.entries.sort((a, b) => {
        const aEvent = a.pool?.event
        const bEvent = b.pool?.event
        const aScore = isHappeningNow(aEvent) ? 0 : isOpen(aEvent) ? 1 : 2
        const bScore = isHappeningNow(bEvent) ? 0 : isOpen(bEvent) ? 1 : 2
        if (aScore !== bScore) return aScore - bScore
        return new Date(aEvent?.start_time || 0) - new Date(bEvent?.start_time || 0)
      })
    })

    // Sort standalone: Locked > Open > Completed
    standalone.sort((a, b) => {
      const aEvent = a.pool?.event
      const bEvent = b.pool?.event
      const aScore = isHappeningNow(aEvent) ? 0 : isOpen(aEvent) ? 1 : 2
      const bScore = isHappeningNow(bEvent) ? 0 : isOpen(bEvent) ? 1 : 2
      if (aScore !== bScore) return aScore - bScore
      return new Date(aEvent?.start_time || 0) - new Date(bEvent?.start_time || 0)
    })

    return { happeningNow, seasons, standalone }
  }

  const { happeningNow, seasons, standalone } = processEntries()

  // Entry Card Component
  const EntryCard = ({ entry, showSeason = false }) => {
    const event = entry.pool?.event
    const happening = isHappeningNow(event)
    const open = isOpen(event)
    const completed = isCompleted(event)

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        background: happening ? '#fef3c7' : open ? '#f0fdf4' : '#f9fafb',
        borderRadius: 8,
        border: `1px solid ${happening ? '#fcd34d' : open ? '#bbf7d0' : '#e5e7eb'}`,
        marginBottom: 8
      }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
            {entry.pool?.name}
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
            {event?.name} {event?.year}
            {showSeason && event?.season && (
              <span style={{ marginLeft: 8, color: '#8b5cf6' }}>
                • {event.season.name}
              </span>
            )}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>
            Entry: {entry.display_name || entry.entry_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {happening && (
            <span style={{ 
              padding: '4px 10px', 
              background: '#f59e0b', 
              color: 'white', 
              borderRadius: 12, 
              fontSize: 11, 
              fontWeight: 600 
            }}>
              🔒 LIVE
            </span>
          )}
          {open && (
            <Link
              href={`/pool/${entry.pool?.id}`}
              style={{
                padding: '8px 14px',
                background: '#16a34a',
                color: 'white',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Make Picks
            </Link>
          )}
          <Link
            href={`/pool/${entry.pool?.id}/standings`}
            style={{
              padding: '8px 14px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 13
            }}
          >
            Standings
          </Link>
        </div>
      </div>
    )
  }

  // Season Card Component
  const SeasonCard = ({ seasonData }) => {
    const [expanded, setExpanded] = useState(true)
    const { season, entries: seasonEntries } = seasonData
    
    const activeCount = seasonEntries.filter(e => 
      isHappeningNow(e.pool?.event) || isOpen(e.pool?.event)
    ).length
    const hasActive = activeCount > 0

    return (
      <div style={{
        marginBottom: 16,
        border: hasActive ? '2px solid #a78bfa' : '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            padding: 16,
            background: hasActive 
              ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              : '#f3f4f6',
            color: hasActive ? 'white' : '#374151',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'left'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              🏆 {season.name}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
              {seasonEntries.length} event{seasonEntries.length !== 1 ? 's' : ''}
              {activeCount > 0 && (
                <span style={{ marginLeft: 8, fontWeight: 600 }}>
                  • {activeCount} active
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href={`/season/${season.id}/standings`}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: '6px 12px',
                background: hasActive ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                color: hasActive ? 'white' : '#374151',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Season Standings
            </Link>
            <span style={{ fontSize: 18 }}>{expanded ? '▼' : '▶'}</span>
          </div>
        </button>
        
        {expanded && (
          <div style={{ padding: 12, background: hasActive ? '#faf5ff' : '#fafafa' }}>
            {seasonEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 48, margin: '0 0 8px' }}>👑</h1>
        <h2 style={{ fontSize: 28, margin: '0 0 8px', fontWeight: 700 }}>PickCrown</h2>
        <p style={{ color: '#666', margin: 0 }}>
          Private prediction pools for people you know
        </p>
      </div>

      {/* Email Gate */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12, maxWidth: 500, margin: '0 auto' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to find your pools"
            required
            style={{
              flex: 1,
              padding: 14,
              fontSize: 16,
              border: '2px solid #e5e7eb',
              borderRadius: 8
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '...' : 'Go'}
          </button>
        </div>
      </form>

      {/* Content */}
      {hasSearched && !loading && (
        <>
          {entries.length === 0 && managedPools.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 48,
              background: '#f9fafb',
              borderRadius: 12,
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ fontSize: 18, color: '#666', margin: '0 0 8px' }}>
                No active pools found for this email
              </p>
              <p style={{ fontSize: 14, color: '#999', margin: 0 }}>
                If you've been invited to a pool, use the link you received.
              </p>
              <Link
                href="/archived"
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  color: '#374151',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 13
                }}
              >
                📦 Check Archived Pools
              </Link>
            </div>
          ) : (
            <>
              {/* SECTION 1: HAPPENING NOW */}
              {happeningNow.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    padding: 16,
                    borderRadius: '12px 12px 0 0',
                    marginBottom: 0
                  }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                      🔒 Happening Now
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
                      These events are locked or underway
                    </p>
                  </div>
                  <div style={{
                    background: '#fffbeb',
                    padding: 12,
                    borderRadius: '0 0 12px 12px',
                    border: '2px solid #fcd34d',
                    borderTop: 'none'
                  }}>
                    {happeningNow.map(entry => (
                      <EntryCard key={entry.id} entry={entry} showSeason />
                    ))}
                  </div>
                </section>
              )}

              {happeningNow.length === 0 && (
                <div style={{
                  padding: 20,
                  background: '#f0fdf4',
                  borderRadius: 12,
                  border: '1px solid #bbf7d0',
                  marginBottom: 32,
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: '#166534' }}>
                    ✓ No active events right now. You're all caught up!
                  </p>
                </div>
              )}

              {/* SECTION 2: YOUR SEASONS */}
              {seasons.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ 
                    fontSize: 16, 
                    color: '#666', 
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Your Seasons
                  </h2>
                  {seasons.map(seasonData => (
                    <SeasonCard key={seasonData.season.id} seasonData={seasonData} />
                  ))}
                </section>
              )}

              {/* SECTION 3: STANDALONE EVENTS */}
              {standalone.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ 
                    fontSize: 16, 
                    color: '#666', 
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Other Events
                  </h2>
                  {standalone.map(entry => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </section>
              )}

              {/* SECTION 4: POOLS YOU MANAGE */}
              {managedPools.length > 0 && (
                <section style={{ marginBottom: 32 }}>
                  <h2 style={{ 
                    fontSize: 16, 
                    color: '#666', 
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    🛠️ Pools You Manage
                  </h2>
                  {managedPools
                    .sort((a, b) => {
                      const aScore = isHappeningNow(a.event) ? 0 : isOpen(a.event) ? 1 : 2
                      const bScore = isHappeningNow(b.event) ? 0 : isOpen(b.event) ? 1 : 2
                      return aScore - bScore
                    })
                    .map(pool => (
                      <div
                        key={pool.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 14,
                          background: isHappeningNow(pool.event) ? '#fef3c7' : '#f3f4f6',
                          borderRadius: 8,
                          border: `1px solid ${isHappeningNow(pool.event) ? '#fcd34d' : '#e5e7eb'}`,
                          marginBottom: 8
                        }}
                      >
                        <div>
                          <h4 style={{ margin: 0, fontSize: 15 }}>{pool.name}</h4>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                            {pool.event?.name} {pool.event?.year}
                          </p>
                        </div>
                        <Link
                          href={`/pool/${pool.id}/manage`}
                          style={{
                            padding: '8px 14px',
                            background: '#7c3aed',
                            color: 'white',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: 13
                          }}
                        >
                          Manage
                        </Link>
                      </div>
                    ))}
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: 14, flexWrap: 'wrap' }}>
          <Link href="/commissioner/signup" style={{ color: '#7c3aed', fontWeight: 600 }}>
            👑 Become a Commissioner
          </Link>
          <Link href="/archived" style={{ color: '#6b7280' }}>
            📦 Archived Pools
          </Link>
          <Link href="/about" style={{ color: '#6b7280' }}>
            About PickCrown
          </Link>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          © 2025 PickCrown • Built for fun, not profit
        </p>
      </div>
    </div>
  )
}
