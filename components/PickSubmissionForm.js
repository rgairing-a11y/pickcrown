'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function PickSubmissionForm({ pool }) {
  const [entryName, setEntryName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [tieBreaker, setTieBreaker] = useState('')
  const [picks, setPicks] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  
  // Edit mode state
  const [existingEntry, setExistingEntry] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [loadingEntry, setLoadingEntry] = useState(true)

  const requiresTiebreaker = pool.config?.requires_tiebreaker || false
  const tiebreakerLabel = pool.config?.tiebreaker_label || 'Tie Breaker'

  const categories = (pool.event?.categories || []).sort(
    (a, b) => a.order_index - b.order_index
  )

  // Check for existing entry on mount
  useEffect(() => {
    async function checkExistingEntry() {
      const savedEmail = localStorage.getItem('pickcrown_email')
      if (savedEmail) {
        setEmail(savedEmail)
        
        // Check if this email has an entry in this pool
        const { data: entry } = await supabase
          .from('pool_entries')
          .select('*')
          .eq('pool_id', pool.id)
          .ilike('email', savedEmail)
          .single()

        if (entry) {
          setExistingEntry(entry)
          setEntryName(entry.entry_name)
          setDisplayName(entry.display_name || '')
          setTieBreaker(entry.tie_breaker_value?.toString() || '')
          setIsEditMode(true)

          // Load existing picks
          const { data: existingPicks } = await supabase
            .from('category_picks')
            .select('category_id, option_id')
            .eq('pool_entry_id', entry.id)

          if (existingPicks) {
            const picksMap = {}
            existingPicks.forEach(p => {
              picksMap[p.category_id] = p.option_id
            })
            setPicks(picksMap)
          }
        }
      }
      setLoadingEntry(false)
    }

    checkExistingEntry()
  }, [pool.id])

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
      let entryId

      if (isEditMode && existingEntry) {
        // UPDATE existing entry
        const { error: updateError } = await supabase
          .from('pool_entries')
          .update({
            display_name: displayName.trim() || null,
            tie_breaker_value: requiresTiebreaker ? parseInt(tieBreaker) : null
          })
          .eq('id', existingEntry.id)

        if (updateError) {
          setError('Error updating entry: ' + updateError.message)
          setSubmitting(false)
          return
        }

        entryId = existingEntry.id

        // Delete old picks
        await supabase
          .from('category_picks')
          .delete()
          .eq('pool_entry_id', entryId)

      } else {
        // CREATE new entry
        const { data: entry, error: entryError } = await supabase
          .from('pool_entries')
          .insert({
            pool_id: pool.id,
            entry_name: entryName.trim(),
            display_name: displayName.trim() || null,
            email: email.toLowerCase().trim(),
            tie_breaker_value: requiresTiebreaker ? parseInt(tieBreaker) : null
          })
          .select()
          .single()

        if (entryError) {
          if (entryError.code === '23505') {
            setError('This email or entry name is already used in this pool. If this is you, your picks should load automatically.')
          } else {
            setError(entryError.message)
          }
          setSubmitting(false)
          return
        }

        entryId = entry.id
      }

      // Insert picks
      const pickInserts = Object.entries(picks).map(([categoryId, optionId]) => ({
        pool_entry_id: entryId,
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

      // Save email to localStorage
      localStorage.setItem('pickcrown_email', email.toLowerCase().trim())

      setSubmitted(true)
    } catch (err) {
      setError('Unexpected error: ' + err.message)
      setSubmitting(false)
    }
  }

  if (loadingEntry) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>Loading...</div>
  }

  if (submitted) {
    return (
      <div
        style={{
          padding: 24,
          background: '#d4edda',
          borderRadius: 8,
          border: '1px solid #c3e6cb'
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {isEditMode ? '✅ Picks Updated!' : '✅ Picks Submitted!'}
        </h3>
        <p>
          Entry name: <strong>{entryName}</strong>
        </p>
        <p>We'll email results to: {email}</p>
        <a href={`/pool/${pool.id}/standings`}>View Standings →</a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Edit Mode Banner */}
      {isEditMode && (
        <div style={{
          padding: 16,
          marginBottom: 24,
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: 8,
          color: '#1e40af'
        }}>
          <strong>✏️ Edit Mode</strong>
          <p style={{ margin: '8px 0 0', fontSize: '14px' }}>
            You already have picks for this pool. Make changes below and click "Update Picks" to save.
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 16,
            marginBottom: 24,
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: 8,
            color: '#721c24'
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label
          style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
        >
          Entry Name *
        </label>
        <input
          type="text"
          value={entryName}
          onChange={(e) => setEntryName(e.target.value)}
          placeholder="e.g., Rich's Picks"
          required
          disabled={isEditMode} // Can't change name after first submit
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 4,
            background: isEditMode ? '#f3f4f6' : 'white'
          }}
        />
        {isEditMode && (
          <small style={{ color: '#666' }}>Entry name cannot be changed</small>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
        >
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={isEditMode} // Can't change email after first submit
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 4,
            background: isEditMode ? '#f3f4f6' : 'white'
          }}
        />
        <small style={{ color: '#666' }}>We'll use this for reminders and results</small>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
        >
          What should we call you?
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={email ? email.split('@')[0] : 'Your name'}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            border: '1px solid #ccc',
            borderRadius: 4
          }}
        />
        <small style={{ color: '#666' }}>This is how you'll appear on standings</small>
      </div>

      {requiresTiebreaker && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
          >
            {tiebreakerLabel} *
          </label>
          <input
            type="number"
            value={tieBreaker}
            onChange={(e) => setTieBreaker(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              border: '1px solid #ccc',
              borderRadius: 4
            }}
          />
        </div>
      )}

      <hr style={{ margin: '24px 0' }} />

      <h3>Make Your Picks</h3>

      {categories.map((category) => (
        <div key={category.id} style={{ marginBottom: 24 }}>
          <label
            style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}
          >
            {category.name}
          </label>
          <select
            value={picks[category.id] || ''}
            onChange={(e) => handlePick(category.id, e.target.value)}
            required
            style={{ width: '100%', padding: 12, fontSize: 16 }}
          >
            <option value="">-- Select --</option>
            {category.options?.map((option) => (
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
          background: isComplete ? (isEditMode ? '#3b82f6' : '#28a745') : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: isComplete ? 'pointer' : 'not-allowed'
        }}
      >
        {submitting 
          ? 'Saving...' 
          : isEditMode 
            ? '✏️ Update Picks' 
            : 'Submit All Picks'
        }
      </button>

      {isEditMode && (
        <p style={{ textAlign: 'center', marginTop: 16, color: '#666', fontSize: '14px' }}>
          You can update your picks until the event starts.
        </p>
      )}
    </form>
  )
}