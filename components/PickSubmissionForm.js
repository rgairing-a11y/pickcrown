'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PickSubmissionForm({ pool }) {
  const [entryName, setEntryName] = useState('')
  const [email, setEmail] = useState('')
  const [picks, setPicks] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Sort categories by order_index
  const categories = pool.event.categories?.sort((a, b) => 
    a.order_index - b.order_index
  ) || []

  const handlePick = (categoryId, optionId) => {
    setPicks(prev => ({
      ...prev,
      [categoryId]: optionId
    }))
  }

  // Check if form is complete
  const isComplete = 
    entryName.trim() && 
    email.trim() && 
    Object.keys(picks).length === categories.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isComplete) return

    setSubmitting(true)
    setError('')

    try {
      // 1. Create the pool entry
      const { data: entry, error: entryError } = await supabase
        .from('pool_entries')
        .insert({
          pool_id: pool.id,
          entry_name: entryName.trim(),
          email: email.toLowerCase().trim()
        })
        .select()
        .single()

      if (entryError) {
        if (entryError.code === '23505') {
          setError('This email or entry name is already used in this pool')
        } else {
          setError(entryError.message)
        }
        setSubmitting(false)
        return
      }

      // 2. Insert all picks
      const pickInserts = Object.entries(picks).map(([categoryId, optionId]) => ({
        pool_entry_id: entry.id,
        category_id: categoryId,
        option_id: optionId
      }))

      const { error: picksError } = await supabase
        .from('category_picks')
        .insert(pickInserts)

      if (picksError) {
        setError('Error saving picks: ' + picksError.message)
        setSubmitting(false)
        return
      }

      setSubmitted(true)

    } catch (err) {
      setError('Unexpected error: ' + err.message)
      setSubmitting(false)
    }
  }

  // Success screen
  if (submitted) {
    return (
      <div style={{
        padding: 24,
        background: '#d4edda',
        borderRadius: 8,
        border: '1px solid #c3e6cb'
      }}>
        <h3 style={{ marginTop: 0 }}>✅ Picks Submitted!</h3>
        <p>Entry name: <strong>{entryName}</strong></p>
        <p>We'll email results to: {email}</p>
        <a href={`/pool/${pool.id}/standings`}>View Standings →</a>
      </div>
    )
  }

  // Form
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          padding: 16,
          marginBottom: 24,
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: 8,
          color: '#721c24'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          Entry Name *
        </label>
        <input
          type="text"
          value={entryName}
          onChange={(e) => setEntryName(e.target.value)}
          placeholder="e.g., Rich's Picks"
          required
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        />
        <small style={{ color: '#666' }}>
          Cannot be changed after submission
        </small>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        />
      </div>

      <hr style={{ margin: '24px 0' }} />

      <h3>Make Your Picks</h3>

      {categories.map(category => (
        <div key={category.id} style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            {category.name}
          </label>
          <select
            value={picks[category.id] || ''}
            onChange={(e) => handlePick(category.id, e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          >
            <option value="">-- Select --</option>
            {category.options?.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      ))}

      <button
        type="submit"
        disabled={!isComplete || submitting}
        style={{
          width: '100%',
          padding: 16,
          fontSize: 18,
          fontWeight: 'bold',
          background: isComplete ? '#28a745' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: isComplete ? 'pointer' : 'not-allowed'
        }}
      >
        {submitting ? 'Submitting...' : 'Submit All Picks'}
      </button>
    </form>
  )
}