'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PickSubmissionForm({ pool }) {
  const [entryName, setEntryName] = useState('')
  const [email, setEmail] = useState('')
  const [tieBreaker, setTieBreaker] = useState('')
  const [picks, setPicks] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const requiresTiebreaker = pool.config?.requires_tiebreaker || false
  const categories = pool.event.categories.sort((a, b) =>
    a.order_index - b.order_index
  )

  const handlePick = (categoryId, optionId) => {
    setPicks(prev => ({
      ...prev,
      [categoryId]: optionId
    }))
  }

  const isComplete =
    entryName.trim() &&
    email.trim() &&
    (!requiresTiebreaker || tieBreaker) &&
    Object.keys(picks).length === categories.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isComplete) return

    setSubmitting(true)
    setError('')

    try {
      const { data: entry, error: entryError } = await supabase
        .from('pool_entries')
        .insert({
          pool_id: pool.id,
          entry_name: entryName.trim(),
          email: email.toLowerCase().trim(),
          tie_breaker_value: requiresTiebreaker ? parseInt(tieBreaker) : null
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

  if (submitted) {
    return (
      <div style={{
        padding: 'var(--spacing-xl)',
        background: 'var(--color-success-light)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-success)'
      }}>
        <h3 style={{ marginTop: 0 }}>✅ Picks Submitted!</h3>
        <p>Entry name: <strong>{entryName}</strong></p>
        <p>We'll email results to: {email}</p>
        <a href={`/pool/${pool.id}/standings`}>View Standings →</a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
          background: 'var(--color-danger-light)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-danger-dark)'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
          Entry Name *
        </label>
        <input
          type="text"
          value={entryName}
          onChange={(e) => setEntryName(e.target.value)}
          placeholder="e.g., Rich's Picks"
          required
        />
        <small style={{ color: 'var(--color-text-light)' }}>
          Cannot be changed after submission
        </small>
      </div>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
      </div>

      {requiresTiebreaker && (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            {pool.config.tiebreaker_label || 'Tie-breaker'} *
          </label>
          <input
            type="number"
            value={tieBreaker}
            onChange={(e) => setTieBreaker(e.target.value)}
            required
          />
        </div>
      )}

      <hr style={{ margin: 'var(--spacing-xl) 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

      <h3>Make Your Picks</h3>

      {categories.map(category => (
        <div key={category.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            {category.name}
          </label>
          <select
            value={picks[category.id] || ''}
            onChange={(e) => handlePick(category.id, e.target.value)}
            required
          >
            <option value="">-- Select --</option>
            {category.options.map(option => (
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
          padding: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'bold',
          background: isComplete ? 'var(--color-success)' : 'var(--color-border)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          cursor: isComplete ? 'pointer' : 'not-allowed'
        }}
      >
        {submitting ? 'Submitting...' : 'Submit All Picks'}
      </button>
    </form>
  )
}