'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../../lib/supabase'
import Link from 'next/link'

export default function CategoriesPage({ params }) {
  const [eventId, setEventId] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // New category form
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryType, setNewCategoryType] = useState('single_select')
  const [addingCategory, setAddingCategory] = useState(false)
  
  // New option form
  const [newOptions, setNewOptions] = useState({}) // categoryId -> option name
  const [addingOption, setAddingOption] = useState(null)

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

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    
    setAddingCategory(true)
    
    // Get next order_index
    const maxOrder = event.categories?.reduce((max, c) => 
      Math.max(max, c.order_index), 0) || 0

    await supabase
      .from('categories')
      .insert({
        event_id: eventId,
        name: newCategoryName.trim(),
        type: newCategoryType,
        order_index: maxOrder + 1
      })

    setNewCategoryName('')
    setAddingCategory(false)
    loadEvent()
  }

  async function handleAddOption(categoryId) {
    const optionName = newOptions[categoryId]
    if (!optionName?.trim()) return
    
    setAddingOption(categoryId)

    await supabase
      .from('category_options')
      .insert({
        category_id: categoryId,
        name: optionName.trim()
      })

    setNewOptions(prev => ({ ...prev, [categoryId]: '' }))
    setAddingOption(null)
    loadEvent()
  }

  async function handleDeleteCategory(categoryId) {
    if (!confirm('Delete this category and all its options?')) return
    
    await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    loadEvent()
  }

  async function handleDeleteOption(optionId) {
    await supabase
      .from('category_options')
      .delete()
      .eq('id', optionId)

    loadEvent()
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  if (!event) {
    return <div style={{ padding: 24 }}>Event not found</div>
  }

  const categories = event.categories?.sort((a, b) => 
    a.order_index - b.order_index) || []

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{event.name}</h1>
          <p style={{ color: '#666', margin: 0 }}>Manage categories & options</p>
        </div>
        <Link 
          href="/admin"
          style={{ color: '#0070f3' }}
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Add Category Form */}
      <form 
        onSubmit={handleAddCategory}
        style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: 24,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-end'
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: 14 }}>
            New Category
          </label>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="e.g., Best Picture, Who wins Main Event?"
            style={{
              width: '100%',
              padding: 10,
              fontSize: 14,
              border: '1px solid #ccc',
              borderRadius: 6,
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: 14 }}>
            Type
          </label>
          <select
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value)}
            style={{
              padding: 10,
              fontSize: 14,
              border: '1px solid #ccc',
              borderRadius: 6
            }}
          >
            <option value="single_select">Single Select</option>
            <option value="yes_no">Yes / No</option>
            <option value="match_prediction">Match Prediction</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={addingCategory || !newCategoryName.trim()}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 'bold',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          + Add
        </button>
      </form>

      {/* Categories List */}
      {categories.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: 48 }}>
          No categories yet. Add your first one above!
        </p>
      ) : (
        categories.map((category, idx) => (
          <div 
            key={category.id}
            style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: 16
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12
            }}>
              <h3 style={{ margin: 0 }}>
                {idx + 1}. {category.name}
                <span style={{ 
                  marginLeft: 8, 
                  fontSize: 12, 
                  color: '#666',
                  fontWeight: 'normal'
                }}>
                  ({category.type})
                </span>
              </h3>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Delete
              </button>
            </div>

            {/* Options */}
            <div style={{ marginLeft: 16 }}>
              {category.options?.map(option => (
                <div 
                  key={option.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <span>• {option.name}</span>
                  <button
                    onClick={() => handleDeleteOption(option.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add Option */}
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                marginTop: 12 
              }}>
                <input
                  type="text"
                  value={newOptions[category.id] || ''}
                  onChange={(e) => setNewOptions(prev => ({
                    ...prev,
                    [category.id]: e.target.value
                  }))}
                  placeholder="Add option..."
                  style={{
                    flex: 1,
                    padding: 8,
                    fontSize: 14,
                    border: '1px solid #ddd',
                    borderRadius: 4
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption(category.id)
                    }
                  }}
                />
                <button
                  onClick={() => handleAddOption(category.id)}
                  disabled={addingOption === category.id}
                  style={{
                    padding: '8px 12px',
                    fontSize: 14,
                    background: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
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

      {/* Done Button */}
      {categories.length > 0 && (
        <div style={{ 
          marginTop: 24, 
          display: 'flex', 
          gap: 12,
          justifyContent: 'center' 
        }}>
          <Link
            href={`/admin/pools/new?eventId=${eventId}`}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              background: '#28a745',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none'
            }}
          >
            Create Pool for This Event →
          </Link>
        </div>
      )}
    </div>
  )
}