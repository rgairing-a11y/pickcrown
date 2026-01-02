'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// SORTING RULE: Locked beats open. Seasons beat events. Now beats later.

export default function AdminPage() {
  const [events, setEvents] = useState([])
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, completed

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Get all events with pools
    const { data: eventsData } = await supabase
      .from('events')
      .select(`
        *,
        pools (*),
        season:seasons(id, name)
      `)
      .order('start_time', { ascending: false })

    // Get all seasons
    const { data: seasonsData } = await supabase
      .from('seasons')
      .select('*')
      .order('created_at', { ascending: false })

    setEvents(eventsData || [])
    setSeasons(seasonsData || [])
    setLoading(false)
  }

  // Helper functions
  const isHappeningNow = (event) => {
    const now = new Date()
    const startTime = new Date(event.start_time)
    return startTime < now && event.status !== 'completed'
  }

  const isOpen = (event) => {
    return new Date(event.start_time) > new Date()
  }

  const isCompleted = (event) => {
    return event.status === 'completed'
  }

  // Process events into sections
  const processEvents = () => {
    let filtered = [...events]

    // Apply filter
    if (filter === 'active') {
      filtered = filtered.filter(e => isHappeningNow(e) || isOpen(e))
    } else if (filter === 'completed') {
      filtered = filtered.filter(e => isCompleted(e))
    }

    const happeningNow = filtered.filter(e => isHappeningNow(e))
    const open = filtered.filter(e => isOpen(e))
    const completed = filtered.filter(e => isCompleted(e))

    // Sort each by start_time
    happeningNow.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    open.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    completed.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)) // Newest first

    return { happeningNow, open, completed }
  }

  const { happeningNow, open, completed } = processEvents()

  async function handleDeleteEvent(eventId) {
    if (!confirm('Delete this event and all its pools?')) return
    if (!confirm('This cannot be undone. Are you sure?')) return

    try {
      const res = await fetch(`/api/admin/delete?type=event&id=${eventId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!data.success) {
        alert('Error deleting:\n' + (data.errors?.join('\n') || data.error) +
              (data.hint ? '\n\nHint: ' + data.hint : ''))
        return
      }
      alert('Event deleted!')
      loadData()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDeletePool(poolId) {
    if (!confirm('Delete this pool and all its entries?')) return

    try {
      const res = await fetch(`/api/admin/delete?type=pool&id=${poolId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!data.success) {
        alert('Error deleting:\n' + (data.errors?.join('\n') || data.error))
        return
      }
      alert('Pool deleted!')
      loadData()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  function copyPoolLink(poolId) {
    const url = `${window.location.origin}/pool/${poolId}`
    navigator.clipboard.writeText(url)
    alert('Link copied!')
  }

  // Event Card Component
  const EventCard = ({ event, highlight = false }) => {
    const [expanded, setExpanded] = useState(highlight)
    const poolCount = event.pools?.length || 0
    const happening = isHappeningNow(event)
    const openForPicks = isOpen(event)

    return (
      <div style={{
        background: 'white',
        borderRadius: 12,
        border: highlight ? '2px solid #f59e0b' : '1px solid #e5e7eb',
        marginBottom: 12,
        overflow: 'hidden'
      }}>
        {/* Event Header */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: 16,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: highlight ? '#fffbeb' : expanded ? '#f9fafb' : 'white'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 16,
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
            }}>
              ▶
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 17 }}>
                  {event.name} <span style={{ color: '#666', fontWeight: 'normal' }}>{event.year}</span>
                </h3>
                {happening && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#f59e0b',
                    color: 'white',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    🔒 LIVE
                  </span>
                )}
                {openForPicks && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#16a34a',
                    color: 'white',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    🟢 OPEN
                  </span>
                )}
                {event.season && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#ede9fe',
                    color: '#7c3aed',
                    borderRadius: 10,
                    fontSize: 11
                  }}>
                    🏆 {event.season.name}
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                {poolCount} pool{poolCount !== 1 ? 's' : ''}
                {event.event_type && ` • ${event.event_type}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/admin/events/${event.id}/edit`}
              style={{
                padding: '6px 12px',
                background: '#e5e7eb',
                color: '#374151',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 12
              }}
            >
              Edit
            </Link>
            {event.event_type === 'bracket' ? (
              <Link
                href={`/admin/events/${event.id}/matchups`}
                style={{
                  padding: '6px 12px',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 12
                }}
              >
                Matchups
              </Link>
            ) : (
              <Link
                href={`/admin/events/${event.id}/categories`}
                style={{
                  padding: '6px 12px',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 12
                }}
              >
                Categories
              </Link>
            )}
            <Link
              href={`/admin/events/${event.id}/results`}
              style={{
                padding: '6px 12px',
                background: '#dcfce7',
                color: '#166534',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 12
              }}
            >
              Results
            </Link>
            <button
              onClick={() => handleDeleteEvent(event.id)}
              style={{
                padding: '6px 12px',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Pools Section */}
        {expanded && (
          <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <h4 style={{ margin: 0, fontSize: 13, color: '#666', textTransform: 'uppercase' }}>
                Pools
              </h4>
              <Link
                href={`/admin/pools/new?eventId=${event.id}`}
                style={{
                  padding: '4px 10px',
                  background: '#e5e7eb',
                  color: '#374151',
                  borderRadius: 4,
                  textDecoration: 'none',
                  fontSize: 11
                }}
              >
                + Add Pool
              </Link>
            </div>

            {event.pools?.length === 0 ? (
              <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 16 }}>
                No pools yet
              </p>
            ) : (
              event.pools?.map(pool => (
                <div
                  key={pool.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    background: 'white',
                    borderRadius: 6,
                    marginBottom: 6,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{pool.name}</strong>
                    {pool.status === 'archived' && (
                      <span style={{
                        marginLeft: 8,
                        padding: '2px 6px',
                        background: '#f3f4f6',
                        color: '#666',
                        borderRadius: 4,
                        fontSize: 10
                      }}>
                        Archived
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Link
                      href={`/pool/${pool.id}/manage`}
                      style={{
                        padding: '5px 10px',
                        background: '#e5e7eb',
                        color: '#374151',
                        borderRadius: 4,
                        textDecoration: 'none',
                        fontSize: 11
                      }}
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => copyPoolLink(pool.id)}
                      style={{
                        padding: '5px 10px',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11
                      }}
                    >
                      📋 Link
                    </button>
                    <Link
                      href={`/pool/${pool.id}/standings`}
                      style={{
                        padding: '5px 10px',
                        background: '#dcfce7',
                        color: '#166534',
                        borderRadius: 4,
                        textDecoration: 'none',
                        fontSize: 11
                      }}
                    >
                      Standings
                    </Link>
                    <button
                      onClick={() => handleDeletePool(pool.id)}
                      style={{
                        padding: '5px 10px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>👑 Admin Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>
            {events.length} events • {events.reduce((sum, e) => sum + (e.pools?.length || 0), 0)} pools
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href="/test-delete"
            style={{
              padding: '10px 16px',
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            🔧 Test Delete
          </Link>
          <Link
            href="/admin/seasons"
            style={{
              padding: '10px 16px',
              background: '#ede9fe',
              color: '#7c3aed',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            🏆 Seasons
          </Link>
          <Link
            href="/admin/events/new"
            style={{
              padding: '10px 16px',
              background: '#16a34a',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            + New Event
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 12
      }}>
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              background: filter === f ? '#3b82f6' : 'transparent',
              color: filter === f ? 'white' : '#666',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: filter === f ? 600 : 400,
              fontSize: 14
            }}
          >
            {f === 'all' ? 'All' : f === 'active' ? '🔥 Active' : '✅ Completed'}
            {f === 'active' && ` (${happeningNow.length + open.length})`}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 48,
          background: '#f9fafb',
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: 18, color: '#666', margin: '0 0 16px' }}>No events yet</p>
          <Link
            href="/admin/events/new"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <>
          {/* SECTION 1: HAPPENING NOW */}
          {happeningNow.length > 0 && filter !== 'completed' && (
            <section style={{ marginBottom: 32 }}>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: 12,
                borderRadius: '12px 12px 0 0'
              }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  🔒 Happening Now ({happeningNow.length})
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.9 }}>
                  Events that are locked or in progress
                </p>
              </div>
              <div style={{
                background: '#fffbeb',
                padding: 12,
                borderRadius: '0 0 12px 12px',
                border: '2px solid #fcd34d',
                borderTop: 'none'
              }}>
                {happeningNow.map(event => (
                  <EventCard key={event.id} event={event} highlight />
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: OPEN FOR PICKS */}
          {open.length > 0 && filter !== 'completed' && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: 14,
                color: '#666',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                🟢 Open for Picks ({open.length})
              </h2>
              {open.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </section>
          )}

          {/* SECTION 3: COMPLETED */}
          {completed.length > 0 && filter !== 'active' && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: 14,
                color: '#666',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                ✅ Completed ({completed.length})
              </h2>
              {completed.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </section>
          )}

          {/* No results message */}
          {filter === 'active' && happeningNow.length === 0 && open.length === 0 && (
            <div style={{
              padding: 32,
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: 12
            }}>
              <p style={{ color: '#666', margin: 0 }}>No active events</p>
            </div>
          )}

          {filter === 'completed' && completed.length === 0 && (
            <div style={{
              padding: 32,
              textAlign: 'center',
              background: '#f9fafb',
              borderRadius: 12
            }}>
              <p style={{ color: '#666', margin: 0 }}>No completed events</p>
            </div>
          )}
        </>
      )}

      {/* Quick Links */}
      <div style={{
        marginTop: 48,
        padding: 16,
        background: '#f3f4f6',
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        flexWrap: 'wrap'
      }}>
        <Link href="/" style={{ color: '#3b82f6', fontSize: 14 }}>
          ← Back to Home
        </Link>
        <Link href="/admin/seasons" style={{ color: '#7c3aed', fontSize: 14 }}>
          Manage Seasons
        </Link>
        <Link href="/feedback" style={{ color: '#666', fontSize: 14 }}>
          Send Feedback
        </Link>
      </div>
    </div>
  )
}
