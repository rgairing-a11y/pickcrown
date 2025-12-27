'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, PageHeader, Button, Alert, FormField, LoadingState } from '../../../../../components/ui'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '../../../../../lib/constants'
import { toDateTimeLocal } from '../../../../../lib/utils'

export default function EditEventPage({ params }) {
  const router = useRouter()
  const [eventId, setEventId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [eventType, setEventType] = useState(EVENT_TYPES.PICK_ONE)
  const [startTime, setStartTime] = useState('')

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (data) {
      setName(data.name)
      setYear(data.year)
      setEventType(data.event_type || EVENT_TYPES.PICK_ONE)
      setStartTime(toDateTimeLocal(data.start_time))
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('events')
      .update({
        name,
        year: parseInt(year),
        event_type: eventType,
        start_time: new Date(startTime).toISOString()
      })
      .eq('id', eventId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/admin')
  }

  if (loading) {
    return <LoadingState message="Loading event..." />
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <PageHeader title="Edit Event" />

      <Card>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="danger" style={{ marginBottom: 'var(--spacing-lg)' }}>
              {error}
            </Alert>
          )}

          <FormField label="Event Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Year" required>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Event Type" required>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Start Time" required hint="Picks will lock at this time">
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </FormField>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <Button 
              type="submit" 
              variant="success" 
              loading={saving}
              style={{ flex: 1 }}
            >
              Save Changes
            </Button>
            <Button href="/admin" variant="ghost">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}