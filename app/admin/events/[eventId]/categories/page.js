'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/clients'

const supabase = getBrowserClient()
import { Card, PageHeader, Button, EmptyState, LoadingState, FormField } from '../../../../../components/ui'
import { CATEGORY_TYPES, CATEGORY_TYPE_LABELS } from '../../../../../lib/constants'
import { sortByOrderIndex } from '../../../../../lib/utils'

export default function CategoriesPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState({ name: '', type: CATEGORY_TYPES.SINGLE_SELECT })
  const [newOptions, setNewOptions] = useState({})

  useEffect(() => {
    params.then(p => setEventId(p.eventId))
  }, [params])

  useEffect(() => {
    if (eventId) loadEvent()
  }, [eventId])

  async function loadEvent() {
    // SELECT still works with anon key
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

    // Use API route for INSERT
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        name: newCategory.name.trim(),
        type: newCategory.type,
        order_index: nextOrder
      })
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Error: ' + err.error)
      return
    }

    setNewCategory({ name: '', type: CATEGORY_TYPES.SINGLE_SELECT })
    loadEvent()
  }

  async function deleteCategory(categoryId) {
    if (!confirm('Delete this category and all its options?')) return
    
    // Use API route for DELETE
    const res = await fetch('/api/categories?id=' + categoryId, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Error: ' + err.error)
      return
    }

    loadEvent()
  }

  async function addOption(categoryId) {
    const optionName = newOptions[categoryId]?.trim()
    if (!optionName) return

    // Use API route for INSERT
    const res = await fetch('/api/category-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: categoryId,
        name: optionName
      })
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Error: ' + err.error)
      return
    }

    setNewOptions(prev => ({ ...prev, [categoryId]: '' }))
    loadEvent()
  }

  async function deleteOption(optionId) {
    if (!confirm('Delete this option?')) return
    
    // Use API route for DELETE
    const res = await fetch('/api/category-options?id=' + optionId, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const err = await res.json()
      alert('Error: ' + err.error)
      return
    }

    loadEvent()
  }

  if (loading) {
    return <LoadingState message="Loading categories..." />
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
        title="Categories" 
        subtitle={event.name}
      />

      {/* Import Link */}
      <div style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'right' }}>
        <Button 
          href={`/admin/events/${eventId}/import`}
          variant="secondary"
          style={{ fontSize: '14px' }}
        >
          📥 Import from CSV
        </Button>
      </div>

      {/* Add Category Form */}
      <Card style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-lg)' }}>Add Category</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="Category name (e.g., Best Picture)"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
          </div>
          <div style={{ width: 180 }}>
            <select
              value={newCategory.type}
              onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
            >
              {Object.entries(CATEGORY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <Button onClick={addCategory} variant="success">
            Add
          </Button>
        </div>
      </Card>

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon="📋"
            title="No categories yet"
            description="Add your first category above"
          />
        </Card>
      ) : (
        categories.map((category, idx) => (
          <Card
            key={category.id}
            style={{ marginBottom: 'var(--spacing-lg)' }}
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
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-block',
                  marginTop: 'var(--spacing-xs)'
                }}>
                  {CATEGORY_TYPE_LABELS[category.type] || category.type}
                </span>
              </div>
              <Button
                onClick={() => deleteCategory(category.id)}
                variant="danger-light"
                size="sm"
              >
                Delete Category
              </Button>
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
                      fontSize: 'var(--font-size-lg)',
                      padding: 'var(--spacing-xs)'
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
                <Button onClick={() => addOption(category.id)} variant="primary" size="sm">
                  Add
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}

      {/* Create Pool Button */}
      {categories.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <Button href={'/admin/pools/new?eventId=' + eventId} variant="primary">
            Create Pool for This Event
          </Button>
        </div>
      )}
    </div>
  )
}