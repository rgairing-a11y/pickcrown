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

    if (data) {
      setEvent(data)
    }
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
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 24 }}>Event not found</div>
  }

  const categories = event.categories?.sort((a, b) => 
    a.order_index - b.order_index
  ) || []

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ color: '#0070f3' }}>
          ← Back to Admin
        </Link>
      </div>

      <h1>Enter Results</h1>
      <h2 style={{ color: '#666', marginBottom: 24 }}>{event.name}</h2>

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
          marginBottom: 24,
          padding: 20,
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>{category.name}</h3>
          
          {category.options?.map(option => (
            <div key={option.id} style={{ marginBottom: 8 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: 8,
                borderRadius: 6,
                background: option.is_correct ? '#d4edda' : 'transparent'
              }}>
                <input
                  type="radio"
                  name={`category_${category.id}`}
                  checked={option.is_correct || false}
                  onChange={() => handleSetCorrect(option.id, category.id)}
                  disabled={saving}
                  style={{ marginRight: 12 }}
                />
                <span style={{ 
                  fontWeight: option.is_correct ? 'bold' : 'normal',
                  color: option.is_correct ? '#155724' : 'inherit'
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