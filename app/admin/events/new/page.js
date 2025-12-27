'use client'

import { useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, PageHeader, Button, Alert, FormField } from '../../../../components/ui'
import { EVENT_TYPES, EVENT_TYPE_LABELS } from '../../../../lib/constants'

export default function NewEventPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [eventType, setEventType] = useState(EVENT_TYPES.PICK_ONE)
  const [startTime, setStartTime] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('events')
      .insert({
        name,
        year: parseInt(year),
        event_type: eventType,
        start_time: new Date(startTime).toISOString(),
        status: 'upcoming'
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push(`/admin/events/${data.id}/categories`)
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <PageHeader title="Create New Event" />

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
              placeholder="e.g., Academy Awards, NFL Playoffs, WrestleMania"
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

          <FormField 
            label="Start Time" 
            required
            hint="Picks will lock at this time"
          >
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </FormField>

          <Button 
            type="submit" 
            variant="success" 
            loading={saving}
            style={{ width: '100%' }}
          >
            Create Event
          </Button>
        </form>
      </Card>
    </div>
  )
}