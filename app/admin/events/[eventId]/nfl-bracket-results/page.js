'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../../lib/supabase'
import { Card, PageHeader, Button, LoadingState, EmptyState, Alert } from '../../../../../components/ui'
import NFLBracketResultsAdmin from '../../../../../components/NFLBracketResultsAdmin'
import SendResultsSection from '../../../../../components/SendResultsSection'

export default function NFLBracketResultsPage() {
  const params = useParams()
  const eventId = params?.eventId

  const [event, setEvent] = useState(null)
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  async function loadEvent() {
    setLoading(true)

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    setEvent(eventData)

    const { data: poolsData } = await supabase
      .from('pools')
      .select('id, name')
      .eq('event_id', eventId)

    setPools(poolsData || [])
    setLoading(false)
  }

  async function handleMarkComplete() {
    const confirmed = window.confirm('Mark this event as completed? This will finalize all standings.')
    if (!confirmed) return

    setSaving(true)

    const res = await fetch(`/api/admin/events/${eventId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': typeof window !== 'undefined'
          ? localStorage.getItem('pickcrown_email') || 'admin'
          : 'admin'
      }
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Error: ' + err.error)
    } else {
      alert('Event marked as complete!')
    }

    await loadEvent()
    setSaving(false)
  }

  if (loading) {
    return <LoadingState message="Loading event..." />
  }

  if (!event) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <PageHeader title="Event Not Found" />
        <Card>
          <EmptyState
            icon="?"
            title="Event not found"
            actionLabel="Back to Admin"
            actionHref="/admin"
          />
        </Card>
      </div>
    )
  }

  // Verify this is an nfl_bracket event
  if (event.event_type !== 'nfl_bracket') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <PageHeader title="Wrong Event Type" />
        <Card>
          <Alert variant="warning">
            This page is only for NFL Bracket events.
            This event is type: <strong>{event.event_type}</strong>
          </Alert>
          <div style={{ marginTop: 16 }}>
            <Button href={`/admin/events/${eventId}/results`}>
              Go to Standard Results Page
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <PageHeader
        title="NFL Bracket Results"
        subtitle={`${event.name} ${event.year || ''}`}
      />

      {/* Instructions */}
      <Card style={{ marginBottom: 24, background: '#eff6ff' }}>
        <h4 style={{ margin: '0 0 8px', color: '#1e40af' }}>How to Enter Results</h4>
        <ol style={{ margin: 0, paddingLeft: 20, color: '#1e3a8a' }}>
          <li>Click on the winning team for each matchup to set the winner</li>
          <li>After all Wild Card games are complete, click "Generate Divisional Matchups"</li>
          <li>This will apply NFL reseeding rules (highest seed vs lowest remaining)</li>
          <li>Continue entering results and generating matchups through Super Bowl</li>
        </ol>
      </Card>

      {/* NFL Bracket Results Component */}
      <NFLBracketResultsAdmin eventId={eventId} event={event} />

      {/* Mark Complete Section */}
      <Card style={{
        marginTop: 24,
        textAlign: 'center',
        background: event.status === 'completed' ? '#dcfce7' : '#fff'
      }}>
        {event.status === 'completed' ? (
          <div style={{ padding: 16, color: '#166534', fontWeight: 'bold' }}>
            Event Completed
          </div>
        ) : (
          <div>
            <p style={{ color: '#666', marginBottom: 16 }}>
              Once the Super Bowl is complete, mark the event as complete to finalize standings.
            </p>
            <Button onClick={handleMarkComplete} disabled={saving} variant="primary">
              Mark Event Complete
            </Button>
          </div>
        )}
      </Card>

      {/* Send Results */}
      <SendResultsSection
        eventId={eventId}
        eventName={event?.name}
        isCompleted={event?.status === 'completed'}
        pools={pools}
      />
    </div>
  )
}
