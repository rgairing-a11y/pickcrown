'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, PageHeader, Button, Alert, FormField, LoadingState, EmptyState } from '../../../../components/ui'

export default function NewPoolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedEventId = searchParams.get('eventId')

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [eventId, setEventId] = useState(preselectedEventId || '')
  const [requiresTiebreaker, setRequiresTiebreaker] = useState(false)
  const [tiebreakerLabel, setTiebreakerLabel] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: false })

    setEvents(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const config = {}
    if (requiresTiebreaker) {
      config.requires_tiebreaker = true
      config.tiebreaker_label = tiebreakerLabel || 'Tie-breaker'
    }

    const { data, error: insertError } = await supabase
      .from('pools')
      .insert({
        event_id: eventId,
        name,
        config
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push('/admin')
  }

  if (loading) {
    return <LoadingState message="Loading events..." />
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <PageHeader title="Create New Pool" />

      {events.length === 0 ? (
        <Card>
          <EmptyState
            icon="📅"
            title="No events exist yet"
            description="You need to create an event before creating a pool"
            actionLabel="Create Event"
            actionHref="/admin/events/new"
          />
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="danger" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {error}
              </Alert>
            )}

            <FormField label="Event" required>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                required
              >
                <option value="">-- Select Event --</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.year})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Pool Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Smith Family Oscars Pool"
                required
              />
            </FormField>

            <FormField>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-sm)', 
                cursor: 'pointer' 
              }}>
                <input
                  type="checkbox"
                  checked={requiresTiebreaker}
                  onChange={(e) => setRequiresTiebreaker(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>Require tie-breaker question</span>
              </label>
            </FormField>

            {requiresTiebreaker && (
              <FormField label="Tie-breaker Label">
                <input
                  type="text"
                  value={tiebreakerLabel}
                  onChange={(e) => setTiebreakerLabel(e.target.value)}
                  placeholder="e.g., Total combined score"
                />
              </FormField>
            )}

            <Button
              type="submit"
              variant="success"
              loading={saving}
              style={{ width: '100%' }}
            >
              Create Pool
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}