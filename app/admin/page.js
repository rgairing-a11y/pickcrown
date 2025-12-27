'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function AdminHome() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedEvents, setExpandedEvents] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Fetch events with their pools
    const { data: eventsData } = await supabase
      .from('events')
      .select(`
        *,
        pools (
          *
        ),
        categories (
          id
        )
      `)
      .order('start_time', { ascending: false })

    setEvents(eventsData || [])
    
    // Auto-expand all events initially
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
    if (!confirm('Delete this event, all its categories, and all its pools?')) return
    
    await supabase.from('events').delete().eq('id', eventId)
    loadData()
  }

  async function handleDeletePool(poolId) {
    if (!confirm('Delete this pool and all its entries?')) return
    
    await supabase.from('pools').delete().eq('id', poolId)
    loadData()
  }

  function copyPoolLink(poolId) {
    const url = `${window.location.origin}/pool/${poolId}`
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24
      }}>
        <h1 style={{ margin: 0 }}>👑 Admin Dashboard</h1>
        <Link 
          href="/admin/events/new"
          style={{
            background: '#28a745',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 14
          }}
        >
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div style={{
          background: 'white',
          padding: 48,
          borderRadius: 12,
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#666', marginBottom: 16 }}>No events yet</p>
          <Link 
            href="/admin/events/new"
            style={{ color: '#0070f3', fontWeight: 'bold' }}
          >
            Create your first event →
          </Link>
        </div>
      ) : (
        events.map(event => {
          const isExpanded = expandedEvents[event.id]
          const isLocked = new Date(event.start_time) < new Date()
          const categoryCount = event.categories?.length || 0
          const poolCount = event.pools?.length || 0

          return (
            <div 
              key={event.id}
              style={{
                background: 'white',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                  borderBottom: isExpanded ? '1px solid #eee' : 'none'
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
                    <div style={{ 
                      fontSize: 13, 
                      color: '#666',
                      marginTop: 4,
                      display: 'flex',
                      gap: 16
                    }}>
                      <span>{categoryCount} categories</span>
                      <span>{poolCount} pool{poolCount !== 1 ? 's' : ''}</span>
                      {isLocked ? (
                        <span style={{ color: '#dc3545' }}>🔒 Locked</span>
                      ) : (
                        <span style={{ color: '#28a745' }}>🟢 Open</span>
                      )}
                    </div>
                  </div>
                </div>

                <div 
                  style={{ display: 'flex', gap: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link 
  href={`/admin/events/${event.id}/edit`}
  style={{ 
    fontSize: 13, 
    color: '#6c757d',
    padding: '6px 12px',
    background: '#f5f5f5',
    borderRadius: 4
  }}
>
  Edit
</Link>
                  <Link 
                    href={`/admin/events/${event.id}/categories`}
                    style={{ 
                      fontSize: 13, 
                      color: '#0070f3',
                      padding: '6px 12px',
                      background: '#f0f7ff',
                      borderRadius: 4
                    }}
                  >
                    Categories
                  </Link>
                  <Link 
  href={`/admin/events/${event.id}/bracket`}
  style={{ 
    fontSize: 13, 
    color: '#f57c00',
    padding: '6px 12px',
    background: '#fff3e0',
    borderRadius: 4
  }}
>
  Bracket
</Link>
                  <Link 
                    href={`/admin/events/${event.id}/results`}
                    style={{ 
                      fontSize: 13, 
                      color: '#28a745',
                      padding: '6px 12px',
                      background: '#f0fff4',
                      borderRadius: 4
                    }}
                  >
                    Results
                  </Link>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    style={{ 
                      fontSize: 13, 
                      color: '#dc3545', 
                      background: '#fff5f5',
                      border: 'none', 
                      padding: '6px 12px',
                      borderRadius: 4,
                      cursor: 'pointer' 
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Pools Section (Expanded) */}
              {isExpanded && (
                <div style={{ padding: 20, background: '#fafafa' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <h3 style={{ margin: 0, fontSize: 14, color: '#666' }}>
                      POOLS
                    </h3>
                    <Link 
                      href={`/admin/pools/new?eventId=${event.id}`}
                      style={{
                        fontSize: 13,
                        color: '#0070f3',
                        fontWeight: 'bold'
                      }}
                    >
                      + Add Pool
                    </Link>
                  </div>

                  {event.pools?.length === 0 ? (
                    <p style={{ 
                      color: '#999', 
                      fontSize: 14,
                      margin: 0,
                      padding: 16,
                      textAlign: 'center',
                      background: 'white',
                      borderRadius: 8
                    }}>
                      No pools yet for this event
                    </p>
                  ) : (
                    event.pools?.map(pool => (
                      <div 
                        key={pool.id}
                        style={{
                          background: 'white',
                          padding: 16,
                          borderRadius: 8,
                          marginBottom: 8,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>{pool.name}</strong>
                          <div style={{ marginTop: 4 }}>
                            <code style={{ 
                              fontSize: 11, 
                              background: '#f5f5f5', 
                              padding: '2px 6px',
                              borderRadius: 4,
                              color: '#666'
                            }}>
                              /pool/{pool.id}
                            </code>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link 
  href={`/admin/pools/${pool.id}/edit`}
  style={{ 
    fontSize: 13, 
    color: '#6c757d',
    padding: '6px 12px',
    background: '#f5f5f5',
    borderRadius: 4
  }}
>
  Edit
</Link>
                          <button
                            onClick={() => copyPoolLink(pool.id)}
                            style={{ 
                              fontSize: 13, 
                              color: '#0070f3', 
                              background: '#f0f7ff',
                              border: 'none', 
                              padding: '6px 12px',
                              borderRadius: 4,
                              cursor: 'pointer' 
                            }}
                          >
                            📋 Copy Link
                          </button>
                          <Link 
                            href={`/admin/pools/${pool.id}/entries`}
                            style={{ 
                              fontSize: 13, 
                              color: '#6c757d',
                              padding: '6px 12px',
                              background: '#f5f5f5',
                              borderRadius: 4
                            }}
                          >
                            View Entries
                          </Link>
                          <button
                            onClick={() => handleDeletePool(pool.id)}
                            style={{ 
                              fontSize: 13, 
                              color: '#dc3545', 
                              background: '#fff5f5',
                              border: 'none', 
                              padding: '6px 12px',
                              borderRadius: 4,
                              cursor: 'pointer' 
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