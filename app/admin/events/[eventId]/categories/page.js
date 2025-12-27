'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import Link from 'next/link'

export default function CategoriesPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState({ name: '', type: 'single_select' })
  const [newOptions, setNewOptions] = useState({})

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
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

    setEvent(data)
    setLoading(false)
  }

  async function addCategory() {
    if (!newCategory.name.trim()) return

    const nextOrder = (event?.categories?.length || 0) + 1

    await supabase.from('categories').insert({
      event_id: eventId,
      name: newCategory.name.trim(),
      type: newCategory.type,
      order_index: nextOrder
    })

    setNewCategory({ name: '', type: 'single_select' })
    loadEvent()
  }

  async function deleteCategory(categoryId) {
    if (!confirm('Delete this category and all its options?')) return
    await supabase.from('categories').delete().eq('id', categoryId)
    loadEvent()
  }

  async function addOption(categoryId) {
    const optionName = newOptions[categoryId]?.trim()
    if (!optionName) return

    await supabase.from('category_options').insert({
      category_id: categoryId,
      name: optionName
    })

    setNewOptions(prev => ({ ...prev, [categoryId]: '' }))
    loadEvent()
  }

  async function deleteOption(optionId) {
    if (!confirm('Delete this option?')) return
    await supabase.from('category_options').delete().eq('id', optionId)
    loadEvent()
  }

  if (loading) {
    return <div style={{ padding: 'var(--spacing-xl)' }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 'var(--spacing-xl)' }}>Event not found</div>
  }

  const categories = event.categories?.sort((a, b) => a.order_index - b.order_index) || []

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <Link href="/admin" style={{ color: 'var(--color-primary)' }}>
          ← Back to Admin
        </Link>
      </div>

      <h1>Categories</h1>
      <h2 style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)' }}>{event.name}</h2>

      {/* Add Category Form */}
      <div style={{
        background: 'var(--color-white)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-lg)' }}>Add Category</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Category name (e.g., Best Picture)"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            value={newCategory.type}
            onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
            style={{ width: 180 }}
          >
            <option value="single_select">Single Select</option>
            <option value="yes_no">Yes / No</option>
            <option value="match_prediction">Match Prediction</option>
          </select>
          <button
            onClick={addCategory}
            style={{
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'var(--color-success)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div style={{
          background: 'var(--color-white)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          color: 'var(--color-text-muted)'
        }}>
          No categories yet. Add your first category above.
        </div>
      ) : (
        categories.map((category, idx) => (
          <div
            key={category.id}
            style={{
              background: 'var(--color-white)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              marginBottom: 'var(--spacing-lg)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {idx + 1}. {category.name}
                </h3>
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-background-dark)',
                  padding: '2px var(--spacing-sm)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {category.type}
                </span>
              </div>
              <button
                onClick={() => deleteCategory(category.id)}
                style={{
                  color: 'var(--color-danger)',
                  background: 'var(--color-danger-light)',
                  border: 'none',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                Delete Category
              </button>
            </div>

            {/* Options */}
            <div style={{ marginLeft: 'var(--spacing-lg)' }}>
              {category.options?.map(option => (
                <div
                  key={option.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-sm) 0',
                    borderBottom: '1px solid var(--color-border-light)'
                  }}
                >
                  <span>{option.name}</span>
                  <button
                    onClick={() => deleteOption(option.id)}
                    style={{
                      color: 'var(--color-danger)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add Option */}
              <div style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-md)'
              }}>
                <input
                  type="text"
                  placeholder="Add option..."
                  value={newOptions[category.id] || ''}
                  onChange={(e) => setNewOptions({ ...newOptions, [category.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addOption(category.id)}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => addOption(category.id)}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Create Pool Button */}
      {categories.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <Link
            href={`/admin/pools/new?eventId=${eventId}`}
            style={{
              display: 'inline-block',
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'bold'
            }}
          >
            Create Pool for This Event →
          </Link>
        </div>
      )}
    </div>
  )
}