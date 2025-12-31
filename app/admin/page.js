'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { Card, PageHeader, Button, EmptyState, LoadingState } from '../../components/ui'
import { isEventLocked, getPoolUrl, copyToClipboard } from '../../lib/utils'

export default function AdminHome() {
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
        pools (*),
        categories (id),
        teams (id),
        rounds (id),
        matchups (id)
      `)
      .order('start_time', { ascending: false })

    setEvents(eventsData || [])
    
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

  function handleCopyPoolLink(poolId) {
    copyToClipboard(getPoolUrl(poolId), () => alert('Link copied to clipboard!'))
  }

  // Get stats based on event type
  function getEventStats(event) {
    if (event.event_type === 'bracket') {
      return {
        primary: `${event.teams?.length || 0} teams`,
        secondary: `${event.matchups?.length || 0} matchups`
      }
    } else {
      return {
        primary: `${event.categories?.length || 0} categories`,
        secondary: null
      }
    }
  }

  // Get event type badge
  function getTypeBadge(eventType) {
    switch (eventType) {
      case 'bracket':
        return { label: '🏆 Bracket', color: '#f59e0b', bg: '#fef3c7' }
      case 'pick_one':
        return { label: '📋 Pick One', color: '#3b82f6', bg: '#dbeafe' }
      case 'hybrid':
        return { label: '🔀 Hybrid', color: '#8b5cf6', bg: '#ede9fe' }
      default:
        return { label: eventType, color: '#666', bg: '#f3f4f6' }
    }
  }

  if (loading) {
    return <LoadingState message="Loading events..." />
  }

  return (
    <div>
      <PageHeader
        title="👑 Admin Dashboard"
        backLink={null}
        actions={
          <div style={{ display: 'flex', gap: 12 }}>
            <Button href="/admin/seasons" variant="secondary">
              🏆 Seasons
            </Button>
            <Button href="/admin/audit-log" variant="secondary">
              📋 Audit Log
            </Button>
            <Button href="/admin/events/new" variant="success">
              + New Event
            </Button>
          </div>
        }
      />

      {events.length === 0 ? (
        <Card>
          <EmptyState
            icon="📅"
            title="No events yet"
            description="Create your first event to get started"
            actionLabel="Create Event"
            actionHref="/admin/events/new"
          />
        </Card>
      ) : (
        events.map(event => {
          const isExpanded = expandedEvents[event.id]
          const locked = isEventLocked(event.start_time)
          const poolCount = event.pools?.length || 0
          const stats = getEventStats(event)
          const typeBadge = getTypeBadge(event.event_type)
          const isBracket = event.event_type === 'bracket'

          return (
            <Card key={event.id} style={{ marginBottom: 'var(--spacing-lg)', padding: 0 }}>
              {/* Event Header */}
              <div 
                onClick={() => toggleExpand(event.id)}
                style={{
                  padding: 'var(--spacing-lg)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: isExpanded ? '1px solid var(--color-border-light)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <span style={{ 
                    fontSize: 'var(--font-size-xl)',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}>
                    ▶
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                      <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>
                        {event.name}
                        <span style={{ 
                          marginLeft: 'var(--spacing-sm)', 
                          fontSize: 'var(--font-size-md)', 
                          color: 'var(--color-text-light)',
                          fontWeight: 'normal'
                        }}>
                          {event.year}
                        </span>
                      </h2>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: typeBadge.bg,
                        color: typeBadge.color,
                        fontWeight: 600
                      }}>
                        {typeBadge.label}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--color-text-light)',
                      display: 'flex',
                      gap: 'var(--spacing-lg)'
                    }}>
                      <span>{stats.primary}</span>
                      {stats.secondary && <span>{stats.secondary}</span>}
                      <span>{poolCount} pool{poolCount !== 1 ? 's' : ''}</span>
                      {locked ? (
                        <span style={{ color: 'var(--color-danger)' }}>🔒 Locked</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)' }}>🟢 Open</span>
                      )}
                    </div>
                  </div>
                </div>

                <div 
                  style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button href={`/admin/events/${event.id}/edit`} variant="secondary" size="sm">
                    Edit
                  </Button>
                  
                  {/* Show different setup buttons based on event type */}
                  {isBracket ? (
                    <>
                      <Button href={`/admin/events/${event.id}/teams`} variant="warning-light" size="sm">
                        Teams
                      </Button>
                      <Button href={`/admin/events/${event.id}/rounds`} variant="warning-light" size="sm">
                        Rounds
                      </Button>
                      <Button href={`/admin/events/${event.id}/matchups`} variant="warning-light" size="sm">
                        Matchups
                      </Button>
                    </>
                  ) : (
                    <Button href={`/admin/events/${event.id}/categories`} variant="primary-light" size="sm">
                      Categories
                    </Button>
                  )}
                  
                  <Button href={`/admin/events/${event.id}/results`} variant="success-light" size="sm">
                    Results
                  </Button>
                  <Button onClick={() => handleDeleteEvent(event.id)} variant="danger-light" size="sm">
                    Delete
                  </Button>
                </div>
              </div>

              {/* Pools Section (Expanded) */}
              {isExpanded && (
                <div style={{ padding: 'var(--spacing-lg)', background: 'var(--color-background)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-text-light)' }}>
                      POOLS
                    </h3>
                    <Button href={`/admin/pools/new?eventId=${event.id}`} variant="ghost" size="sm">
                      + Add Pool
                    </Button>
                  </div>

                  {event.pools?.length === 0 ? (
                    <div style={{
                      padding: 'var(--spacing-lg)',
                      textAlign: 'center',
                      background: 'var(--color-white)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--color-text-muted)'
                    }}>
                      No pools yet for this event
                    </div>
                  ) : (
                    event.pools?.map(pool => (
                      <div 
                        key={pool.id}
                        style={{
                          background: 'var(--color-white)',
                          padding: 'var(--spacing-lg)',
                          borderRadius: 'var(--radius-lg)',
                          marginBottom: 'var(--spacing-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 'var(--spacing-md)'
                        }}
                      >
                        <div>
                          <strong>{pool.name}</strong>
                          <div style={{ marginTop: 'var(--spacing-xs)' }}>
                            <code style={{ 
                              fontSize: 'var(--font-size-xs)', 
                              background: 'var(--color-background-dark)', 
                              padding: '2px var(--spacing-sm)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--color-text-light)'
                            }}>
                              /pool/{pool.id}
                            </code>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                          <Button href={`/pool/${pool.id}/manage`} variant="secondary" size="sm">
                            Manage
                          </Button>
                          <Button onClick={() => handleCopyPoolLink(pool.id)} variant="primary-light" size="sm">
                            📋 Copy Link
                          </Button>
                          <Button href={`/pool/${pool.id}/standings`} variant="secondary" size="sm">
                            Standings
                          </Button>
                          <Button onClick={() => handleDeletePool(pool.id)} variant="danger-light" size="sm">
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}