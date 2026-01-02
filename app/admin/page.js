'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedEvents, setExpandedEvents] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: eventsData } = await supabase
      .from('events')
      .select(`
        *,
        pools (*)
      `)
      .order('start_time', { ascending: false })

    setEvents(eventsData || [])
    
    // Expand all by default
    const expanded = {}
    eventsData?.forEach(e => expanded[e.id] = true)
    setExpandedEvents(expanded)
    
    setLoading(false)
  }

  function toggleExpand(eventId) {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }))
  }

  async function handleDeleteEvent(eventId) {
    if (!confirm('Delete this event and all its pools?')) return
    if (!confirm('This cannot be undone. Are you sure?')) return
    
    try {
      const res = await fetch(`/api/admin/delete?type=event&id=${eventId}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!data.success) {
        alert('Error deleting event:\n' + (data.errors?.join('\n') || data.error) + 
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
        alert('Error deleting pool:\n' + (data.errors?.join('\n') || data.error) +
              (data.hint ? '\n\nHint: ' + data.hint : ''))
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

  const isLocked = (startTime) => new Date(startTime) < new Date()

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        <p>Loading events...</p>
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
        marginBottom: 32
      }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>👑 Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/admin/delete-diagnostic"
            style={{
              padding: '10px 16px',
              background: '#f59e0b',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            🔧 Test Delete
          </Link>
          <Link
            href="/admin/seasons"
            style={{
              padding: '10px 16px',
              background: '#8b5cf6',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
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
              fontSize: 14,
              fontWeight: 600
            }}
          >
            + New Event
          </Link>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div style={{
          padding: 48,
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: 18, color: '#666', margin: '0 0 16px' }}>
            No events yet
          </p>
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
        events.map(event => {
          const isExpanded = expandedEvents[event.id]
          const locked = isLocked(event.start_time)
          const poolCount = event.pools?.length || 0

          return (
            <div 
              key={event.id}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                marginBottom: 16,
                overflow: 'hidden'
              }}
            >
              {/* Event Header */}
              <div 
                onClick={() => toggleExpand(event.id)}
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isExpanded ? '#f9fafb' : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ 
                    fontSize: 18,
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}>
                    ▶
                  </span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18 }}>
                      {event.name}
                      <span style={{ 
                        marginLeft: 8, 
                        fontSize: 14, 
                        color: '#666',
                        fontWeight: 'normal'
                      }}>
                        {event.year}
                      </span>
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>
                      {poolCount} pool{poolCount !== 1 ? 's' : ''} • 
                      <span style={{ 
                        marginLeft: 4,
                        color: locked ? '#dc2626' : '#16a34a' 
                      }}>
                        {locked ? '🔒 Locked' : '🟢 Open'}
                      </span>
                    </p>
                  </div>
                </div>

                <div 
                  style={{ display: 'flex', gap: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    style={{
                      padding: '6px 12px',
                      background: '#e5e7eb',
                      color: '#374151',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontSize: 13
                    }}
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/events/${event.id}/results`}
                    style={{
                      padding: '6px 12px',
                      background: '#dbeafe',
                      color: '#1d4ed8',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontSize: 13
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
                      fontSize: 13
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Pools Section */}
              {isExpanded && (
                <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <h3 style={{ margin: 0, fontSize: 14, color: '#666', textTransform: 'uppercase' }}>
                      Pools
                    </h3>
                    <Link
                      href={`/admin/pools/new?eventId=${event.id}`}
                      style={{
                        padding: '4px 10px',
                        background: '#f3f4f6',
                        color: '#374151',
                        borderRadius: 4,
                        textDecoration: 'none',
                        fontSize: 12
                      }}
                    >
                      + Add Pool
                    </Link>
                  </div>

                  {event.pools?.length === 0 ? (
                    <p style={{ 
                      color: '#999', 
                      fontSize: 14, 
                      textAlign: 'center',
                      padding: 16,
                      background: '#f9fafb',
                      borderRadius: 8
                    }}>
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
                          background: '#f9fafb',
                          borderRadius: 8,
                          marginBottom: 8
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 15 }}>{pool.name}</strong>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            /pool/{pool.id.slice(0, 8)}...
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link
                            href={`/pool/${pool.id}/manage`}
                            style={{
                              padding: '5px 10px',
                              background: '#e5e7eb',
                              color: '#374151',
                              borderRadius: 4,
                              textDecoration: 'none',
                              fontSize: 12
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
                              fontSize: 12
                            }}
                          >
                            📋 Copy Link
                          </button>
                          <Link
                            href={`/pool/${pool.id}/standings`}
                            style={{
                              padding: '5px 10px',
                              background: '#dcfce7',
                              color: '#166534',
                              borderRadius: 4,
                              textDecoration: 'none',
                              fontSize: 12
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
                              fontSize: 12
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
        })
      )}
    </div>
  )
}
