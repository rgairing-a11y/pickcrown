'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import { Card, PageHeader, Button, EmptyState, LoadingState, Alert } from '../../../../../components/ui'
import { sortByOrderIndex } from '../../../../../lib/utils'

export default function AdminResultsPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        categories (
          *,
          options:category_options (*)
        )
      `)
      .eq('id', eventId)
      .single()

    if (data) setEvent(data)
    setLoading(false)
  }

  async function handleSetCorrect(optionId, categoryId) {
    setSaving(true)

    await supabase
      .from('category_options')
      .update({ is_correct: false })
      .eq('category_id', categoryId)

    await supabase
      .from('category_options')
      .update({ is_correct: true })
      .eq('id', optionId)

    await loadEvent()
    setSaving(false)
  }

  async function handleMarkComplete() {
    const confirmed = window.confirm('Mark this event as completed? This will finalize all standings.')
    if (!confirmed) return
    
    setSaving(true)
    await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId)
    
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
            icon="❌"
            title="Event not found"
            actionLabel="Back to Admin"
            actionHref="/admin"
          />
        </Card>
      </div>
    )
  }

  const categories = sortByOrderIndex(event.categories || [])

  return (
    <div style={{ maxWidth: 700 }}>
      <PageHeader 
        title="Enter Results" 
        subtitle={event.name}
      />

      {saving && (
        <Alert variant="info" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Saving...
        </Alert>
      )}

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon="📋"
            title="No categories yet"
            description="Add categories before entering results"
            actionLabel="Add Categories"
            actionHref={'/admin/events/' + eventId + '/categories'}
          />
        </Card>
      ) : (
        categories.map(category => (
          <Card key={category.id} style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-lg)' }}>
              {category.name}
            </h3>
            
            {category.options?.map(option => (
              <div key={option.id} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  background: option.is_correct ? 'var(--color-success-light)' : 'transparent',
                  transition: 'background 0.2s'
                }}>
                  <input
                    type="radio"
                    name={'category_' + category.id}
                    checked={option.is_correct || false}
                    onChange={() => handleSetCorrect(option.id, category.id)}
                    disabled={saving}
                    style={{ marginRight: 'var(--spacing-md)' }}
                  />
                  <span style={{ 
                    fontWeight: option.is_correct ? 'bold' : 'normal',
                    color: option.is_correct ? 'var(--color-success-dark)' : 'inherit'
                  }}>
                    {option.name}
                    {option.is_correct && ' ✓'}
                  </span>
                </label>
              </div>
            ))}
          </Card>
        ))
      )}

      {/* Mark Complete Section */}
      <Card style={{ 
        marginTop: 'var(--spacing-xl)', 
        textAlign: 'center',
        background: event.status === 'completed' ? 'var(--color-success-light)' : 'var(--color-white)'
      }}>
        {event.status === 'completed' ? (
          <div style={{ 
            padding: 'var(--spacing-md)',
            color: 'var(--color-success-dark)',
            fontWeight: 'bold'
          }}>
            ✓ Event Completed
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
              Once all results are entered, mark the event as complete to finalize standings.
            </p>
            <Button
              onClick={handleMarkComplete}
              disabled={saving}
              variant="primary"
            >
              Mark Event Complete
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}