'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'

export default function AdminResultsPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => {
      setEventId(p.eventId)
    })
  }, [params])

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  async function loadEvent() {
    setLoading(true)
    const { data, error } = await supabase
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

    if (data) {
      setEvent(data)
    }
    setLoading(false)
  }

  async function handleSetCorrect(optionId, categoryId) {
    setSaving(true)

    // First, unmark all options in this category
    await supabase
      .from('category_options')
      .update({ is_correct: false })
      .eq('category_id', categoryId)

    // Then mark the selected one as correct
    await supabase
      .from('category_options')
      .update({ is_correct: true })
      .eq('id', optionId)

    await loadEvent()
    setSaving(false)
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 24 }}>Event not found</div>
  }

  const categories = event.categories?.sort((a, b) => 
    a.order_index - b.order_index
  ) || []

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1>Admin: Enter Results</h1>
      <h2>{event.name}</h2>

      {saving && (
        <div style={{ 
          background: '#cce5ff', 
          padding: 8, 
          borderRadius: 4, 
          marginBottom: 16 
        }}>
          Saving...
        </div>
      )}

      {categories.map(category => (
        <div key={category.id} style={{ 
          marginBottom: 32,
          padding: 16,
          border: '1px solid #ddd',
          borderRadius: 8
        }}>
          <h3 style={{ marginTop: 0 }}>{category.name}</h3>
          
          {category.options?.map(option => (
            <div key={option.id} style={{ marginBottom: 8 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer' 
              }}>
                <input
                  type="radio"
                  name={`category_${category.id}`}
                  checked={option.is_correct || false}
                  onChange={() => handleSetCorrect(option.id, category.id)}
                  disabled={saving}
                  style={{ marginRight: 8 }}
                />
                <span style={{ 
                  fontWeight: option.is_correct ? 'bold' : 'normal',
                  color: option.is_correct ? '#28a745' : 'inherit'
                }}>
                  {option.name}
                  {option.is_correct && ' ✓'}
                </span>
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}