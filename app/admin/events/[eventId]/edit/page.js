'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditEventPage({ params }) {
  const router = useRouter()
  const [eventId, setEventId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [eventType, setEventType] = useState('pick_one')
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
      setEventType(data.event_type || 'pick_one')
      const dt = new Date(data.start_time)
      setStartTime(dt.toISOString().slice(0, 16))
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
    return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Link href="/admin" style={{ color: 'var(--color-primary)' }}>
          ← Back to Admin
        </Link>
      </div>

      <h1>Edit Event</h1>

      <form onSubmit={handleSubmit} style={{
        background: 'var(--color-white)',
        padding: 'var(--spacing-xl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        marginTop: 'var(--spacing-xl)'
      }}>
        {error && (
          <div style={{
            background: 'var(--color-danger-light)',
            color: 'var(--color-danger-dark)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            Event Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            Year *
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            Event Type *
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          >
            <option value="pick_one">Pick One (Oscars style)</option>
            <option value="bracket">Bracket (NFL Playoffs style)</option>
            <option value="hybrid">Hybrid (WrestleMania style)</option>
          </select>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            Start Time (picks lock at this time) *
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'bold',
              background: saving ? 'var(--color-border)' : 'var(--color-success)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/admin"
            style={{
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              textAlign: 'center'
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}