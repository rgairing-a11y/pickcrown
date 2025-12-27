'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
    return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Link href="/admin" style={{ color: 'var(--color-primary)' }}>
          ← Back to Admin
        </Link>
      </div>

      <h1>Create New Pool</h1>

      {events.length === 0 ? (
        <div style={{
          background: 'var(--color-warning-light)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          marginTop: 'var(--spacing-xl)'
        }}>
          <p style={{ margin: 0 }}>No events exist yet.</p>
          <Link 
            href="/admin/events/new"
            style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
          >
            Create an event first →
          </Link>
        </div>
      ) : (
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
              Event *
            </label>
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
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
              Pool Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Smith Family Oscars Pool"
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={requiresTiebreaker}
                onChange={(e) => setRequiresTiebreaker(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span>Require tie-breaker question</span>
            </label>
          </div>

          {requiresTiebreaker && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
                Tie-breaker Label
              </label>
              <input
                type="text"
                value={tiebreakerLabel}
                onChange={(e) => setTiebreakerLabel(e.target.value)}
                placeholder="e.g., Total combined score"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
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
            {saving ? 'Creating...' : 'Create Pool'}
          </button>
        </form>
      )}
    </div>
  )
}