'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import Link from 'next/link'

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

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 'var(--spacing-xl)' }}>Event not found</div>
  }

  const categories = event.categories?.sort((a, b) => 
    a.order_index - b.order_index
  ) || []

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Link href="/admin" style={{ color: 'var(--color-primary)' }}>
          ← Back to Admin
        </Link>
      </div>

      <h1>Enter Results</h1>
      <h2 style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)' }}>{event.name}</h2>

      {saving && (
        <div style={{ 
          background: 'var(--color-primary-light)', 
          padding: 'var(--spacing-sm)', 
          borderRadius: 'var(--radius-sm)', 
          marginBottom: 'var(--spacing-lg)' 
        }}>
          Saving...
        </div>
      )}

      {categories.length === 0 ? (
        <div style={{
          background: 'var(--color-white)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--color-text-light)' }}>No categories yet.</p>
          <Link 
            href={`/admin/events/${eventId}/categories`}
            style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
          >
            Add Categories →
          </Link>
        </div>
      ) : (
        categories.map(category => (
          <div key={category.id} style={{ 
            marginBottom: 'var(--spacing-xl)',
            padding: 'var(--spacing-lg)',
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-lg)' }}>{category.name}</h3>
            
            {category.options?.map(option => (
              <div key={option.id} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  background: option.is_correct ? 'var(--color-success-light)' : 'transparent'
                }}>
                  <input
                    type="radio"
                    name={`category_${category.id}`}
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
          </div>
        ))
      )}
    </div>
  )
}